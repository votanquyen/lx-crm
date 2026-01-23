/**
 * Daily Schedule Page
 * Create and manage daily exchange routes
 */
import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyScheduleBuilder } from "@/components/exchanges/daily-schedule-builder";
import { getDailyScheduleByDate, getScheduleStats } from "@/actions/daily-schedules";
import { getPendingExchanges } from "@/actions/exchange-requests";

interface DailySchedulePageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

async function ScheduleStats() {
  const stats = await getScheduleStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Tổng lịch trình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Bản nháp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Đã duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Hoàn thành</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ScheduleContent({ date }: { date?: string }) {
  const scheduleDate = date ? new Date(date) : new Date();
  scheduleDate.setHours(0, 0, 0, 0);

  const [schedule, pendingRequests] = await Promise.all([
    getDailyScheduleByDate(scheduleDate),
    getPendingExchanges(),
  ]);

  return (
    <DailyScheduleBuilder
      scheduleDate={scheduleDate}
      existingSchedule={schedule}
      pendingRequests={pendingRequests}
    />
  );
}

export default async function DailySchedulePage({ searchParams }: DailySchedulePageProps) {
  const params = await searchParams;
  const date = params.date;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch trình hàng ngày</h1>
          <p className="mt-1 text-gray-600">Tạo và quản lý lộ trình đổi cây theo ngày</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/exchanges">
              <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
              Xem tất cả yêu cầu
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <ScheduleStats />
      </Suspense>

      {/* Schedule Builder */}
      <Suspense
        fallback={
          <div className="flex h-96 animate-pulse items-center justify-center rounded-lg bg-gray-100">
            <p className="text-gray-400">Đang tải lịch trình...</p>
          </div>
        }
      >
        <ScheduleContent date={date} />
      </Suspense>
    </div>
  );
}
