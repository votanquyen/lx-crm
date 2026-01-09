/**
 * Care Schedule Detail Page
 * View complete details of a care schedule
 */
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, User, FileText, Camera, CheckCircle, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Chờ thực hiện", color: "bg-yellow-100 text-yellow-800" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
  RESCHEDULED: { label: "Dời lịch", color: "bg-purple-100 text-purple-800" },
  SKIPPED: { label: "Bỏ qua", color: "bg-orange-100 text-orange-800" },
};

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

async function CareDetailContent({ params }: DetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const schedule = await prisma.careSchedule.findUnique({
    where: { id },
    include: {
      customer: true,
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!schedule) notFound();

  // Parse plant assessments if exists
  const plantAssessments = Array.isArray(schedule.plantAssessments)
    ? (schedule.plantAssessments as Record<string, unknown>[])
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{schedule.customer.companyName}</h1>
          <p className="mt-1 text-gray-600">Chi tiết lịch chăm sóc</p>
        </div>
        <Badge className={statusConfig[schedule.status]?.color ?? "bg-gray-100 text-gray-800"}>
          {statusConfig[schedule.status]?.label ?? schedule.status}
        </Badge>
      </div>

      {/* Schedule Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thông tin lịch hẹn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <div className="text-sm text-gray-600">Ngày thực hiện</div>
              <div className="font-medium">
                {format(new Date(schedule.scheduledDate), "EEEE, dd/MM/yyyy", {
                  locale: vi,
                })}
              </div>
            </div>

            {/* Time Slot */}
            <div>
              <div className="text-sm text-gray-600">Khung giờ</div>
              <div className="font-medium">{schedule.timeSlot || "Chưa xác định"}</div>
            </div>

            {/* Staff */}
            <div>
              <div className="text-sm text-gray-600">Nhân viên</div>
              <div className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                {schedule.staff?.name || "Chưa phân công"}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="text-sm text-gray-600">Thời gian dự kiến</div>
              <div className="font-medium">{schedule.estimatedDurationMins} phút</div>
            </div>

            {/* Actual Duration (if completed) */}
            {schedule.actualDurationMins && (
              <div>
                <div className="text-sm text-gray-600">Thời gian thực tế</div>
                <div className="font-medium">{schedule.actualDurationMins} phút</div>
              </div>
            )}

            {/* Plant Count */}
            {schedule.plantCount && (
              <div>
                <div className="text-sm text-gray-600">Số cây đã chăm sóc</div>
                <div className="font-medium">{schedule.plantCount} cây</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {schedule.notes && (
            <div className="mt-4">
              <div className="mb-1 text-sm text-gray-600">Ghi chú lịch hẹn</div>
              <div className="rounded bg-gray-50 p-3 text-sm">{schedule.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-gray-600">Mã khách hàng</div>
            <div className="font-medium">{schedule.customer.code}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Địa chỉ</div>
            <div className="font-medium">
              {schedule.customer.address}, {schedule.customer.district}, {schedule.customer.city}
            </div>
          </div>
          {schedule.customer.contactPhone && (
            <div>
              <div className="text-sm text-gray-600">Liên hệ</div>
              <div className="font-medium">
                📞 {schedule.customer.contactPhone}
                {schedule.customer.contactName && (
                  <span className="ml-2">({schedule.customer.contactName})</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Report (if completed) */}
      {schedule.status === "COMPLETED" && (
        <>
          {/* Work Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Báo cáo công việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.workNotes && (
                <div>
                  <div className="mb-1 text-sm text-gray-600">Ghi chú công việc</div>
                  <div className="rounded bg-gray-50 p-3 text-sm">{schedule.workNotes}</div>
                </div>
              )}

              {schedule.issuesFound && (
                <div>
                  <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Vấn đề phát hiện
                  </div>
                  <div className="rounded border border-orange-200 bg-orange-50 p-3 text-sm">
                    {schedule.issuesFound}
                  </div>
                </div>
              )}

              {schedule.actionsToken && (
                <div>
                  <div className="mb-1 text-sm text-gray-600">Hành động đã thực hiện</div>
                  <div className="rounded border border-green-200 bg-green-50 p-3 text-sm">
                    {schedule.actionsToken}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plant Assessments */}
          {plantAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá tình trạng cây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plantAssessments.map((pc: Record<string, unknown>, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{String(pc.plantTypeName ?? "")}</div>
                        {typeof pc.notes === "string" && pc.notes && (
                          <div className="mt-1 text-sm text-gray-600">{pc.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600">{String(pc.count ?? 0)} cây</div>
                        <Badge
                          variant="secondary"
                          className={
                            pc.condition === "GOOD"
                              ? "bg-green-100 text-green-800"
                              : pc.condition === "FAIR"
                                ? "bg-yellow-100 text-yellow-800"
                                : pc.condition === "POOR"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {pc.condition === "GOOD"
                            ? "Tốt"
                            : pc.condition === "FAIR"
                              ? "Khá"
                              : pc.condition === "POOR"
                                ? "Yếu"
                                : "Chết"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {Array.isArray(schedule.photoUrls) && schedule.photoUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Hình ảnh ({schedule.photoUrls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {(schedule.photoUrls as string[]).map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded border transition-opacity hover:opacity-90"
                    >
                      <img
                        src={url}
                        alt={`Ảnh ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Link href="/care">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
        {["SCHEDULED", "IN_PROGRESS"].includes(schedule.status) && (
          <Link href={`/care/${schedule.id}/complete`}>
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Hoàn thành công việc
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function CareDetailPage(props: DetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <CareDetailContent params={props.params} />
    </Suspense>
  );
}
