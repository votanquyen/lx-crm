import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Receipt, AlertTriangle, DollarSign, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Invoices */}
      <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 text-slate-500 mb-2">
          <div className="p-1.5 bg-slate-100 rounded-md">
            <Receipt className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">Tổng hóa đơn</span>
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <div className="p-1.5 bg-amber-50 rounded-md">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">Chờ thanh toán</span>
        </div>
        <div>
          <span className="text-2xl font-black text-amber-600">{stats.pending}</span>
        </div>
      </div>

      {/* Overdue */}
      <div className="bg-rose-50/50 rounded-xl border border-rose-100 p-4 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <div className="p-1.5 bg-rose-100 rounded-md">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">Quá hạn</span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{stats.overdue}</span>
            <span className="text-xs font-bold text-rose-500">
              ({formatCurrency(Number(stats.overdueAmount))})
            </span>
          </div>
        </div>
      </div>

      {/* Total Receivables */}
      <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <DollarSign className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">Tổng phải thu</span>
        </div>
        <div>
          <span className="text-2xl font-black text-blue-600">
            {formatCurrency(Number(stats.totalReceivables))}
          </span>
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
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Hóa đơn VAT</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản lý và theo dõi hóa đơn GTGT từ hệ thống SmartVAS
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-white font-bold">
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hóa đơn
          </Link>
        </Button>
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200">
          {[
            { label: "Tất cả", value: undefined, count: null },
            { label: "Đã gửi", value: "SENT", count: null },
            { label: "TT một phần", value: "PARTIAL", count: null },
            { label: "Quá hạn", value: "OVERDUE", count: null },
            { label: "Đã TT", value: "PAID", count: null },
            { label: "Nháp", value: "DRAFT", count: null },
          ].map((item) => {
            const isActive = item.value === "OVERDUE"
              ? overdueOnly
              : status === item.value && !overdueOnly;

            // Handle special logic for "All" tab when status is undefined and not overdueOnly
            const isAllActive = item.value === undefined && !status && !overdueOnly;

            return (
              <Link
                key={item.label}
                href={
                  item.value === "OVERDUE"
                    ? "/invoices?overdueOnly=true"
                    : item.value
                      ? `/invoices?status=${item.value}`
                      : "/invoices"
                }
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                  isActive || isAllActive
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

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
