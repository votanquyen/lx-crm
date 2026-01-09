/**
 * Care Schedule Form Component
 * Create/Edit care schedules (manual workflow, no GPS)
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCareSchedule, updateCareSchedule } from "@/actions/care-schedules";
import type { CareSchedule, Customer, User as PrismaUser } from "@prisma/client";

interface CareScheduleFormProps {
  schedule?: CareSchedule;
  customers: Pick<Customer, "id" | "code" | "companyName" | "address" | "district">[];
  staff: Pick<PrismaUser, "id" | "name">[];
  defaultDate?: Date;
  defaultCustomerId?: string;
}

const timeSlots = ["08:00-10:00", "10:00-12:00", "13:00-15:00", "15:00-17:00", "Cả ngày"];

export function CareScheduleForm({
  schedule,
  customers,
  staff,
  defaultDate,
  defaultCustomerId,
}: CareScheduleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    customerId: schedule?.customerId || defaultCustomerId || "",
    staffId: schedule?.staffId || "",
    scheduledDate: schedule?.scheduledDate
      ? format(new Date(schedule.scheduledDate), "yyyy-MM-dd")
      : defaultDate
        ? format(defaultDate, "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    timeSlot: schedule?.timeSlot || "",
    estimatedDurationMins: schedule?.estimatedDurationMins || 30,
    notes: schedule?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }

    startTransition(async () => {
      const input = {
        customerId: formData.customerId,
        staffId: formData.staffId || undefined,
        scheduledDate: new Date(formData.scheduledDate),
        timeSlot: formData.timeSlot || undefined,
        estimatedDurationMins: formData.estimatedDurationMins,
        notes: formData.notes || undefined,
      };

      let result;
      if (schedule) {
        result = await updateCareSchedule({ id: schedule.id, ...input });
      } else {
        result = await createCareSchedule(input);
      }

      if (result.success) {
        toast.success(schedule ? "Đã cập nhật lịch chăm sóc" : "Đã tạo lịch chăm sóc");
        router.push("/care");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể lưu lịch chăm sóc");
      }
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{schedule ? "Chỉnh sửa lịch chăm sóc" : "Tạo lịch chăm sóc mới"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customerId">
              Khách hàng <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => handleChange("customerId", value)}
            >
              <SelectTrigger id="customerId">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.code} - {customer.companyName}
                    <span className="ml-2 text-xs text-gray-500">({customer.district})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Assignment */}
          <div className="space-y-2">
            <Label htmlFor="staffId" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nhân viên phụ trách
            </Label>
            <Select
              value={formData.staffId}
              onValueChange={(value) => handleChange("staffId", value)}
            >
              <SelectTrigger id="staffId">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Chưa phân công</SelectItem>
                {staff.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ngày thực hiện <span className="text-red-500">*</span>
            </Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleChange("scheduledDate", e.target.value)}
              required
            />
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <Label htmlFor="timeSlot" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Khung giờ
            </Label>
            <Select
              value={formData.timeSlot}
              onValueChange={(value) => handleChange("timeSlot", value)}
            >
              <SelectTrigger id="timeSlot">
                <SelectValue placeholder="Chọn khung giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Chưa xác định</SelectItem>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDurationMins">Thời gian dự kiến (phút)</Label>
            <Input
              id="estimatedDurationMins"
              type="number"
              min="15"
              step="15"
              value={formData.estimatedDurationMins}
              onChange={(e) => handleChange("estimatedDurationMins", parseInt(e.target.value))}
            />
            <p className="text-xs text-gray-500">
              Mặc định: 30 phút. Có thể điều chỉnh theo số lượng cây.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ghi chú về lịch chăm sóc, yêu cầu đặc biệt..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : schedule ? "Cập nhật" : "Tạo lịch"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
