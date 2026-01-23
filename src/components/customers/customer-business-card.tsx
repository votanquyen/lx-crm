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
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
    <div className="enterprise-card border-l-primary border-l-4 bg-gradient-to-r from-slate-50 to-white">
      <div className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Identity */}
          <div className="flex items-start gap-4">
            {/* Avatar/Initials */}
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-xl font-black",
                hasOverdue
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              {customer.companyName.substring(0, 2).toUpperCase()}
            </div>

            {/* Name & Tags */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {customer.companyName}
                </h1>
                <span className="rounded-md border bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  {customer.code}
                </span>
                <span className={cn("status-badge", status.className)}>{status.label}</span>
                {hasOverdue && (
                  <span className="status-badge flex items-center gap-1 border-rose-200 bg-rose-100 text-rose-700">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Nợ quá hạn
                  </span>
                )}
                {renewalSoon && (
                  <span className="status-badge flex animate-pulse items-center gap-1 border-amber-200 bg-amber-100 text-amber-700">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Sắp hết hạn HĐ
                  </span>
                )}
                {(stats?.notes ?? 0) > 0 && (
                  <span className="status-badge flex items-center gap-1 border-yellow-200 bg-yellow-50 text-yellow-700">
                    <StickyNote className="h-3 w-3" aria-hidden="true" />
                    {stats?.notes} ghi chú
                  </span>
                )}
              </div>

              {/* Address with copy */}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>
                  {customer.address}
                  {customer.district && `, ${customer.district}`}
                  {customer.city && `, ${customer.city}`}
                </span>
              </div>

              {/* Quick Contact Row */}
              <div className="flex flex-wrap items-center gap-4">
                {customer.contactPhone && (
                  <button
                    onClick={() => copyToClipboard(customer.contactPhone!, "phone")}
                    className="hover:border-primary/50 flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Phone className="text-primary h-3 w-3" aria-hidden="true" />
                    {customer.contactPhone}
                    {copiedField === "phone" ? (
                      <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-300" aria-hidden="true" />
                    )}
                  </button>
                )}
                {customer.contactEmail && (
                  <button
                    onClick={() => copyToClipboard(customer.contactEmail!, "email")}
                    className="hover:border-primary/50 flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Mail className="h-3 w-3 text-blue-500" aria-hidden="true" />
                    {customer.contactEmail}
                    {copiedField === "email" ? (
                      <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-300" aria-hidden="true" />
                    )}
                  </button>
                )}
                {customer.taxCode && (
                  <button
                    onClick={() => copyToClipboard(customer.taxCode!, "tax")}
                    className="hover:border-primary/50 flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <FileText className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    MST: {customer.taxCode}
                    {copiedField === "tax" ? (
                      <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3 w-3 text-slate-300" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Financial Summary & Actions */}
          <div className="flex shrink-0 flex-col items-end gap-4">
            {/* Financial KPIs */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Doanh thu/Tháng
                </p>
                <p className="flex items-center justify-end gap-1 text-xl font-black text-emerald-600">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  {formatCurrency(financials?.monthlyValue ?? 0)}
                </p>
              </div>
              <div className="bg-border h-10 w-px" />
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Công nợ
                </p>
                <p
                  className={cn(
                    "flex items-center justify-end gap-1 text-xl font-black",
                    hasDebt ? "text-rose-600" : "text-slate-400"
                  )}
                >
                  {hasDebt && <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
                  {formatCurrency(financials?.totalDebt ?? 0)}
                </p>
              </div>
            </div>

            {/* Action Buttons + Quick Actions Speed Dial */}
            <div className="flex items-center gap-2">
              {/* More Options Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-slate-700"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Tùy chọn khác</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/customers/${customer.id}?tab=notes`}>
                      <StickyNote className="mr-2 h-4 w-4" aria-hidden="true" />
                      Xem ghi chú ({stats?.notes ?? 0})
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Xóa khách hàng
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác. Khách hàng{" "}
                      <strong>{customer.companyName}</strong> và tất cả dữ liệu liên quan sẽ bị xóa
                      vĩnh viễn.
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
                  <Edit className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Chỉnh sửa
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 bg-blue-600 text-xs font-bold hover:bg-blue-700"
              >
                <Link href={`/invoices?customerId=${customer.id}`}>
                  <Receipt className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Xem hóa đơn
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Ribbon - Seamless Integration */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 border-t bg-slate-50/50 px-6 py-4 md:grid-cols-5">
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
          <MetricTile label="Ghi chú" value={stats.notes} icon={Edit} color="text-amber-600" />
        </div>
      )}
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="group flex cursor-default items-center gap-3">
      <div
        className={cn(
          "rounded-lg border bg-white p-2 shadow-sm transition-all group-hover:shadow-md",
          color.replace("text-", "bg-").replace("600", "50")
        )}
      >
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="text-lg leading-tight font-black text-slate-700">{value}</p>
      </div>
    </div>
  );
}
