import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock, User, Phone, ArrowLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

async function TodaySchedulesContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // Fetch today's schedules
  const schedules = await prisma.careSchedule.findMany({
    where: {
      scheduledDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          address: true,
          district: true,
          contactName: true,
          contactPhone: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { scheduledTime: "asc" }],
  });

  const stats = {
    total: schedules.length,
    scheduled: schedules.filter((s) => s.status === "SCHEDULED").length,
    inProgress: schedules.filter((s) => s.status === "IN_PROGRESS").length,
    completed: schedules.filter((s) => s.status === "COMPLETED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Điều phối thực địa</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm font-medium">
            <Calendar className="text-primary h-3.5 w-3.5" aria-hidden="true" />
            {format(today, "EEEE, dd 'Tháng' MM, yyyy", { locale: vi })}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-9 border-slate-200 px-4 font-bold text-slate-600 hover:bg-slate-50"
        >
          <Link href="/care" className="gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Lịch tổng quát
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="enterprise-card bg-white p-4">
          <p className="kpi-title mb-1 text-slate-500">Tổng lịch hôm nay</p>
          <p className="kpi-value text-slate-900">{stats.total}</p>
        </div>
        <div className="enterprise-card border-blue-100 bg-white p-4">
          <p className="kpi-title mb-1 text-blue-600">Chờ thực hiện</p>
          <p className="kpi-value text-blue-600">{stats.scheduled}</p>
        </div>
        <div className="enterprise-card border-amber-100 bg-white p-4">
          <p className="kpi-title mb-1 text-amber-600">Đang xử lý</p>
          <p className="kpi-value text-amber-600">{stats.inProgress}</p>
        </div>
        <div className="enterprise-card border-emerald-100 bg-white p-4">
          <p className="kpi-title mb-1 text-emerald-600">Đã xong</p>
          <p className="kpi-value text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Schedules List Header */}
      <div className="enterprise-card overflow-hidden bg-white">
        <div className="flex h-10 items-center border-b bg-slate-50 px-4">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Danh sách nhiệm vụ hôm nay
          </span>
        </div>

        <div className="divide-border/50 divide-y">
          {schedules.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-slate-50 text-slate-200 shadow-sm">
                <Calendar className="h-8 w-8" aria-hidden="true" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Hôm nay không có lịch</h4>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Nhân sự có thể tập trung các công việc khác.
              </p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="data-table-row group flex min-h-[80px] flex-col gap-4 p-4 md:flex-row md:items-center"
              >
                {/* Status Icon */}
                <div className="group-hover:bg-primary/5 group-hover:border-primary/20 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors md:flex">
                  <Clock
                    className={cn(
                      "h-5 w-5",
                      schedule.status === "COMPLETED"
                        ? "text-emerald-500"
                        : schedule.status === "IN_PROGRESS"
                          ? "text-blue-500"
                          : "text-slate-300"
                    )}
                  />
                </div>

                {/* Customer & Time */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Link
                      href={`/customers/${schedule.customer.id}`}
                      className="hover:text-primary block truncate text-sm font-black text-slate-900 transition-colors"
                    >
                      {schedule.customer.companyName}
                    </Link>
                    <div
                      className={cn(
                        "status-badge origin-left scale-75",
                        schedule.status === "COMPLETED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : schedule.status === "IN_PROGRESS"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      {schedule.status === "COMPLETED"
                        ? "Đã xong"
                        : schedule.status === "IN_PROGRESS"
                          ? "Đang xử lý"
                          : "Chờ xử lý"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-tight uppercase">
                      <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
                      {schedule.customer.address}
                    </div>
                    {schedule.scheduledTime && (
                      <div className="text-primary flex items-center gap-1 text-[10px] font-bold tracking-tight uppercase">
                        <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                        {String(schedule.scheduledTime)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ops Info */}
                <div className="flex shrink-0 flex-col md:w-48">
                  <div className="mb-1 flex items-center gap-2">
                    <User className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span className="text-xs font-bold text-slate-600">
                      {schedule.staff?.name || "Chưa phân công"}
                    </span>
                  </div>
                  {schedule.customer.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="text-primary/60 h-3 w-3" aria-hidden="true" />
                      <span className="text-primary text-xs font-black">
                        {schedule.customer.contactPhone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between gap-3 md:w-32 md:justify-end">
                  <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-slate-400 uppercase md:hidden">
                    Thao tác
                  </div>
                  <div className="flex items-center gap-2">
                    {schedule.status === "SCHEDULED" && (
                      <Link href={`/care/${schedule.id}/complete`}>
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 h-8 px-3 text-[10px] font-bold tracking-tighter text-white uppercase shadow-sm"
                        >
                          Bắt đầu
                        </Button>
                      </Link>
                    )}
                    {schedule.status === "IN_PROGRESS" && (
                      <Link href={`/care/${schedule.id}/complete`}>
                        <Button
                          size="sm"
                          className="h-8 bg-blue-600 px-3 text-[10px] font-bold tracking-tighter text-white uppercase shadow-sm hover:bg-blue-700"
                        >
                          Cập nhật
                        </Button>
                      </Link>
                    )}
                    <Link href={`/care/${schedule.id}`}>
                      <Button size="sm" variant="outline" className="h-8 w-8 border-slate-200 p-0">
                        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default async function TodayCarePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card bg-white p-4">
                <Skeleton className="mb-2 h-3 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
          <div className="enterprise-card overflow-hidden bg-white">
            <div className="h-10 border-b bg-slate-50" />
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <TodaySchedulesContent />
    </Suspense>
  );
}
