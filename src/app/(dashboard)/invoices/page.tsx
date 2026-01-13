import { Suspense } from "react";
import Link from "next/link";
import { Plus, Receipt, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Pagination } from "@/components/ui/pagination";
import { getInvoices, getInvoiceStats } from "@/actions/invoices";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: InvoiceStatus;
    search?: string;
    overdueOnly?: string;
  }>;
}

async function InvoiceStats() {
  const stats = await getInvoiceStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="enterprise-card p-5 bg-white">
        <p className="kpi-title mb-2">Tổng hóa đơn</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="p-2 rounded bg-slate-50 text-slate-400">
            <Receipt className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white">
        <p className="kpi-title mb-2">Chờ thanh toán</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-amber-600">{stats.pending}</p>
          <div className="p-2 rounded bg-amber-50 text-amber-500">
            <Clock className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-rose-100">
        <p className="kpi-title mb-2 text-rose-600">Quá hạn</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-rose-600">{stats.overdue}</p>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
              {formatCurrency(Number(stats.overdueAmount))}
            </p>
          </div>
          <div className="p-2 rounded bg-rose-50 text-rose-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white">
        <p className="kpi-title mb-2 text-blue-600">Tổng phải thu</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-blue-600">
            {formatCurrency(Number(stats.totalReceivables))}
          </p>
          <div className="p-2 rounded bg-blue-50 text-blue-500">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function InvoiceList({
  page,
  status,
  search,
  overdueOnly,
}: {
  page: number;
  status?: InvoiceStatus;
  search?: string;
  overdueOnly?: boolean;
}) {
  const result = await getInvoices({ page, limit: 20, status, search, overdueOnly });

  return (
    <div className="enterprise-card overflow-hidden bg-white">
      <InvoiceTable invoices={result.data} />

      {result.pagination.totalPages > 1 && (
        <div className="p-4 border-t bg-slate-50/30">
          <Pagination
            page={result.pagination.page}
            limit={result.pagination.limit}
            total={result.pagination.total}
            totalPages={result.pagination.totalPages}
          />
        </div>
      )}
    </div>
  );
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const search = params.search;
  const overdueOnly = params.overdueOnly === "true";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hóa đơn</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Quản lý công nợ và lịch sử thanh toán đối tác
          </p>
        </div>
        <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-4">
          <Link href="/invoices/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo hóa đơn
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card p-5 bg-white">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        }
      >
        <InvoiceStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="flex items-center gap-1 p-1 border rounded-lg bg-slate-50/50 w-fit max-w-full overflow-x-auto scrollbar-hide">
        <Link
          href="/invoices"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            !status && !overdueOnly
              ? "bg-white text-primary shadow-sm border border-primary/10"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="w-px h-3 bg-slate-200 mx-1" />
        <Link
          href="/invoices?status=SENT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "SENT"
              ? "bg-white text-primary shadow-sm border border-primary/10"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã gửi
        </Link>
        <Link
          href="/invoices?status=PARTIAL"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "PARTIAL"
              ? "bg-white text-primary shadow-sm border border-primary/10"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Thanh toán một phần
        </Link>
        <Link
          href="/invoices?overdueOnly=true"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            overdueOnly
              ? "bg-white text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Quá hạn
        </Link>
        <Link
          href="/invoices?status=PAID"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "PAID"
              ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã thanh toán
        </Link>
        <Link
          href="/invoices?status=DRAFT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "DRAFT"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Nháp
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card bg-white p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        }
      >
        <InvoiceList page={page} status={status} search={search} overdueOnly={overdueOnly} />
      </Suspense>
    </div>
  );
}
