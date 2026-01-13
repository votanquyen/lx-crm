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
    orderBy: [
      { status: "asc" },
      { scheduledTime: "asc" },
    ],
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Điều phối thực địa</h1>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {format(today, "EEEE, dd 'Tháng' MM, yyyy", { locale: vi })}
          </p>
        </div>
        <Button asChild variant="outline" className="h-9 border-slate-200 text-slate-600 font-bold px-4 hover:bg-slate-50">
          <Link href="/care" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Lịch tổng quát
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enterprise-card p-4 bg-white">
          <p className="kpi-title mb-1 text-slate-500">Tổng lịch hôm nay</p>
          <p className="kpi-value text-slate-900">{stats.total}</p>
        </div>
        <div className="enterprise-card p-4 bg-white border-blue-100">
          <p className="kpi-title mb-1 text-blue-600">Chờ thực hiện</p>
          <p className="kpi-value text-blue-600">{stats.scheduled}</p>
        </div>
        <div className="enterprise-card p-4 bg-white border-amber-100">
          <p className="kpi-title mb-1 text-amber-600">Đang xử lý</p>
          <p className="kpi-value text-amber-600">{stats.inProgress}</p>
        </div>
        <div className="enterprise-card p-4 bg-white border-emerald-100">
          <p className="kpi-title mb-1 text-emerald-600">Đã xong</p>
          <p className="kpi-value text-emerald-600">{stats.completed}</p>
        </div>
      </div>

      {/* Schedules List Header */}
      <div className="enterprise-card overflow-hidden bg-white">
        <div className="bg-slate-50 border-b px-4 h-10 flex items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Danh sách nhiệm vụ hôm nay</span>
        </div>

        <div className="divide-y divide-border/50">
          {schedules.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-4 border shadow-sm">
                <Calendar className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Hôm nay không có lịch</h4>
              <p className="text-sm font-medium text-slate-400 mt-1">Nhân sự có thể tập trung các công việc khác.</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-col md:flex-row md:items-center data-table-row group p-4 gap-4 min-h-[80px]">
                {/* Status Icon */}
                <div className="hidden md:flex w-10 h-10 rounded-full border items-center justify-center shrink-0 transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
                  <Clock className={cn(
                    "h-5 w-5",
                    schedule.status === "COMPLETED" ? "text-emerald-500" :
                      schedule.status === "IN_PROGRESS" ? "text-blue-500" :
                        "text-slate-300"
                  )} />
                </div>

                {/* Customer & Time */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/customers/${schedule.customer.id}`}
                      className="text-sm font-black text-slate-900 hover:text-primary transition-colors truncate block"
                    >
                      {schedule.customer.companyName}
                    </Link>
                    <div className={cn(
                      "status-badge scale-75 origin-left",
                      schedule.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        schedule.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {schedule.status === "COMPLETED" ? "Đã xong" :
                        schedule.status === "IN_PROGRESS" ? "Đang xử lý" : "Chờ xử lý"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <MapPin className="h-2.5 w-2.5" />
                      {schedule.customer.address}
                    </div>
                    {schedule.scheduledTime && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-tight">
                        <Clock className="h-2.5 w-2.5" />
                        {String(schedule.scheduledTime)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ops Info */}
                <div className="flex flex-col md:w-48 shrink-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {schedule.staff?.name || "Chưa phân công"}
                    </span>
                  </div>
                  {schedule.customer.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-primary/60" />
                      <span className="text-xs font-black text-primary">
                        {schedule.customer.contactPhone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 md:w-32">
                  <div className="flex md:hidden items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Thao tác
                  </div>
                  <div className="flex items-center gap-2">
                    {schedule.status === "SCHEDULED" && (
                      <Link href={`/care/${schedule.id}/complete`}>
                        <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white font-bold px-3 text-[10px] uppercase tracking-tighter shadow-sm">
                          Bắt đầu
                        </Button>
                      </Link>
                    )}
                    {schedule.status === "IN_PROGRESS" && (
                      <Link href={`/care/${schedule.id}/complete`}>
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 text-[10px] uppercase tracking-tighter shadow-sm">
                          Cập nhật
                        </Button>
                      </Link>
                    )}
                    <Link href={`/care/${schedule.id}`}>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-slate-200">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card p-4 bg-white">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
          <div className="enterprise-card bg-white overflow-hidden">
            <div className="h-10 bg-slate-50 border-b" />
            <div className="p-4 space-y-4">
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
