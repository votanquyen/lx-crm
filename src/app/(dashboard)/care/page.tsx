/**
 * Care Schedule Page
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Calendar, CheckCircle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CareScheduleList } from "@/components/care/care-schedule-list";
import { Pagination } from "@/components/ui/pagination";
import { getCareSchedules, getCareStats } from "@/actions/care-schedules";
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayCount}</div>
          <p className="text-xs text-muted-foreground">lịch chăm sóc</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang thực hiện</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completionRate}%</div>
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <CareScheduleList schedules={result.data} />

      {result.pagination.totalPages > 1 && (
        <Pagination
          page={result.pagination.page}
          limit={result.pagination.limit}
          total={result.pagination.total}
          totalPages={result.pagination.totalPages}
        />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch chăm sóc</h1>
          <p className="text-muted-foreground">
            Quản lý lịch chăm sóc cây tại khách hàng
          </p>
        </div>
        <Button asChild>
          <Link href="/care/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch mới
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <CareStats />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/care"
          className={`px-3 py-1.5 rounded-full text-sm ${
            !status ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Tất cả
        </Link>
        <Link
          href="/care?status=SCHEDULED"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "SCHEDULED" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đã lên lịch
        </Link>
        <Link
          href="/care?status=IN_PROGRESS"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "IN_PROGRESS" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đang thực hiện
        </Link>
        <Link
          href="/care?status=COMPLETED"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "COMPLETED" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Hoàn thành
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        }
      >
        <CareList page={page} status={status} dateFrom={dateFrom} dateTo={dateTo} />
      </Suspense>
    </div>
  );
}
