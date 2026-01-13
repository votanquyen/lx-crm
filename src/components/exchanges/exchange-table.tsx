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

export function ExchangeTable({
  requests,
  onApprove,
  onCancel,
  onComplete,
}: ExchangeTableProps) {
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b">
        <div className="flex items-center h-10">
          <div className="flex-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Khách hàng / Vị trí</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-center">Độ ưu tiên</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Trạng thái</div>
          <div className="w-32 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-center">Số cây</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Ngày dự kiến</div>
          <div className="w-12 px-4 shrink-0"></div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-4 border shadow-sm">
              <RefreshCw className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Không có yêu cầu đổi cây</h4>
            <p className="text-sm font-medium text-slate-400 mt-1">Hệ thống chưa ghi nhận yêu cầu nào trong kỳ này.</p>
          </div>
        ) : (
          requests.map((request) => {
            return (
              <div key={request.id} className="flex items-center data-table-row group py-3 min-h-[64px]">
                {/* Customer & Address */}
                <div className="flex-1 px-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/customers/${request.customer.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-primary transition-colors truncate"
                    >
                      {request.customer.companyName}
                    </Link>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">#{request.customer.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-2.5 w-2.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight line-clamp-1">
                      {request.customer.district || "N/A"} • {request.customer.address}
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div className="w-40 px-4 shrink-0 flex flex-col items-center">
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight",
                    request.priority === "URGENT" ? "text-rose-600" :
                      request.priority === "HIGH" ? "text-amber-600" :
                        request.priority === "MEDIUM" ? "text-blue-600" : "text-slate-400"
                  )}>
                    {request.priority === "URGENT" && <AlertTriangle className="h-2.5 w-2.5" />}
                    {request.priority === "URGENT" ? "Khẩn cấp" :
                      request.priority === "HIGH" ? "Cao" :
                        request.priority === "MEDIUM" ? "Trung bình" : "Thấp"}
                  </div>
                  <div className="mt-1 w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        request.priorityScore >= 70 ? "bg-rose-500" :
                          request.priorityScore >= 40 ? "bg-amber-500" :
                            "bg-slate-300"
                      )}
                      style={{ width: `${request.priorityScore}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="w-40 px-4 shrink-0">
                  <div className={cn(
                    "status-badge scale-90 origin-left",
                    request.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      request.status === "SCHEDULED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        request.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                  )}>
                    {request.status === "COMPLETED" ? "Hoàn thành" :
                      request.status === "SCHEDULED" ? "Đã duyệt" :
                        request.status === "PENDING" ? "Chờ duyệt" : "Đã hủy"}
                  </div>
                </div>

                {/* Quantity */}
                <div className="w-32 px-4 shrink-0 flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span className="text-sm font-black text-slate-700">{request.quantity}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Cây đổi</span>
                </div>

                {/* Date */}
                <div className="w-40 px-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {request.preferredDate
                      ? format(new Date(request.preferredDate), "dd/MM/yyyy", { locale: vi })
                      : format(new Date(request.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </div>
                </div>

                {/* Actions */}
                <div className="w-12 px-4 shrink-0 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
                        <Link href={`/exchanges/${request.id}`}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Chi tiết yêu cầu
                        </Link>
                      </DropdownMenuItem>
                      {request.status === "PENDING" && onApprove && (
                        <DropdownMenuItem onClick={() => onApprove(request.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-primary">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Phê duyệt yêu cầu
                        </DropdownMenuItem>
                      )}
                      {["APPROVED", "SCHEDULED"].includes(request.status) && onComplete && (
                        <DropdownMenuItem onClick={() => onComplete(request.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-emerald-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Hoàn thành đổi cây
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {!["COMPLETED", "CANCELLED"].includes(request.status) && onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(request.id)}
                          className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-rose-600 focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
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
