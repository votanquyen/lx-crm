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
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
  };
};

interface ExchangeTableProps {
  requests: ExchangeRequest[];
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function ExchangeTable({ requests, onApprove, onCancel, onComplete }: ExchangeTableProps) {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 border-b bg-slate-50/80 backdrop-blur-sm">
        <div className="flex h-10 items-center">
          <div className="text-muted-foreground flex-1 px-4 text-[10px] font-bold tracking-widest uppercase">
            Khách hàng / Vị trí
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-center text-[10px] font-bold tracking-widest uppercase">
            Độ ưu tiên
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Trạng thái
          </div>
          <div className="text-muted-foreground w-32 shrink-0 px-4 text-center text-[10px] font-bold tracking-widest uppercase">
            Số cây
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Ngày dự kiến
          </div>
          <div className="w-12 shrink-0 px-4"></div>
        </div>
      </div>

      <div className="divide-border/50 divide-y">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-slate-50 text-slate-200 shadow-sm">
              <RefreshCw className="h-8 w-8" aria-hidden="true" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Không có yêu cầu đổi cây</h4>
            <p className="mt-1 text-sm font-medium text-slate-400">
              Hệ thống chưa ghi nhận yêu cầu nào trong kỳ này.
            </p>
          </div>
        ) : (
          requests.map((request) => {
            return (
              <div
                key={request.id}
                className="data-table-row group flex min-h-[64px] items-center py-3"
              >
                {/* Customer & Address */}
                <div className="min-w-0 flex-1 px-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Link
                      href={`/customers/${request.customer.id}`}
                      className="hover:text-primary truncate text-xs font-bold text-slate-900 transition-colors"
                    >
                      {request.customer.companyName}
                    </Link>
                    <span className="text-[10px] font-bold tracking-tighter text-slate-300 uppercase">
                      #{request.customer.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                    <span className="text-muted-foreground line-clamp-1 text-[10px] font-bold tracking-tight">
                      {request.customer.district || "N/A"} • {request.customer.address}
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex w-40 shrink-0 flex-col items-center px-4">
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-bold tracking-tight uppercase",
                      request.priority === "URGENT"
                        ? "text-rose-600"
                        : request.priority === "HIGH"
                          ? "text-amber-600"
                          : request.priority === "MEDIUM"
                            ? "text-blue-600"
                            : "text-slate-400"
                    )}
                  >
                    {request.priority === "URGENT" && <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />}
                    {request.priority === "URGENT"
                      ? "Khẩn cấp"
                      : request.priority === "HIGH"
                        ? "Cao"
                        : request.priority === "MEDIUM"
                          ? "Trung bình"
                          : "Thấp"}
                  </div>
                  <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        request.priorityScore >= 70
                          ? "bg-rose-500"
                          : request.priorityScore >= 40
                            ? "bg-amber-500"
                            : "bg-slate-300"
                      )}
                      style={{ width: `${request.priorityScore}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="w-40 shrink-0 px-4">
                  <div
                    className={cn(
                      "status-badge origin-left scale-90",
                      request.status === "COMPLETED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : request.status === "SCHEDULED"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : request.status === "PENDING"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    {request.status === "COMPLETED"
                      ? "Hoàn thành"
                      : request.status === "SCHEDULED"
                        ? "Đã duyệt"
                        : request.status === "PENDING"
                          ? "Chờ duyệt"
                          : "Đã hủy"}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex w-32 shrink-0 flex-col items-center px-4">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span className="text-sm font-black text-slate-700">{request.quantity}</span>
                  </div>
                  <span className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                    Cây đổi
                  </span>
                </div>

                {/* Date */}
                <div className="w-40 shrink-0 px-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                    <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    {request.preferredDate
                      ? format(new Date(request.preferredDate), "dd/MM/yyyy", { locale: vi })
                      : format(new Date(request.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex w-12 shrink-0 justify-end px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary h-8 w-8 text-slate-400 transition-colors"
                        aria-label="Tùy chọn"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        asChild
                        className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                      >
                        <Link href={`/exchanges/${request.id}`}>
                          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                          Chi tiết yêu cầu
                        </Link>
                      </DropdownMenuItem>
                      {request.status === "PENDING" && onApprove && (
                        <DropdownMenuItem
                          onClick={() => onApprove(request.id)}
                          className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Phê duyệt yêu cầu
                        </DropdownMenuItem>
                      )}
                      {["APPROVED", "SCHEDULED"].includes(request.status) && onComplete && (
                        <DropdownMenuItem
                          onClick={() => onComplete(request.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-emerald-600 uppercase"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hoàn thành đổi cây
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {!["COMPLETED", "CANCELLED"].includes(request.status) && onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(request.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-rose-600 uppercase focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hủy yêu cầu
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

ExchangeTable.displayName = "ExchangeTable";
