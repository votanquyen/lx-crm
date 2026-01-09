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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CareStatus } from "@prisma/client";

type CareSchedule = {
  id: string;
  scheduledDate: Date;
  scheduledTime: string | null;
  status: CareStatus;
  notes: string | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
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

const statusConfig: Record<
  CareStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle;
  }
> = {
  SCHEDULED: { label: "Đã lên lịch", variant: "outline", icon: Calendar },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "default", icon: Play },
  COMPLETED: { label: "Hoàn thành", variant: "secondary", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", variant: "destructive", icon: XCircle },
  SKIPPED: { label: "Bỏ qua", variant: "destructive", icon: XCircle },
  RESCHEDULED: { label: "Đã dời lịch", variant: "outline", icon: Clock },
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
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Không có lịch chăm sóc nào</p>
        </div>
      ) : (
        schedules.map((schedule) => {
          const status = statusConfig[schedule.status];
          const StatusIcon = status.icon;

          return (
            <Card key={schedule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {format(new Date(schedule.scheduledDate), "EEEE, dd/MM/yyyy", {
                        locale: vi,
                      })}
                      {schedule.scheduledTime && ` lúc ${schedule.scheduledTime}`}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {schedule.status === "SCHEDULED" && onCheckIn && (
                        <DropdownMenuItem onClick={() => onCheckIn(schedule.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Check-in
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "IN_PROGRESS" && onComplete && (
                        <DropdownMenuItem onClick={() => onComplete(schedule.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Hoàn thành
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "SCHEDULED" && onSkip && (
                        <DropdownMenuItem
                          onClick={() => onSkip(schedule.id)}
                          className="text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Bỏ qua
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <CardTitle className="mb-2 text-base">
                      <Link href={`/customers/${schedule.customer.id}`} className="hover:underline">
                        {schedule.customer.companyName}
                      </Link>
                    </CardTitle>
                    <div className="text-muted-foreground flex items-start gap-2 text-sm">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {schedule.customer.address}
                        {schedule.customer.district && `, ${schedule.customer.district}`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {schedule.staff && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>{schedule.staff.name || schedule.staff.email}</span>
                      </div>
                    )}
                    {schedule.checkInTime && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Check-in: {format(new Date(schedule.checkInTime), "HH:mm")}</span>
                      </div>
                    )}
                    {schedule.checkOutTime && (
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>Check-out: {format(new Date(schedule.checkOutTime), "HH:mm")}</span>
                      </div>
                    )}
                  </div>
                </div>
                {schedule.notes && (
                  <p className="text-muted-foreground mt-3 border-t pt-3 text-sm">
                    {schedule.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
