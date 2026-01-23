/**
 * Schedule Execution Page
 * Track and complete daily schedule
 */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Calendar, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleTracker } from "@/components/exchanges/schedule-tracker";
import { getScheduleForExecution, startScheduleExecution } from "@/actions/daily-schedules";

interface ExecutePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function ExecuteContent({ scheduleId }: { scheduleId: string }) {
  const schedule = await getScheduleForExecution(scheduleId);

  if (!schedule) {
    redirect("/exchanges/daily-schedule");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <a href="/exchanges/daily-schedule">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Quay lại
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Thực hiện lịch trình</h1>
            <p className="mt-1 text-gray-600">
              {format(new Date(schedule.scheduleDate), "EEEE, dd MMMM yyyy", {
                locale: vi,
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Trạng thái</div>
          <div className="text-xl font-bold text-blue-600">
            {schedule.status === "APPROVED"
              ? "Đã duyệt"
              : schedule.status === "IN_PROGRESS"
                ? "Đang thực hiện"
                : schedule.status === "COMPLETED"
                  ? "Hoàn thành"
                  : schedule.status}
          </div>
        </div>
      </div>

      {/* Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            Thông tin lịch trình
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Tổng điểm dừng</div>
            <div className="text-2xl font-bold">{schedule.totalStops}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Tổng số cây</div>
            <div className="text-2xl font-bold">{schedule.totalPlants}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Thời gian dự kiến</div>
            <div className="text-2xl font-bold">{schedule.estimatedDurationMins || "---"} phút</div>
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      {schedule.status === "APPROVED" && (
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <form
              action={async () => {
                "use server";
                await startScheduleExecution(scheduleId);
                redirect(`/exchanges/execute/${scheduleId}`);
              }}
            >
              <Button type="submit" size="lg" className="w-full">
                <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                Bắt đầu thực hiện lịch trình
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Execution Tracker */}
      {schedule.status === "IN_PROGRESS" && <ScheduleTracker schedule={schedule} />}

      {/* Completed Summary */}
      {schedule.status === "COMPLETED" && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Lịch trình đã hoàn thành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Thời gian thực hiện</div>
                <div className="text-xl font-bold">
                  {schedule.actualDurationMins ? `${schedule.actualDurationMins} phút` : "---"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Hoàn thành lúc</div>
                <div className="text-xl font-bold">
                  {schedule.completedAt
                    ? format(new Date(schedule.completedAt), "dd/MM/yyyy HH:mm")
                    : "---"}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold">Chi tiết các điểm dừng:</h3>
              <div className="space-y-2">
                {schedule.exchanges.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between rounded bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {stop.stopOrder}
                      </div>
                      <div>
                        <div className="font-medium">{stop.customer.companyName}</div>
                        <div className="text-xs text-gray-600">{stop.customer.address}</div>
                      </div>
                    </div>
                    <div
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        stop.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stop.status === "COMPLETED" ? "Hoàn thành" : "Bỏ qua"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function ExecutePage({ params }: ExecutePageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <p className="text-gray-400">Đang tải lịch trình...</p>
        </div>
      }
    >
      <ExecuteContent scheduleId={id} />
    </Suspense>
  );
}
