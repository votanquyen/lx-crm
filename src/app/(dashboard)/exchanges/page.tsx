import { Suspense } from "react";
import Link from "next/link";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExchangeTable } from "@/components/exchanges/exchange-table";
import { Pagination } from "@/components/ui/pagination";
import { getExchangeRequests, getExchangeStats } from "@/actions/exchange-requests";
import { cn } from "@/lib/utils";
import type { ExchangeStatus, ExchangePriority } from "@prisma/client";

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
      <div className="enterprise-card p-5 bg-white">
        <p className="kpi-title mb-2 text-slate-500">Tổng yêu cầu</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="p-2 rounded bg-slate-50 text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-amber-100">
        <p className="kpi-title mb-2 text-amber-600">Chờ duyệt</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-amber-600">{stats.pending}</p>
          <div className="p-2 rounded bg-amber-50 text-amber-500">
            <Clock className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-blue-100">
        <p className="kpi-title mb-2 text-blue-600">Đã duyệt</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-blue-600">{stats.scheduled}</p>
          <div className="p-2 rounded bg-blue-50 text-blue-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-rose-100">
        <p className="kpi-title mb-2 text-rose-600">Gấp/Khẩn cấp</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-rose-600">{stats.urgent}</p>
          <div className="p-2 rounded bg-rose-50 text-rose-500">
            <AlertTriangle className="h-4 w-4" />
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

export default async function ExchangesPage({ searchParams }: ExchangesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const priority = params.priority;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yêu cầu đổi cây</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Quản lý yêu cầu thay thế và bảo hành cây từ khách hàng
          </p>
        </div>
        <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-4">
          <Link href="/exchanges/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo yêu cầu
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
        <ExchangeStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="flex items-center gap-1 p-1 border rounded-lg bg-slate-50/50 w-fit max-w-full overflow-x-auto scrollbar-hide">
        <Link
          href="/exchanges"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            !status && !priority
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="w-px h-3 bg-slate-200 mx-1" />
        <Link
          href="/exchanges?status=PENDING"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "PENDING"
              ? "bg-white text-amber-600 shadow-sm border border-amber-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Chờ duyệt
        </Link>
        <Link
          href="/exchanges?status=SCHEDULED"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "SCHEDULED"
              ? "bg-white text-blue-600 shadow-sm border border-blue-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã duyệt
        </Link>
        <Link
          href="/exchanges?priority=URGENT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            priority === "URGENT"
              ? "bg-white text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Khẩn cấp
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card bg-white p-4 space-y-4">
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
