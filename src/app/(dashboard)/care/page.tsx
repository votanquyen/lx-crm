import { Suspense } from "react";
import Link from "next/link";
import { Plus, Calendar, CheckCircle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CareScheduleList } from "@/components/care/care-schedule-list";
import { Pagination } from "@/components/ui/pagination";
import { getCareSchedules, getCareStats } from "@/actions/care-schedules";
import { cn } from "@/lib/utils";
import type { CareStatus } from "@prisma/client";

interface CarePageProps {
  searchParams: Promise<{
    page?: string;
    status?: CareStatus;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

async function CareStats() {
  const stats = await getCareStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Hôm nay</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-slate-900">{stats.todayCount}</p>
            <p className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Lịch dự kiến
            </p>
          </div>
          <div className="rounded bg-slate-50 p-2 text-slate-400">
            <Calendar className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Đang thực hiện</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-blue-600">{stats.inProgress}</p>
          <div className="rounded bg-blue-50 p-2 text-blue-500">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Đã hoàn thành</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-emerald-600">{stats.completed}</p>
          <div className="rounded bg-emerald-50 p-2 text-emerald-500">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2">Hiệu suất</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-slate-900">{stats.completionRate}%</p>
            <p className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
              Tỷ lệ hoàn thành
            </p>
          </div>
          <div className="rounded bg-slate-50 p-2 text-slate-400">
            <Users className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function CareList({
  page,
  status,
  dateFrom,
  dateTo,
}: {
  page: number;
  status?: CareStatus;
  dateFrom?: string;
  dateTo?: string;
}) {
  const result = await getCareSchedules({
    page,
    limit: 20,
    status,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  return (
    <div className="enterprise-card overflow-hidden bg-white">
      <CareScheduleList schedules={result.data} />

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

export default async function CarePage({ searchParams }: CarePageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch chăm sóc</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Điều phối nhân sự và theo dõi dịch vụ tại hiện trường
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-white">
          <Link href="/care/new" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo lịch chăm sóc
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
        <CareStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-slate-50/50 p-1">
        <Link
          href="/care"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            !status
              ? "text-primary border-primary/10 border bg-white shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="mx-1 h-3 w-px bg-slate-200" />
        <Link
          href="/care?status=SCHEDULED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "SCHEDULED"
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đã lên lịch
        </Link>
        <Link
          href="/care?status=IN_PROGRESS"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "IN_PROGRESS"
              ? "border border-blue-100 bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đang thực hiện
        </Link>
        <Link
          href="/care?status=COMPLETED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "COMPLETED"
              ? "border border-emerald-100 bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Hoàn thành
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card space-y-4 bg-white p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        }
      >
        <CareList page={page} status={status} dateFrom={dateFrom} dateTo={dateTo} />
      </Suspense>
    </div>
  );
}
