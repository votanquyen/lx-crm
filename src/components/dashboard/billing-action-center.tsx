"use client";

import Link from "next/link";
import {
    FileText,
    Receipt,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getBillingActionItems } from "@/actions/dashboard-billing";

type ActionItems = Awaited<ReturnType<typeof getBillingActionItems>>;

interface BillingActionCenterProps {
    data: ActionItems;
}

export function BillingActionCenter({ data }: BillingActionCenterProps) {
    const pendingCount = data.pendingStatements.length;
    const overdueCount = data.overdueInvoices.length;
    const draftCount = data.draftInvoices.length;

    return (
        <div className="enterprise-card h-full flex flex-col overflow-hidden bg-white">
            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                    <FileText className="h-4 w-4 text-primary" />
                    Trung tâm xử lý
                </h3>
                <div className="flex gap-2">
                    <Link href="/bang-ke" className="text-[10px] font-bold text-slate-500 hover:text-primary uppercase tracking-tight transition-colors">
                        Bảng kê ({pendingCount})
                    </Link>
                    <span className="text-slate-300">|</span>
                    <Link href="/invoices" className="text-[10px] font-bold text-slate-500 hover:text-primary uppercase tracking-tight transition-colors">
                        Hóa đơn ({overdueCount + draftCount})
                    </Link>
                </div>
            </div>

            <div className="flex-1 p-0">
                <Tabs defaultValue="pending" className="w-full h-full flex flex-col">
                    <div className="px-4 pt-3 pb-0">
                        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-4">
                            <TabsTrigger
                                value="pending"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none pb-2 pt-1 px-1 font-bold text-xs text-slate-500 hover:text-slate-900 transition-all gap-2"
                            >
                                Chờ xuất hóa đơn
                                {pendingCount > 0 && (
                                    <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="overdue"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-600 rounded-none pb-2 pt-1 px-1 font-bold text-xs text-slate-500 hover:text-slate-900 transition-all gap-2"
                            >
                                Thu hồi nợ
                                {overdueCount > 0 && (
                                    <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{overdueCount}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="draft"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-500 data-[state=active]:text-slate-900 rounded-none pb-2 pt-1 px-1 font-bold text-xs text-slate-500 hover:text-slate-900 transition-all gap-2"
                            >
                                Hóa đơn nháp
                                {draftCount > 0 && (
                                    <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full">{draftCount}</span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 bg-slate-50/20">
                        <TabsContent value="pending" className="m-0 h-full">
                            {data.pendingStatements.length === 0 ? (
                                <EmptyState label="Không có bảng kê cần xử lý" />
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {data.pendingStatements.map((item) => (
                                        <div key={item.id} className="p-3 hover:bg-white transition-colors flex items-center justify-between group">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className={cn(
                                                    "w-8 h-8 rounded flex items-center justify-center shrink-0 border",
                                                    item.status === 'NEEDS_REVIEW' ? "bg-amber-50 border-amber-100 text-amber-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                )}>
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{item.customer}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{item.period}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span className={cn(
                                                            "font-bold",
                                                            item.status === 'NEEDS_REVIEW' ? "text-amber-600" : "text-emerald-600"
                                                        )}>
                                                            {item.status === 'NEEDS_REVIEW' ? "Cần duyệt" : "Sẵn sàng xuất đơn"}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{formatCurrency(item.amount)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary hover:text-white transition-colors">
                                                <Link href={`/invoices?customerId=${item.customerId}`}>Xem hóa đơn</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="overdue" className="m-0 h-full">
                            {data.overdueInvoices.length === 0 ? (
                                <EmptyState label="Không có nợ quá hạn" />
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {data.overdueInvoices.map((item) => (
                                        <div key={item.id} className="p-3 hover:bg-white transition-colors flex items-center justify-between group">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{item.customer}</p>
                                                        <div className="flex items-center gap-1 text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 rounded">
                                                            <span>Quá hạn</span>
                                                            <Clock className="h-3 w-3" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span className="font-black text-rose-600">
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{item.invoiceNumber}</span>
                                                        {item.phone && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{item.phone}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-primary">
                                                    <Link href={`/invoices/${item.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="draft" className="m-0 h-full">
                            {data.draftInvoices.length === 0 ? (
                                <EmptyState label="Không có hóa đơn nháp" />
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {data.draftInvoices.map((item) => (
                                        <div key={item.id} className="p-3 hover:bg-white transition-colors flex items-center justify-between group">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                                                    <Receipt className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-slate-900 truncate">{item.customer}</p>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 rounded">
                                                            {format(new Date(item.date), "dd/MM/yyyy")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <span className="font-bold text-slate-700">
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{item.invoiceNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                                                <Link href={`/invoices/${item.id}`}>Gửi ngay</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold uppercase tracking-tight text-slate-400">{label}</p>
        </div>
    )
}
