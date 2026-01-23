/**
 * Care Calendar Component
 * Weekly/Monthly calendar view for care schedules
 * Manual workflow (no GPS tracking)
 */
"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CareSchedule, Customer, User } from "@prisma/client";

interface CareScheduleWithRelations extends CareSchedule {
  customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district">;
  staff: Pick<User, "id" | "name"> | null;
}

interface CareCalendarProps {
  schedules: CareScheduleWithRelations[];
  onCreateSchedule?: (date: Date) => void;
  onViewSchedule?: (schedule: CareScheduleWithRelations) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
  RESCHEDULED: { label: "Dời lịch", color: "bg-purple-100 text-purple-800" },
  SKIPPED: { label: "Bỏ qua", color: "bg-orange-100 text-orange-800" },
};

export function CareCalendar({ schedules, onCreateSchedule, onViewSchedule }: CareCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Memoize today to avoid creating new Date() on each render
  const today = useMemo(() => new Date(), []);

  // Memoize weekStart/weekEnd based on currentWeek to avoid new Date objects each render
  const { weekStart, weekEnd } = useMemo(
    () => ({
      weekStart: startOfWeek(currentWeek, { weekStartsOn: 1 }),
      weekEnd: endOfWeek(currentWeek, { weekStartsOn: 1 }),
    }),
    [currentWeek]
  );

  // Generate array of days in current week (memoized to avoid new array each render)
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Pre-group schedules by date string for O(1) lookup (memoized)
  const schedulesByDateKey = useMemo(() => {
    const grouped = new Map<string, CareScheduleWithRelations[]>();
    schedules.forEach((s) => {
      const dateKey = format(new Date(s.scheduledDate), "yyyy-MM-dd");
      const existing = grouped.get(dateKey) || [];
      existing.push(s);
      grouped.set(dateKey, existing);
    });
    return grouped;
  }, [schedules]);

  // Build schedulesByDay using pre-grouped data (O(1) per day instead of O(n))
  const schedulesByDay = useMemo(
    () =>
      weekDays.map((day) => ({
        date: day,
        schedules: schedulesByDateKey.get(format(day, "yyyy-MM-dd")) || [],
      })),
    [weekDays, schedulesByDateKey]
  );

  // Memoize summary stats to avoid recalculating on every render
  const summaryStats = useMemo(
    () => ({
      total: schedules.length,
      scheduled: schedules.filter((s) => s.status === "SCHEDULED").length,
      inProgress: schedules.filter((s) => s.status === "IN_PROGRESS").length,
      completed: schedules.filter((s) => s.status === "COMPLETED").length,
    }),
    [schedules]
  );

  const handlePrevWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" aria-hidden="true" />
            <CardTitle>Lịch chăm sóc tuần</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hôm nay
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevWeek} aria-label="Tuần trước">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="min-w-[200px] text-center text-sm font-medium">
                {format(weekStart, "dd/MM", { locale: vi })} -{" "}
                {format(weekEnd, "dd/MM/yyyy", { locale: vi })}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextWeek} aria-label="Tuần sau">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`border-b-2 p-2 text-center ${
                  isToday ? "border-blue-500 font-semibold" : "border-gray-200"
                }`}
              >
                <div className="text-sm text-gray-600">{format(day, "EEE", { locale: vi })}</div>
                <div className={`text-lg ${isToday ? "text-blue-600" : ""}`}>
                  {format(day, "dd")}
                </div>
              </div>
            );
          })}

          {/* Day Cells */}
          {schedulesByDay.map(({ date, schedules: daySchedules }) => {
            const isToday = isSameDay(date, today);
            return (
              <div
                key={date.toISOString()}
                className={`min-h-[200px] rounded-lg border p-2 ${
                  isToday ? "border-blue-300 bg-blue-50" : "border-gray-200"
                }`}
              >
                {/* Add Schedule Button */}
                {onCreateSchedule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 w-full"
                    onClick={() => onCreateSchedule(date)}
                  >
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                    Thêm
                  </Button>
                )}

                {/* Schedules List */}
                <div className="space-y-1">
                  {daySchedules.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400">Không có lịch</div>
                  ) : (
                    daySchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => onViewSchedule?.(schedule)}
                        className="w-full rounded border border-gray-200 p-2 text-left transition-colors hover:bg-gray-50"
                      >
                        {/* Time Slot */}
                        {schedule.timeSlot && (
                          <div className="mb-1 text-xs font-medium text-gray-700">
                            {schedule.timeSlot}
                          </div>
                        )}

                        {/* Customer */}
                        <div className="truncate text-sm font-medium text-gray-900">
                          {schedule.customer.companyName}
                        </div>

                        {/* Address */}
                        <div className="truncate text-xs text-gray-600">
                          {schedule.customer.district}
                        </div>

                        {/* Staff */}
                        {schedule.staff && (
                          <div className="mt-1 text-xs text-gray-500">👤 {schedule.staff.name}</div>
                        )}

                        {/* Status Badge */}
                        <div className="mt-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusConfig[schedule.status]?.color ?? "bg-gray-100 text-gray-800"}`}
                          >
                            {statusConfig[schedule.status]?.label ?? schedule.status}
                          </Badge>
                        </div>

                        {/* Plant Count */}
                        {schedule.plantCount && (
                          <div className="mt-1 text-xs text-gray-500">
                            🌿 {schedule.plantCount} cây
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.total}</div>
            <div className="text-xs text-gray-600">Tổng lịch</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summaryStats.scheduled}</div>
            <div className="text-xs text-gray-600">Chờ thực hiện</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{summaryStats.inProgress}</div>
            <div className="text-xs text-gray-600">Đang thực hiện</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.completed}</div>
            <div className="text-xs text-gray-600">Hoàn thành</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
