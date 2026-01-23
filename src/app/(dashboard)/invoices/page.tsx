import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Receipt, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { getInvoices, getInvoiceStats } from "@/actions/invoices";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

// Dynamic import for heavy table component
const InvoiceTable = dynamic(
  () => import("@/components/invoices/invoice-table").then((m) => m.InvoiceTable),
  {
    loading: () => (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    ),
  }
);

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
      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Tổng hóa đơn</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="rounded bg-slate-50 p-2 text-slate-400">
            <Receipt className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Chờ thanh toán</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-amber-600">{stats.pending}</p>
          <div className="rounded bg-amber-50 p-2 text-amber-500">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-rose-100 bg-white p-5">
        <p className="kpi-title mb-2 text-rose-600">Quá hạn</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-rose-600">{stats.overdue}</p>
            <p className="text-[10px] font-bold tracking-tighter text-rose-400 uppercase">
              {formatCurrency(Number(stats.overdueAmount))}
            </p>
          </div>
          <div className="rounded bg-rose-50 p-2 text-rose-500">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2 text-blue-600">Tổng phải thu</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-blue-600">
            {formatCurrency(Number(stats.totalReceivables))}
          </p>
          <div className="rounded bg-blue-50 p-2 text-blue-500">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
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
        <div className="border-t bg-slate-50/30 p-4">
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
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Theo dõi Hóa đơn</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Quản lý hóa đơn VAT từ SmartVAS
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card bg-white p-5">
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        }
      >
        <InvoiceStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-slate-50/50 p-1">
        <Link
          href="/invoices"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            !status && !overdueOnly
              ? "text-primary border-primary/10 border bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="mx-1 h-3 w-px bg-slate-200" />
        <Link
          href="/invoices?status=SENT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "SENT"
              ? "text-primary border-primary/10 border bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã gửi
        </Link>
        <Link
          href="/invoices?status=PARTIAL"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "PARTIAL"
              ? "text-primary border-primary/10 border bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Thanh toán một phần
        </Link>
        <Link
          href="/invoices?overdueOnly=true"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            overdueOnly
              ? "border border-rose-100 bg-white text-rose-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Quá hạn
        </Link>
        <Link
          href="/invoices?status=PAID"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "PAID"
              ? "border border-emerald-100 bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã thanh toán
        </Link>
        <Link
          href="/invoices?status=DRAFT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "DRAFT"
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Nháp
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card space-y-4 bg-white p-4">
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
