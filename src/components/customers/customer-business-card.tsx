"use client";

import Link from "next/link";
import {
    MapPin,
    Phone,
    Mail,
    FileText,
    Edit,
    Receipt,
    Copy,
    Check,
    AlertTriangle,
    TrendingUp,
    Calendar,
    MoreVertical,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerStatus } from "@prisma/client";
import { deleteCustomer } from "@/actions/customers";

interface CustomerFinancialSummary {
    totalDebt: number;
    monthlyValue: number;
    activeContracts: number;
    overdueInvoices: number;
    nearestContractExpiry?: Date | string | null; // For Renewal Intelligence
}

interface CustomerStats {
    plants: number;
    contracts: number;
    invoices: number;
    notes: number;
    careSchedules: number;
}

interface CustomerBusinessCardProps {
    customer: {
        id: string;
        code: string;
        companyName: string;
        address: string;
        district: string | null;
        city: string | null;
        contactName: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        taxCode: string | null;
        status: CustomerStatus;
    };
    financials?: CustomerFinancialSummary;
    stats?: CustomerStats;
}

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
    ACTIVE: { label: "Hoạt động", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    LEAD: { label: "Tiềm năng", className: "bg-blue-100 text-blue-700 border-blue-200" },
    INACTIVE: { label: "Tạm ngưng", className: "bg-amber-100 text-amber-700 border-amber-200" },
    TERMINATED: { label: "Đã hủy", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export function CustomerBusinessCard({ customer, financials, stats }: CustomerBusinessCardProps) {
    const router = useRouter();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isPending, startTransition] = useTransition();
    const status = statusConfig[customer.status];
    const hasDebt = (financials?.totalDebt ?? 0) > 0;
    const hasOverdue = (financials?.overdueInvoices ?? 0) > 0;

    // Renewal Intelligence: Check if any contract expires within 30 days
    const renewalSoon = (() => {
        if (!financials?.nearestContractExpiry) return false;
        const expiryDate = new Date(financials.nearestContractExpiry);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
    })();

    const copyToClipboard = (value: string, field: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteCustomer(customer.id);
            if (result.success) {
                setShowDeleteDialog(false);
                router.push("/customers");
            }
        });
    };

    return (
        <div className="enterprise-card bg-gradient-to-r from-slate-50 to-white border-l-4 border-l-primary">
            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Identity */}
                    <div className="flex items-start gap-4">
                        {/* Avatar/Initials */}
                        <div className={cn(
                            "w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black shrink-0 border-2",
                            hasOverdue
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {customer.companyName.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Name & Tags */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {customer.companyName}
                                </h1>
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border">
                                    {customer.code}
                                </span>
                                <span className={cn("status-badge", status.className)}>
                                    {status.label}
                                </span>
                                {hasOverdue && (
                                    <span className="status-badge bg-rose-100 text-rose-700 border-rose-200 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Nợ quá hạn
                                    </span>
                                )}
                                {renewalSoon && (
                                    <span className="status-badge bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 animate-pulse">
                                        <Calendar className="h-3 w-3" />
                                        Sắp hết hạn HĐ
                                    </span>
                                )}
                            </div>

                            {/* Address with copy */}
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span>
                                    {customer.address}
                                    {customer.district && `, ${customer.district}`}
                                    {customer.city && `, ${customer.city}`}
                                </span>
                            </div>

                            {/* Quick Contact Row */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {customer.contactPhone && (
                                    <button
                                        onClick={() => copyToClipboard(customer.contactPhone!, "phone")}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-2 py-1 rounded-md hover:border-primary/50 transition-colors"
                                    >
                                        <Phone className="h-3 w-3 text-primary" />
                                        {customer.contactPhone}
                                        {copiedField === "phone" ? (
                                            <Check className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3 w-3 text-slate-300" />
                                        )}
                                    </button>
                                )}
                                {customer.contactEmail && (
                                    <button
                                        onClick={() => copyToClipboard(customer.contactEmail!, "email")}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-2 py-1 rounded-md hover:border-primary/50 transition-colors"
                                    >
                                        <Mail className="h-3 w-3 text-blue-500" />
                                        {customer.contactEmail}
                                        {copiedField === "email" ? (
                                            <Check className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3 w-3 text-slate-300" />
                                        )}
                                    </button>
                                )}
                                {customer.taxCode && (
                                    <button
                                        onClick={() => copyToClipboard(customer.taxCode!, "tax")}
                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border px-2 py-1 rounded-md hover:border-primary/50 transition-colors"
                                    >
                                        <FileText className="h-3 w-3 text-slate-400" />
                                        MST: {customer.taxCode}
                                        {copiedField === "tax" ? (
                                            <Check className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-3 w-3 text-slate-300" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Financial Summary & Actions */}
                    <div className="flex flex-col items-end gap-4 shrink-0">
                        {/* Financial KPIs */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doanh thu/Tháng</p>
                                <p className="text-xl font-black text-emerald-600 flex items-center justify-end gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    {formatCurrency(financials?.monthlyValue ?? 0)}
                                </p>
                            </div>
                            <div className="w-px h-10 bg-border" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Công nợ</p>
                                <p className={cn(
                                    "text-xl font-black flex items-center justify-end gap-1",
                                    hasDebt ? "text-rose-600" : "text-slate-400"
                                )}>
                                    {hasDebt && <AlertTriangle className="h-4 w-4" />}
                                    {formatCurrency(financials?.totalDebt ?? 0)}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons + Quick Actions Speed Dial */}
                        <div className="flex items-center gap-2">
                            {/* More Options Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-700">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Tùy chọn khác</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Xóa khách hàng
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Hành động này không thể hoàn tác. Khách hàng <strong>{customer.companyName}</strong> và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete();
                                            }}
                                            disabled={isPending}
                                            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
                                        >
                                            {isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <Button asChild variant="outline" size="sm" className="h-9 text-xs font-bold">
                                <Link href={`/customers/${customer.id}?action=edit&id=${customer.id}`}>
                                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                                    Chỉnh sửa
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700">
                                <Link href={`/invoices?customerId=${customer.id}`}>
                                    <Receipt className="mr-1.5 h-3.5 w-3.5" />
                                    Xem hóa đơn
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Ribbon - Seamless Integration */}
            {stats && (
                <div className="border-t bg-slate-50/50 px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MetricTile
                        label="Cây xanh"
                        value={stats.plants}
                        icon={TrendingUp} // Placeholder, ideally specific icons
                        color="text-emerald-600"
                    />
                    <MetricTile
                        label="Hợp đồng"
                        value={stats.contracts}
                        icon={FileText}
                        color="text-blue-600"
                    />
                    <MetricTile
                        label="Hóa đơn"
                        value={stats.invoices}
                        icon={Receipt}
                        color="text-indigo-600"
                    />
                    <MetricTile
                        label="Lịch CS"
                        value={stats.careSchedules}
                        icon={TrendingUp}
                        color="text-violet-600"
                    />
                    <MetricTile
                        label="Ghi chú"
                        value={stats.notes}
                        icon={Edit}
                        color="text-amber-600"
                    />
                </div>
            )}
        </div>
    );
}

function MetricTile({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className="flex items-center gap-3 group cursor-default">
            <div className={cn("p-2 rounded-lg bg-white border shadow-sm group-hover:shadow-md transition-all", color.replace("text-", "bg-").replace("600", "50"))}>
                <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-lg font-black text-slate-700 leading-tight">{value}</p>
            </div>
        </div>
    );
}
