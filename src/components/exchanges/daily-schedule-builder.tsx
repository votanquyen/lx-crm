/**
 * Daily Schedule Builder Component
 * Main component for creating and managing daily schedules
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, CheckCircle, Trash2, Printer, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScheduleBuilder } from "./schedule-builder";
import { toast } from "sonner";
import {
  createDailySchedule,
  updateStopOrder,
  optimizeRoute,
  approveSchedule,
  deleteSchedule,
} from "@/actions/daily-schedules";
import type { Stop } from "@/lib/maps/route-optimizer";
import type { DailySchedule, ScheduledExchange, ExchangeRequest, Customer } from "@prisma/client";

interface DailyScheduleBuilderProps {
  scheduleDate: Date;
  existingSchedule: (DailySchedule & {
    exchanges: (ScheduledExchange & {
      customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district" | "latitude" | "longitude">;
    })[];
  }) | null;
  pendingRequests: (ExchangeRequest & {
    customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district" | "latitude" | "longitude">;
  })[];
}

export function DailyScheduleBuilder({
  scheduleDate,
  existingSchedule,
  pendingRequests,
}: DailyScheduleBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState(scheduleDate);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Convert existing schedule to stops
  const existingStops: Stop[] = existingSchedule?.exchanges.map((ex) => ({
    id: ex.id,
    customerId: ex.customerId,
    customerName: ex.customer.companyName,
    address: `${ex.customer.address}, ${ex.customer.district}`,
    latitude: ex.customer.latitude || 0,
    longitude: ex.customer.longitude || 0,
    plantCount: ex.totalPlantCount,
    estimatedDurationMins: ex.estimatedDurationMins,
  })) || [];

  const handleCreateSchedule = async () => {
    if (selectedRequests.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 yêu cầu");
      return;
    }

    startTransition(async () => {
      const result = await createDailySchedule({
        scheduleDate: selectedDate,
        exchangeRequestIds: selectedRequests,
      });

      if (result.success) {
        toast.success("Đã tạo lịch trình");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể tạo lịch trình");
      }
    });
  };

  const handleSaveOrder = async (stops: Stop[]) => {
    if (!existingSchedule) return;

    const result = await updateStopOrder({
      scheduleId: existingSchedule.id,
      stops: stops.map((stop, index) => ({
        stopOrder: index + 1,
        customerId: stop.customerId,
        exchangeRequestId: stop.id,
      })),
    });

    if (!result.success) {
      throw new Error("Failed to save order");
    }
  };

  const handleOptimize = async () => {
    if (!existingSchedule) return;

    const result = await optimizeRoute(existingSchedule.id);
    if (result.success) {
      router.refresh();
    }
  };

  const handleApprove = async () => {
    if (!existingSchedule) return;

    startTransition(async () => {
      const result = await approveSchedule(existingSchedule.id);
      if (result.success) {
        toast.success("Đã duyệt lịch trình");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể duyệt lịch trình");
      }
    });
  };

  const handleDelete = async () => {
    if (!existingSchedule) return;
    if (!confirm("Bạn có chắc muốn xóa lịch trình này?")) return;

    startTransition(async () => {
      const result = await deleteSchedule(existingSchedule.id);
      if (result.success) {
        toast.success("Đã xóa lịch trình");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể xóa lịch trình");
      }
    });
  };

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handlePrintBriefing = () => {
    if (!existingSchedule) return;
    window.open(`/api/schedules/${existingSchedule.id}/briefing`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Chọn ngày
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Ngày thực hiện</Label>
              <Input
                id="date"
                type="date"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="text-sm text-gray-600">
              {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: vi })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Schedule or Create New */}
      {existingSchedule ? (
        <div className="space-y-4">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Lịch trình {format(scheduleDate, "dd/MM/yyyy")}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Trạng thái: <span className="font-semibold">{existingSchedule.status}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {existingSchedule.status === "APPROVED" && (
                    <>
                      <Button variant="outline" asChild>
                        <a href={`/exchanges/execute/${existingSchedule.id}`}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Thực hiện
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePrintBriefing}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        In lịch trình
                      </Button>
                    </>
                  )}
                  {existingSchedule.status === "IN_PROGRESS" && (
                    <Button variant="outline" asChild>
                      <a href={`/exchanges/execute/${existingSchedule.id}`}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Tiếp tục
                      </a>
                    </Button>
                  )}
                  {existingSchedule.status === "DRAFT" && (
                    <>
                      <Button
                        onClick={handleApprove}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Duyệt lịch
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Schedule Builder */}
          <ScheduleBuilder
            initialStops={existingStops}
            scheduleId={existingSchedule.id}
            onOptimize={handleOptimize}
            onSave={handleSaveOrder}
            isOptimizing={isPending}
            isSaving={isPending}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tạo lịch trình mới</CardTitle>
            <p className="text-sm text-gray-600">
              Chọn các yêu cầu đổi cây để thêm vào lịch trình
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending Requests List */}
            <div className="space-y-2">
              <Label>
                Yêu cầu chờ duyệt ({pendingRequests.length})
              </Label>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Không có yêu cầu đổi cây nào chờ lên lịch
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {pendingRequests.map((request) => (
                    <label
                      key={request.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {request.customer.companyName}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {request.customer.address}, {request.customer.district}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {request.quantity} cây • Ưu tiên: {request.priority}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreateSchedule}
              disabled={selectedRequests.length === 0 || isPending}
              className="w-full"
            >
              Tạo lịch trình ({selectedRequests.length} điểm dừng)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
