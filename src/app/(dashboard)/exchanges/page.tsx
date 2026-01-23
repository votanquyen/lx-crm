import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { getExchangeRequests, getExchangeStats } from "@/actions/exchange-requests";
import { cn } from "@/lib/utils";
import type { ExchangeStatus, ExchangePriority } from "@prisma/client";

// Dynamic import for heavy table component
const ExchangeTable = dynamic(
  () => import("@/components/exchanges/exchange-table").then((m) => m.ExchangeTable),
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

interface ExchangesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: ExchangeStatus;
    priority?: ExchangePriority;
  }>;
}

async function ExchangeStats() {
  const stats = await getExchangeStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2 text-slate-500">Tổng yêu cầu</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="rounded bg-slate-50 p-2 text-slate-400">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-amber-100 bg-white p-5">
        <p className="kpi-title mb-2 text-amber-600">Chờ duyệt</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-amber-600">{stats.pending}</p>
          <div className="rounded bg-amber-50 p-2 text-amber-500">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-blue-100 bg-white p-5">
        <p className="kpi-title mb-2 text-blue-600">Đã duyệt</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-blue-600">{stats.scheduled}</p>
          <div className="rounded bg-blue-50 p-2 text-blue-500">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-rose-100 bg-white p-5">
        <p className="kpi-title mb-2 text-rose-600">Gấp/Khẩn cấp</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-rose-600">{stats.urgent}</p>
          <div className="rounded bg-rose-50 p-2 text-rose-500">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ExchangeList({
  page,
  status,
  priority,
}: {
  page: number;
  status?: ExchangeStatus;
  priority?: ExchangePriority;
}) {
  const result = await getExchangeRequests({ page, limit: 20, status, priority });

  return (
    <div className="enterprise-card overflow-hidden bg-white">
      <ExchangeTable requests={result.data} />

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

export default async function ExchangesPage({ searchParams }: ExchangesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const priority = params.priority;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yêu cầu đổi cây</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Quản lý yêu cầu thay thế và bảo hành cây từ khách hàng
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-white">
          <Link href="/exchanges/new" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo yêu cầu
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
        <ExchangeStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-slate-50/50 p-1">
        <Link
          href="/exchanges"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            !status && !priority
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="mx-1 h-3 w-px bg-slate-200" />
        <Link
          href="/exchanges?status=PENDING"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "PENDING"
              ? "border border-amber-100 bg-white text-amber-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Chờ duyệt
        </Link>
        <Link
          href="/exchanges?status=SCHEDULED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "SCHEDULED"
              ? "border border-blue-100 bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã duyệt
        </Link>
        <Link
          href="/exchanges?priority=URGENT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            priority === "URGENT"
              ? "border border-rose-100 bg-white text-rose-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Khẩn cấp
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card space-y-4 bg-white p-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
      >
        <ExchangeList page={page} status={status} priority={priority} />
      </Suspense>
    </div>
  );
}
