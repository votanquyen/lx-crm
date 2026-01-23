"use client";

import Link from "next/link";
import { FileText, Receipt, AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
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
    <div className="enterprise-card flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b bg-slate-50/50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase">
          <FileText className="text-primary h-4 w-4" aria-hidden="true" />
          Trung tâm xử lý
        </h3>
        <div className="flex gap-2">
          <Link
            href="/bang-ke"
            className="hover:text-primary text-[10px] font-bold tracking-tight text-slate-500 uppercase transition-colors"
          >
            Bảng kê ({pendingCount})
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/invoices"
            className="hover:text-primary text-[10px] font-bold tracking-tight text-slate-500 uppercase transition-colors"
          >
            Hóa đơn ({overdueCount + draftCount})
          </Link>
        </div>
      </div>

      <div className="flex-1 p-0">
        <Tabs defaultValue="pending" className="flex h-full w-full flex-col">
          <div className="px-4 pt-3 pb-0">
            <TabsList className="h-auto w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:border-primary data-[state=active]:text-primary gap-2 rounded-none px-1 pt-1 pb-2 text-xs font-bold text-slate-500 transition-all hover:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Chờ xuất hóa đơn
                {pendingCount > 0 && (
                  <span className="bg-primary rounded-full px-1.5 py-0.5 text-[9px] text-white">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="gap-2 rounded-none px-1 pt-1 pb-2 text-xs font-bold text-slate-500 transition-all hover:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:bg-transparent data-[state=active]:text-rose-600 data-[state=active]:shadow-none"
              >
                Thu hồi nợ
                {overdueCount > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] text-white">
                    {overdueCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="gap-2 rounded-none px-1 pt-1 pb-2 text-xs font-bold text-slate-500 transition-all hover:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-500 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
              >
                Hóa đơn nháp
                {draftCount > 0 && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-600">
                    {draftCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 bg-slate-50/20">
            <TabsContent value="pending" className="m-0 h-full">
              {data.pendingStatements.length === 0 ? (
                <EmptyState label="Không có bảng kê cần xử lý" />
              ) : (
                <div className="divide-border/50 divide-y">
                  {data.pendingStatements.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 transition-colors hover:bg-white"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded border",
                            item.status === "NEEDS_REVIEW"
                              ? "border-amber-100 bg-amber-50 text-amber-600"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600"
                          )}
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.customer}
                            </p>
                            <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-400">
                              {item.period}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                "font-bold",
                                item.status === "NEEDS_REVIEW"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              )}
                            >
                              {item.status === "NEEDS_REVIEW" ? "Cần duyệt" : "Sẵn sàng xuất đơn"}
                            </span>
                            <span>•</span>
                            <span>{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary h-8 text-xs font-bold transition-colors hover:text-white"
                      >
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
                <div className="divide-border/50 divide-y">
                  {data.overdueInvoices.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 transition-colors hover:bg-white"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-rose-100 bg-rose-50 text-rose-600">
                          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.customer}
                            </p>
                            <div className="flex items-center gap-1 rounded bg-rose-100 px-1.5 text-[10px] font-bold text-rose-600">
                              <span>Quá hạn</span>
                              <Clock className="h-3 w-3" aria-hidden="true" />
                            </div>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
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
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="hover:text-primary h-8 w-8 p-0 text-slate-400"
                        >
                          <Link href={`/invoices/${item.id}`}>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
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
                <div className="divide-border/50 divide-y">
                  {data.draftInvoices.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 transition-colors hover:bg-white"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-100 text-slate-500">
                          <Receipt className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.customer}
                            </p>
                            <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                              {format(new Date(item.date), "dd/MM/yyyy")}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-700">
                              {formatCurrency(item.amount)}
                            </span>
                            <span>•</span>
                            <span>{item.invoiceNumber}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 border-blue-200 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
                      >
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
    <div className="text-muted-foreground flex h-40 flex-col items-center justify-center">
      <CheckCircle2 className="mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
      <p className="text-xs font-bold tracking-tight text-slate-400 uppercase">{label}</p>
    </div>
  );
}
