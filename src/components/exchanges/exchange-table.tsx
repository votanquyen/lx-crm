/**
 * Exchange Request Table Component
 */
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExchangeStatus, ExchangePriority } from "@prisma/client";

type ExchangeRequest = {
  id: string;
  status: ExchangeStatus;
  priority: ExchangePriority;
  priorityScore: number;
  reason: string | null;
  preferredDate: Date | null;
  quantity: number;
  currentPlant: string | null;
  requestedPlant: string | null;
  plantLocation: string | null;
  createdAt: Date;
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    district: string | null;
    tier: string;
  };
};

const statusConfig: Record<ExchangeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ duyệt", variant: "outline" },
  SCHEDULED: { label: "Đã lên lịch", variant: "default" },
  IN_PROGRESS: { label: "Đang thực hiện", variant: "secondary" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const priorityConfig: Record<ExchangePriority, { label: string; color: string }> = {
  LOW: { label: "Thấp", color: "text-gray-500" },
  MEDIUM: { label: "Trung bình", color: "text-blue-500" },
  HIGH: { label: "Cao", color: "text-orange-500" },
  URGENT: { label: "Khẩn cấp", color: "text-red-500" },
};

interface ExchangeTableProps {
  requests: ExchangeRequest[];
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function ExchangeTable({
  requests,
  onApprove,
  onCancel,
  onComplete,
}: ExchangeTableProps) {
  // Removed getPlantCount - now using request.quantity directly

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Mức độ</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-center">Số cây</TableHead>
            <TableHead>Ngày yêu cầu</TableHead>
            <TableHead className="text-center">Điểm ưu tiên</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <RefreshCw className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Chưa có yêu cầu đổi cây nào
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => {
              const status = statusConfig[request.status];
              const urgency = priorityConfig[request.priority];
              const plantCount = request.quantity;

              return (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <Link
                          href={`/customers/${request.customer.id}`}
                          className="font-medium hover:underline"
                        >
                          {request.customer.companyName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {request.customer.code} • {request.customer.district}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${urgency.color}`}>
                      {request.priority === "URGENT" && (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      {urgency.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {plantCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {request.preferredDate
                        ? format(new Date(request.preferredDate), "dd/MM/yyyy", { locale: vi })
                        : format(new Date(request.createdAt), "dd/MM/yyyy", { locale: vi })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-bold ${
                        request.priorityScore >= 70
                          ? "text-red-500"
                          : request.priorityScore >= 40
                            ? "text-orange-500"
                            : "text-gray-500"
                      }`}
                    >
                      {request.priorityScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {request.status === "PENDING" && onApprove && (
                          <DropdownMenuItem onClick={() => onApprove(request.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Duyệt
                          </DropdownMenuItem>
                        )}
                        {["APPROVED", "SCHEDULED"].includes(request.status) && onComplete && (
                          <DropdownMenuItem onClick={() => onComplete(request.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Hoàn thành
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {!["COMPLETED", "CANCELLED"].includes(request.status) && onCancel && (
                          <DropdownMenuItem
                            onClick={() => onCancel(request.id)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
