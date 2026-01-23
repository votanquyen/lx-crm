/**
 * Care Schedule Table Component
 */
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Play,
  XCircle,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CareStatus } from "@prisma/client";

// Accept both Date and string for serialization compatibility
type DateOrString = Date | string;

type CareSchedule = {
  id: string;
  scheduledDate: DateOrString;
  scheduledTime: DateOrString | string | null;
  status: CareStatus;
  notes: string | null;
  checkInTime?: DateOrString | null;
  checkOutTime?: DateOrString | null;
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  staff: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

interface CareScheduleListProps {
  schedules: CareSchedule[];
  onCheckIn?: (id: string) => void;
  onComplete?: (id: string) => void;
  onSkip?: (id: string) => void;
}

export function CareScheduleList({
  schedules,
  onCheckIn,
  onComplete,
  onSkip,
}: CareScheduleListProps) {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 border-b bg-slate-50/80 backdrop-blur-sm">
        <div className="flex h-10 items-center">
          <div className="text-muted-foreground w-[180px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Thời gian
          </div>
          <div className="text-muted-foreground flex-1 px-4 text-[10px] font-bold tracking-widest uppercase">
            Đối tác / Địa chỉ
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Nhân sự / Trạng thái
          </div>
          <div className="text-muted-foreground w-48 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Ghi chú / Check-in
          </div>
          <div className="w-12 shrink-0 px-4"></div>
        </div>
      </div>

      <div className="divide-border/50 divide-y">
        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-slate-50 text-slate-200 shadow-sm">
              <Calendar className="h-8 w-8" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Không có lịch chăm sóc</h4>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Hệ thống chưa ghi nhận lịch trình trong kỳ này.
            </p>
          </div>
        ) : (
          schedules.map((schedule) => {
            // Ensure scheduledTime is a renderable string
            const displayTime =
              schedule.scheduledTime instanceof Date
                ? format(schedule.scheduledTime, "HH:mm")
                : typeof schedule.scheduledTime === "string"
                  ? schedule.scheduledTime
                  : "Chưa định giờ";

            return (
              <div
                key={schedule.id}
                className="data-table-row group flex min-h-[72px] items-center py-3"
              >
                {/* Time & Date */}
                <div className="w-[180px] shrink-0 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded border",
                        schedule.status === "COMPLETED"
                          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                          : schedule.status === "IN_PROGRESS"
                            ? "border-blue-100 bg-blue-50 text-blue-600"
                            : "group-hover:border-primary/20 group-hover:bg-primary/5 border-slate-200 bg-white text-slate-400 transition-colors"
                      )}
                    >
                      <span className="text-[10px] leading-none font-black uppercase">
                        {format(new Date(schedule.scheduledDate), "MMM", { locale: vi })}
                      </span>
                      <span className="mt-0.5 text-lg leading-none font-black">
                        {format(new Date(schedule.scheduledDate), "dd")}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-bold text-slate-900">
                        {format(new Date(schedule.scheduledDate), "EEEE", { locale: vi })}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                        {displayTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer & Address */}
                <div className="min-w-0 flex-1 px-4">
                  <Link
                    href={`/customers/${schedule.customer.id}`}
                    className="hover:text-primary block truncate text-xs font-bold text-slate-900 transition-colors"
                  >
                    {schedule.customer.companyName}
                  </Link>
                  <div className="mt-0.5 flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="text-muted-foreground line-clamp-1 text-[10px] font-bold tracking-tight">
                      {schedule.customer.address}
                      {schedule.customer.district && `, ${schedule.customer.district}`}
                    </span>
                  </div>
                </div>

                {/* Staff & Status */}
                <div className="w-40 shrink-0 px-4">
                  <div className="flex flex-col gap-1.5">
                    <div
                      className={cn(
                        "status-badge origin-left scale-90",
                        schedule.status === "COMPLETED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : schedule.status === "IN_PROGRESS"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : schedule.status === "SCHEDULED"
                              ? "border-slate-200 bg-slate-50 text-slate-600"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                      )}
                    >
                      {schedule.status === "COMPLETED"
                        ? "Hoàn thành"
                        : schedule.status === "IN_PROGRESS"
                          ? "Đang thực hiện"
                          : schedule.status === "SCHEDULED"
                            ? "Đã lên lịch"
                            : "Đã hủy"}
                    </div>
                    {schedule.staff && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                        <span className="truncate text-[10px] font-bold text-slate-600">
                          {schedule.staff.name ||
                            (schedule.staff.email ? schedule.staff.email.split("@")[0] : "N/A")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Check-in Info */}
                <div className="w-48 shrink-0 px-4">
                  <div className="flex flex-col">
                    {schedule.notes ? (
                      <p className="mb-1 line-clamp-1 text-[10px] font-medium text-slate-500 italic">
                        "{schedule.notes}"
                      </p>
                    ) : (
                      <span className="mb-1 text-[10px] font-bold tracking-tighter text-slate-300 uppercase">
                        Không có ghi chú
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      {schedule.checkInTime && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>{format(new Date(schedule.checkInTime), "HH:mm")}</span>
                        </div>
                      )}
                      {schedule.checkOutTime && (
                        <>
                          <ChevronRight className="h-2.5 w-2.5 text-slate-300" aria-hidden="true" />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                            <span>{format(new Date(schedule.checkOutTime), "HH:mm")}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex w-12 shrink-0 justify-end px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary h-8 w-8 text-slate-400 transition-colors"
                        aria-label="Tùy chọn"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        asChild
                        className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                      >
                        <Link href={`/care/${schedule.id}`}>
                          <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                          Chi tiết lịch trình
                        </Link>
                      </DropdownMenuItem>
                      {schedule.status === "SCHEDULED" && onCheckIn && (
                        <DropdownMenuItem
                          onClick={() => onCheckIn(schedule.id)}
                          className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                        >
                          <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                          Bắt đầu làm việc
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "IN_PROGRESS" && onComplete && (
                        <DropdownMenuItem
                          onClick={() => onComplete(schedule.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-emerald-600 uppercase"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hoàn tất dịch vụ
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                        className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                      >
                        <Link href={`/care/${schedule.id}/complete`}>
                          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Nhập báo cáo
                        </Link>
                      </DropdownMenuItem>
                      {schedule.status === "SCHEDULED" && onSkip && (
                        <DropdownMenuItem
                          onClick={() => onSkip(schedule.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-rose-600 uppercase focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hủy lịch trình
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
