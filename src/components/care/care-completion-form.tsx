/**
 * Care Completion Form Component
 * Complete care schedules with manual check-in/out (no GPS)
 * Includes photo upload, plant assessment, and work notes
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CheckCircle,
  Upload,
  Camera,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { completeCare } from "@/actions/care-schedules";
import { uploadCarePhoto } from "@/lib/storage/s3-client";
import type { CareSchedule, Customer } from "@prisma/client";

interface CareCompletionFormProps {
  schedule: CareSchedule & {
    customer: Pick<Customer, "id" | "code" | "companyName" | "address" | "district">;
  };
}

interface PlantCondition {
  plantTypeId?: string;
  plantTypeName: string;
  count: number;
  condition: "GOOD" | "FAIR" | "POOR" | "DEAD";
  notes?: string;
}

export function CareCompletionForm({ schedule }: CareCompletionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    actualDurationMins: schedule.estimatedDurationMins,
    plantCount: 0,
    workNotes: "",
    issuesFound: "",
    actionsTaken: "",
    photoUrls: [] as string[],
    plantConditions: [] as PlantCondition[],
  });

  // Handle manual check-in (no GPS)
  const handleCheckIn = async () => {
    startTransition(async () => {
      toast.success("Đã bắt đầu ca làm việc");
      // In a GPS-enabled version, this would call checkIn action
      // For now, just UI feedback
    });
  };

  // Handle photo upload
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
      toast.success(`Đã tải lên ${files.length} ảnh`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  // Add plant condition assessment
  const handleAddPlantCondition = () => {
    setFormData((prev) => ({
      ...prev,
      plantConditions: [
        ...prev.plantConditions,
        { plantTypeName: "", count: 1, condition: "GOOD" },
      ],
    }));
  };

  // Update plant condition
  const handleUpdatePlantCondition = (
    index: number,
    field: keyof PlantCondition,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      plantConditions: prev.plantConditions.map((pc, i) =>
        i === index ? { ...pc, [field]: value } : pc
      ),
    }));
  };

  // Submit completion
  const handleComplete = async () => {
    if (formData.plantCount === 0) {
      toast.error("Vui lòng nhập số lượng cây đã chăm sóc");
      return;
    }

    startTransition(async () => {
      const result = await completeCare({
        id: schedule.id,
        actualDurationMins: formData.actualDurationMins,
        plantCount: formData.plantCount,
        workNotes: formData.workNotes || undefined,
        issuesFound: formData.issuesFound || undefined,
        actionsTaken: formData.actionsTaken || undefined,
        photoUrls: formData.photoUrls.length > 0 ? formData.photoUrls : undefined,
        plantConditions:
          formData.plantConditions.length > 0
            ? JSON.stringify(formData.plantConditions)
            : undefined,
      });

      if (result.success) {
        toast.success("Đã hoàn thành công việc chăm sóc");
        router.push("/care");
        router.refresh();
      } else {
        toast.error(result.error || "Không thể hoàn thành");
      }
    });
  };

  const conditionColors = {
    GOOD: "bg-green-100 text-green-800",
    FAIR: "bg-yellow-100 text-yellow-800",
    POOR: "bg-orange-100 text-orange-800",
    DEAD: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin lịch chăm sóc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Khách hàng</div>
              <div className="font-medium">{schedule.customer.companyName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Địa chỉ</div>
              <div className="font-medium">
                {schedule.customer.address}, {schedule.customer.district}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Ngày thực hiện</div>
              <div className="font-medium">
                {format(new Date(schedule.scheduledDate), "EEEE, dd/MM/yyyy", {
                  locale: vi,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Khung giờ</div>
              <div className="font-medium">{schedule.timeSlot || "Chưa xác định"}</div>
            </div>
          </div>

          {/* Manual Check-in Button */}
          {schedule.status === "SCHEDULED" && (
            <div className="mt-4">
              <Button onClick={handleCheckIn} className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Bắt đầu ca làm việc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết công việc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="actualDuration">Thời gian thực tế (phút)</Label>
            <Input
              id="actualDuration"
              type="number"
              min="15"
              step="15"
              value={formData.actualDurationMins}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  actualDurationMins: parseInt(e.target.value),
                }))
              }
            />
          </div>

          {/* Plant Count */}
          <div className="space-y-2">
            <Label htmlFor="plantCount">
              Số lượng cây đã chăm sóc <span className="text-red-500">*</span>
            </Label>
            <Input
              id="plantCount"
              type="number"
              min="1"
              value={formData.plantCount || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  plantCount: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="Nhập số lượng cây"
            />
          </div>

          {/* Work Notes */}
          <div className="space-y-2">
            <Label htmlFor="workNotes">Ghi chú công việc</Label>
            <Textarea
              id="workNotes"
              rows={3}
              placeholder="Mô tả công việc đã thực hiện..."
              value={formData.workNotes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, workNotes: e.target.value }))
              }
            />
          </div>

          {/* Issues Found */}
          <div className="space-y-2">
            <Label htmlFor="issuesFound" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vấn đề phát hiện
            </Label>
            <Textarea
              id="issuesFound"
              rows={2}
              placeholder="Các vấn đề, sâu bệnh, cây héo..."
              value={formData.issuesFound}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issuesFound: e.target.value }))
              }
            />
          </div>

          {/* Actions Taken */}
          <div className="space-y-2">
            <Label htmlFor="actionsTaken">Hành động đã thực hiện</Label>
            <Textarea
              id="actionsTaken"
              rows={2}
              placeholder="Xử lý sâu bệnh, thay cây, tư vấn khách hàng..."
              value={formData.actionsTaken}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, actionsTaken: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Hình ảnh chăm sóc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photos">
              Tải ảnh lên (trước/sau chăm sóc)
            </Label>
            <Input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500">
              Có thể tải nhiều ảnh cùng lúc. Hỗ trợ JPG, PNG.
            </p>
          </div>

          {/* Photo Preview */}
          {formData.photoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {formData.photoUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <Upload className="h-4 w-4 animate-spin" />
              Đang tải ảnh lên...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plant Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Đánh giá tình trạng cây</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPlantCondition}
            >
              Thêm đánh giá
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.plantConditions.map((pc, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded">
              <div>
                <Label className="text-xs">Loại cây</Label>
                <Input
                  placeholder="Tên cây"
                  value={pc.plantTypeName}
                  onChange={(e) =>
                    handleUpdatePlantCondition(index, "plantTypeName", e.target.value)
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Số lượng</Label>
                <Input
                  type="number"
                  min="1"
                  value={pc.count}
                  onChange={(e) =>
                    handleUpdatePlantCondition(index, "count", parseInt(e.target.value))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Tình trạng</Label>
                <Select
                  value={pc.condition}
                  onValueChange={(value) =>
                    handleUpdatePlantCondition(index, "condition", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOOD">Tốt</SelectItem>
                    <SelectItem value="FAIR">Khá</SelectItem>
                    <SelectItem value="POOR">Yếu</SelectItem>
                    <SelectItem value="DEAD">Chết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ghi chú</Label>
                <Input
                  placeholder="Ghi chú"
                  value={pc.notes || ""}
                  onChange={(e) =>
                    handleUpdatePlantCondition(index, "notes", e.target.value)
                  }
                />
              </div>
            </div>
          ))}

          {formData.plantConditions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              Chưa có đánh giá nào. Nhấn "Thêm đánh giá" để bắt đầu.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isPending || isUploading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {isPending ? "Đang lưu..." : "Hoàn thành công việc"}
        </Button>
      </div>
    </div>
  );
}
