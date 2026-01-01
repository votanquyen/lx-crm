/**
 * Schedule Tracker Component
 * Track execution of daily schedule with manual check-in/out
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Camera,
  XCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  completeStop,
  skipStop,
  completeSchedule,
} from "@/actions/daily-schedules";
import { uploadCarePhoto } from "@/lib/storage/s3-client";
import type { ScheduledExchange, Customer } from "@prisma/client";

interface ScheduleTrackerProps {
  schedule: {
    id: string;
    scheduleDate: Date;
    status: string;
    startedAt: Date | null;
    exchanges: (ScheduledExchange & {
      customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district" | "contactPhone">;
    })[];
  };
}

export function ScheduleTracker({ schedule }: ScheduleTrackerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    arrivedAt: "",
    startedAt: "",
    completedAt: "",
    actualPlantsRemoved: 0,
    actualPlantsInstalled: 0,
    issues: "",
    customerFeedback: "",
    photoUrls: [] as string[],
    customerVerified: false,
    verificationMethod: "PHOTO" as "PHOTO" | "SIGNATURE" | "SMS_CONFIRM",
  });
  const [skipReason, setSkipReason] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const completedCount = schedule.exchanges.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const skippedCount = schedule.exchanges.filter(
    (e) => e.status === "CANCELLED"
  ).length;
  const totalCount = schedule.exchanges.length;
  const progress = (completedCount / totalCount) * 100;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const buffer = await file.arrayBuffer();
        const url = await uploadCarePhoto(Buffer.from(buffer), file.name);
        return url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        photoUrls: [...prev.photoUrls, ...urls],
      }));
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompleteStop = async (stopId: string) => {
    if (!formData.arrivedAt || !formData.startedAt || !formData.completedAt) {
      toast.error("Vui lòng nhập đầy đủ thời gian");
      return;
    }

    startTransition(async () => {
      const result = await completeStop({
        stopId,
        arrivedAt: new Date(formData.arrivedAt),
        startedAt: new Date(formData.startedAt),
        completedAt: new Date(formData.completedAt),
        actualPlantsRemoved: formData.actualPlantsRemoved,
        actualPlantsInstalled: formData.actualPlantsInstalled,
        issues: formData.issues,
        customerFeedback: formData.customerFeedback,
        photoUrls: formData.photoUrls,
        customerVerified: formData.customerVerified,
        verificationMethod: formData.verificationMethod,
      });

      if (result.success) {
        toast.success("Đã hoàn thành điểm dừng");
        setActiveStopId(null);
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || "Không thể hoàn thành");
      }
    });
  };

  const handleSkipStop = async (stopId: string) => {
    if (!skipReason || skipReason.length < 10) {
      toast.error("Vui lòng nhập lý do bỏ qua (tối thiểu 10 ký tự)");
      return;
    }

    startTransition(async () => {
      const result = await skipStop({
        stopId,
        reason: skipReason,
      });

      if (result.success) {
        toast.success("Đã bỏ qua điểm dừng");
        setActiveStopId(null);
        setSkipReason("");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể bỏ qua");
      }
    });
  };

  const handleCompleteSchedule = async () => {
    if (!confirm("Hoàn thành lịch trình? Hành động này không thể hoàn tác.")) {
      return;
    }

    startTransition(async () => {
      const result = await completeSchedule(schedule.id);

      if (result.success) {
        toast.success("Đã hoàn thành lịch trình");
        window.location.href = "/exchanges/daily-schedule";
      } else {
        toast.error(result.error || "Không thể hoàn thành lịch trình");
      }
    });
  };

  const resetForm = () => {
    setFormData({
      arrivedAt: "",
      startedAt: "",
      completedAt: "",
      actualPlantsRemoved: 0,
      actualPlantsInstalled: 0,
      issues: "",
      customerFeedback: "",
      photoUrls: [],
      customerVerified: false,
      verificationMethod: "PHOTO",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Chờ", color: "bg-gray-500" },
      IN_PROGRESS: { label: "Đang thực hiện", color: "bg-blue-500" },
      COMPLETED: { label: "Hoàn thành", color: "bg-green-500" },
      CANCELLED: { label: "Đã bỏ qua", color: "bg-red-500" },
    };

    const config = statusMap[status] ?? statusMap.PENDING;
    return (
      <Badge className={`${config?.color} text-white`}>{config?.label}</Badge>
    );
  };

  // Auto-fill current time helpers
  const fillCurrentTime = (field: "arrivedAt" | "startedAt" | "completedAt") => {
    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    setFormData((prev) => ({ ...prev, [field]: now }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ thực hiện</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {completedCount} / {totalCount} điểm dừng ({skippedCount} bỏ qua)
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {progress.toFixed(0)}%
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {completedCount === totalCount && (
            <Button
              onClick={handleCompleteSchedule}
              disabled={isPending}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Hoàn thành lịch trình
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stops List */}
      <div className="space-y-4">
        {schedule.exchanges.map((stop) => (
          <Card
            key={stop.id}
            className={
              activeStopId === stop.id
                ? "border-blue-500 shadow-lg"
                : stop.status === "COMPLETED"
                ? "bg-green-50"
                : stop.status === "CANCELLED"
                ? "bg-red-50"
                : ""
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                    {stop.stopOrder}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {stop.customer.companyName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {stop.customer.address}, {stop.customer.district}
                    </div>
                  </div>
                </div>
                {getStatusBadge(stop.status)}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stop Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {stop.customer.contactPhone || "---"}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {stop.estimatedDurationMins} phút
                </div>
              </div>

              {/* Action Buttons */}
              {stop.status === "IN_PROGRESS" && (
                <div className="flex gap-2">
                  {activeStopId !== stop.id ? (
                    <>
                      <Button
                        onClick={() => {
                          // Reset form to prevent data leakage between stops
                          resetForm();
                          setActiveStopId(stop.id);
                          // Pre-fill times
                          const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
                          setFormData((prev) => ({
                            ...prev,
                            arrivedAt: now,
                            startedAt: now,
                          }));
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Bắt đầu
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        // Reset form when canceling
                        resetForm();
                        setActiveStopId(null);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Hủy
                    </Button>
                  )}
                </div>
              )}

              {/* Completion Form */}
              {activeStopId === stop.id && (
                <div className="space-y-4 border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Time Inputs */}
                    <div>
                      <Label>Giờ đến</Label>
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          value={formData.arrivedAt}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              arrivedAt: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fillCurrentTime("arrivedAt")}
                        >
                          Bây giờ
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Giờ bắt đầu</Label>
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          value={formData.startedAt}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startedAt: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fillCurrentTime("startedAt")}
                        >
                          Bây giờ
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Giờ hoàn thành</Label>
                      <div className="flex gap-2">
                        <Input
                          type="datetime-local"
                          value={formData.completedAt}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              completedAt: e.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fillCurrentTime("completedAt")}
                        >
                          Bây giờ
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Plant Counts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Số cây đã thu (thực tế)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.actualPlantsRemoved}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            actualPlantsRemoved: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label>Số cây đã lắp (thực tế)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.actualPlantsInstalled}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            actualPlantsInstalled: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Vấn đề gặp phải (nếu có)</Label>
                    <Textarea
                      value={formData.issues}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          issues: e.target.value,
                        }))
                      }
                      placeholder="Mô tả các vấn đề..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Phản hồi của khách hàng</Label>
                    <Textarea
                      value={formData.customerFeedback}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerFeedback: e.target.value,
                        }))
                      }
                      placeholder="Ghi chú phản hồi..."
                      rows={2}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label>Ảnh hiện trường ({formData.photoUrls.length})</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("photo-upload")?.click()}
                        disabled={isUploading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {isUploading ? "Đang tải..." : "Tải ảnh lên"}
                      </Button>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      {formData.photoUrls.length > 0 && (
                        <span className="text-sm text-green-600">
                          ✓ {formData.photoUrls.length} ảnh
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleCompleteStop(stop.id)}
                      disabled={isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Hoàn thành
                    </Button>

                    <Button
                      onClick={() => {
                        const reason = prompt("Lý do bỏ qua điểm dừng này:");
                        if (reason) {
                          setSkipReason(reason);
                          handleSkipStop(stop.id);
                        }
                      }}
                      variant="destructive"
                      disabled={isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Bỏ qua
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed Info */}
              {stop.status === "COMPLETED" && stop.completedAt && (
                <div className="text-sm text-gray-600 border-t pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Hoàn thành lúc {format(new Date(stop.completedAt), "HH:mm")}
                  </div>
                </div>
              )}

              {/* Skip Info */}
              {stop.status === "CANCELLED" && (
                <div className="text-sm text-red-600 border-t pt-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {stop.skipReason || "Đã bỏ qua"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
