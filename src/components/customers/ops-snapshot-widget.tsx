"use client";

import {
  Leaf,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { vi } from "date-fns/locale";

interface OpsSnapshotWidgetProps {
  plantsCount: number;
  plantsHealthAvg?: number; // 1-10 scale
  previousHealthAvg?: number; // For trend calculation
  careSchedulesCount: number;
  nextCareDate?: Date | null;
  nextCareStaff?: string | null;
  lastCareDate?: Date | null;
}

function getHealthColor(score: number) {
  if (score >= 8) return "text-emerald-600 bg-emerald-50";
  if (score >= 6) return "text-blue-600 bg-blue-50";
  if (score >= 4) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

function getHealthLabel(score: number) {
  if (score >= 8) return "Rất tốt";
  if (score >= 6) return "Tốt";
  if (score >= 4) return "Trung bình";
  return "Cần chăm sóc";
}

export function OpsSnapshotWidget({
  plantsCount,
  plantsHealthAvg = 7,
  previousHealthAvg,
  nextCareDate,
  nextCareStaff,
  lastCareDate,
}: OpsSnapshotWidgetProps) {
  const now = new Date();
  const hasUpcomingCare = nextCareDate && isAfter(new Date(nextCareDate), now);
  const isCareSoon = nextCareDate && isBefore(new Date(nextCareDate), addDays(now, 2));

  // Health Trend Calculation
  const healthTrend = (() => {
    if (previousHealthAvg === undefined) return "stable";
    const diff = plantsHealthAvg - previousHealthAvg;
    if (diff > 0.3) return "up";
    if (diff < -0.3) return "down";
    return "stable";
  })();

  const TrendIcon =
    healthTrend === "up" ? TrendingUp : healthTrend === "down" ? TrendingDown : Minus;
  const trendColor =
    healthTrend === "up"
      ? "text-emerald-500"
      : healthTrend === "down"
        ? "text-rose-500"
        : "text-slate-400";

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-blue-500" aria-hidden="true" />
          Vận hành
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plants Overview */}
        <div className="grid grid-cols-2 gap-3">
          {/* Plant Count */}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                Cây xanh
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700">{plantsCount}</div>
            <div className="text-[10px] text-emerald-600">cây đang thuê</div>
          </div>

          {/* Health Score with Trend */}
          <div
            className={cn(
              "rounded-lg border p-3",
              getHealthColor(plantsHealthAvg).replace("text-", "border-").replace("-600", "-100")
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendIcon className={cn("h-4 w-4", trendColor)} aria-hidden="true" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Sức khỏe</span>
              </div>
              {healthTrend !== "stable" && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold",
                    healthTrend === "up"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                  )}
                >
                  {healthTrend === "up" ? "↗ Tăng" : "↘ Giảm"}
                </span>
              )}
            </div>
            <div
              className={cn("text-2xl font-black", getHealthColor(plantsHealthAvg).split(" ")[0])}
            >
              {plantsHealthAvg.toFixed(1)}
            </div>
            <div className={cn("text-[10px]", getHealthColor(plantsHealthAvg).split(" ")[0])}>
              {getHealthLabel(plantsHealthAvg)}
            </div>
          </div>
        </div>

        {/* Care Schedule */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Lịch chăm sóc
          </div>

          {hasUpcomingCare ? (
            <div
              className={cn(
                "rounded-lg border p-3",
                isCareSoon ? "border-blue-200 bg-blue-50/50" : "border-slate-100 bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      isCareSoon ? "text-blue-700" : "text-slate-700"
                    )}
                  >
                    {format(new Date(nextCareDate!), "EEEE, dd/MM", { locale: vi })}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDistanceToNow(new Date(nextCareDate!), { addSuffix: true, locale: vi })}
                  </div>
                </div>
                {nextCareStaff && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Nhân viên
                    </span>
                    <div className="text-xs font-bold text-slate-700">{nextCareStaff}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
              <span className="text-xs text-slate-400">Chưa có lịch kế tiếp</span>
            </div>
          )}

          {/* Last Care */}
          {lastCareDate && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              Lần cuối:{" "}
              <span className="font-bold text-slate-500">
                {format(new Date(lastCareDate), "dd/MM/yyyy", { locale: vi })}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
