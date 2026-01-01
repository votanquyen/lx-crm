/**
 * Today's Care Schedules Page
 * Quick view for staff to see today's care tasks
 */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, MapPin, Clock, User, CheckCircle } from "lucide-react";
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
      <div>
        <h1 className="text-3xl font-bold">Lịch chăm sóc hôm nay</h1>
        <p className="text-gray-600 mt-1">
          {format(today, "EEEE, dd MMMM yyyy", { locale: vi })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Tổng lịch</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.scheduled}
              </div>
              <div className="text-sm text-gray-600 mt-1">Chờ thực hiện</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-600 mt-1">Đang thực hiện</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600 mt-1">Hoàn thành</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Không có lịch chăm sóc nào hôm nay</p>
              <p className="text-sm mt-1">Hãy tận hưởng ngày nghỉ!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">
                      {schedule.customer.companyName}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      {schedule.customer.code}
                    </div>
                  </div>
                  <Badge className={statusConfig[schedule.status]?.color ?? "bg-gray-100 text-gray-800"}>
                    {statusConfig[schedule.status]?.label ?? schedule.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Address */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    {schedule.customer.address}, {schedule.customer.district}
                  </div>
                </div>

                {/* Time Slot */}
                {schedule.timeSlot && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>Khung giờ: {schedule.timeSlot}</div>
                  </div>
                )}

                {/* Staff */}
                {schedule.staff && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>Nhân viên: {schedule.staff.name}</div>
                  </div>
                )}

                {/* Contact */}
                {schedule.customer.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-gray-600">
                      📞 {schedule.customer.contactPhone}
                      {schedule.customer.contactName && (
                        <span className="ml-2">({schedule.customer.contactName})</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {schedule.notes && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>Ghi chú:</strong> {schedule.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {schedule.status === "SCHEDULED" && (
                    <Link href={`/care/${schedule.id}/complete`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Bắt đầu thực hiện
                      </Button>
                    </Link>
                  )}
                  {schedule.status === "IN_PROGRESS" && (
                    <Link href={`/care/${schedule.id}/complete`}>
                      <Button size="sm" variant="outline">
                        Tiếp tục thực hiện
                      </Button>
                    </Link>
                  )}
                  <Link href={`/care/${schedule.id}`}>
                    <Button size="sm" variant="outline">
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Back to Calendar */}
      <Link href="/care">
        <Card className="border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium">
              <Calendar className="h-5 w-5" />
              Xem lịch cả tuần
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default async function TodayCarePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      }
    >
      <TodaySchedulesContent />
    </Suspense>
  );
}
