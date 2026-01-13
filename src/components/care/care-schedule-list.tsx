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
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b">
        <div className="flex items-center h-10">
          <div className="w-[180px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Thời gian</div>
          <div className="flex-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đối tác / Địa chỉ</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Nhân sự / Trạng thái</div>
          <div className="w-48 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Ghi chú / Check-in</div>
          <div className="w-12 px-4 shrink-0"></div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-4 border shadow-sm">
              <Calendar className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Không có lịch chăm sóc</h4>
            <p className="text-sm font-medium text-slate-400 mt-1">Hệ thống chưa ghi nhận lịch trình trong kỳ này.</p>
          </div>
        ) : (
          schedules.map((schedule) => {
            // Ensure scheduledTime is a renderable string
            const displayTime = schedule.scheduledTime instanceof Date
              ? format(schedule.scheduledTime, "HH:mm")
              : typeof schedule.scheduledTime === 'string'
                ? schedule.scheduledTime
                : "Chưa định giờ";

            return (
              <div key={schedule.id} className="flex items-center data-table-row group py-3 min-h-[72px]">
                {/* Time & Date */}
                <div className="w-[180px] px-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded flex flex-col items-center justify-center border shrink-0",
                      schedule.status === "COMPLETED" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                        schedule.status === "IN_PROGRESS" ? "bg-blue-50 border-blue-100 text-blue-600" :
                          "bg-white border-slate-200 text-slate-400 group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors"
                    )}>
                      <span className="text-[10px] font-black uppercase leading-none">{format(new Date(schedule.scheduledDate), "MMM", { locale: vi })}</span>
                      <span className="text-lg font-black leading-none mt-0.5">{format(new Date(schedule.scheduledDate), "dd")}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {format(new Date(schedule.scheduledDate), "EEEE", { locale: vi })}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {displayTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer & Address */}
                <div className="flex-1 px-4 min-w-0">
                  <Link
                    href={`/customers/${schedule.customer.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-primary transition-colors block truncate"
                  >
                    {schedule.customer.companyName}
                  </Link>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight line-clamp-1">
                      {schedule.customer.address}
                      {schedule.customer.district && `, ${schedule.customer.district}`}
                    </span>
                  </div>
                </div>

                {/* Staff & Status */}
                <div className="w-40 px-4 shrink-0">
                  <div className="flex flex-col gap-1.5">
                    <div className={cn(
                      "status-badge scale-90 origin-left",
                      schedule.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        schedule.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          schedule.status === "SCHEDULED" ? "bg-slate-50 text-slate-600 border-slate-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {schedule.status === "COMPLETED" ? "Hoàn thành" :
                        schedule.status === "IN_PROGRESS" ? "Đang thực hiện" :
                          schedule.status === "SCHEDULED" ? "Đã lên lịch" : "Đã hủy"}
                    </div>
                    {schedule.staff && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-2.5 w-2.5 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600 truncate">
                          {schedule.staff.name || (schedule.staff.email ? schedule.staff.email.split('@')[0] : "N/A")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Check-in Info */}
                <div className="w-48 px-4 shrink-0">
                  <div className="flex flex-col">
                    {schedule.notes ? (
                      <p className="text-[10px] font-medium text-slate-500 italic line-clamp-1 mb-1">
                        "{schedule.notes}"
                      </p>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mb-1">Không có ghi chú</span>
                    )}
                    <div className="flex items-center gap-3">
                      {schedule.checkInTime && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{format(new Date(schedule.checkInTime), "HH:mm")}</span>
                        </div>
                      )}
                      {schedule.checkOutTime && (
                        <>
                          <ChevronRight className="h-2.5 w-2.5 text-slate-300" />
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{format(new Date(schedule.checkOutTime), "HH:mm")}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-12 px-4 shrink-0 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
                        <Link href={`/care/${schedule.id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Chi tiết lịch trình
                        </Link>
                      </DropdownMenuItem>
                      {schedule.status === "SCHEDULED" && onCheckIn && (
                        <DropdownMenuItem onClick={() => onCheckIn(schedule.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-primary">
                          <Play className="mr-2 h-4 w-4" />
                          Bắt đầu làm việc
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "IN_PROGRESS" && onComplete && (
                        <DropdownMenuItem onClick={() => onComplete(schedule.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-emerald-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Hoàn tất dịch vụ
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
                        <Link href={`/care/${schedule.id}/complete`}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Nhập báo cáo
                        </Link>
                      </DropdownMenuItem>
                      {schedule.status === "SCHEDULED" && onSkip && (
                        <DropdownMenuItem
                          onClick={() => onSkip(schedule.id)}
                          className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-rose-600 focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
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
