"use client";

import { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileText,
  Eye,
  MoreHorizontal,
  RefreshCw,
  XCircle,
  CheckCircle,
  Building2,
  Calendar,
  ArrowRight,
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
import type { ContractStatus } from "@prisma/client";

type DateOrString = Date | string;

type Contract = {
  id: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: DateOrString;
  endDate: DateOrString;
  monthlyAmount: number;
  totalAmount: number;
  customer: {
    id: string;
    code: string;
    companyName: string;
  };
  items: { quantity: number }[];
  _count: { invoices: number };
};

interface ContractTableProps {
  contracts: Contract[];
  onActivate?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRenew?: (id: string) => void;
}

export function ContractTable({ contracts, onActivate, onCancel, onRenew }: ContractTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value);
  };

  const getTotalPlants = (items: { quantity: number }[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getDaysRemaining = (endDate: DateOrString) => {
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 border-b bg-slate-50/80 backdrop-blur-sm">
        <div className="flex h-10 items-center">
          <div className="text-muted-foreground flex-1 px-4 text-[10px] font-bold tracking-widest uppercase">
            Hợp đồng / Khách hàng
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Trạng thái
          </div>
          <div className="text-muted-foreground w-56 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Thời hạn hiệu lực
          </div>
          <div className="text-muted-foreground w-40 shrink-0 px-4 text-right text-[10px] font-bold tracking-widest uppercase">
            Giá trị/tháng
          </div>
          <div className="text-muted-foreground w-24 shrink-0 px-4 text-center text-[10px] font-bold tracking-widest uppercase">
            Số cây
          </div>
          <div className="w-12 shrink-0 px-4"></div>
        </div>
      </div>

      <div className="divide-border/50 divide-y">
        {contracts.length === 0 ? (
          <div className="text-muted-foreground p-12 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
            <p className="font-medium">Chưa có hợp đồng nào</p>
          </div>
        ) : (
          contracts.map((contract) => {
            const daysRemaining = getDaysRemaining(contract.endDate);
            const isExpiringSoon =
              contract.status === "ACTIVE" && daysRemaining <= 30 && daysRemaining > 0;
            const isExpired = contract.status === "EXPIRED" || daysRemaining <= 0;

            return (
              <div
                key={contract.id}
                className="data-table-row group flex min-h-[64px] items-center py-3"
              >
                {/* ID & Customer */}
                <div className="min-w-0 flex-1 px-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="hover:text-primary truncate text-xs font-bold text-slate-900 transition-colors"
                    >
                      {contract.contractNumber}
                    </Link>
                    {isExpiringSoon && (
                      <span className="flex animate-pulse items-center rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-600">
                        SẮP HẾT HẠN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                    <Link
                      href={`/customers/${contract.customer.id}`}
                      className="text-muted-foreground truncate text-[10px] font-bold hover:text-slate-900"
                    >
                      {contract.customer.companyName} • {contract.customer.code}
                    </Link>
                  </div>
                </div>

                {/* Status */}
                <div className="w-40 shrink-0 px-4">
                  <div
                    className={cn(
                      "status-badge origin-left scale-90",
                      contract.status === "ACTIVE"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : contract.status === "DRAFT"
                          ? "border-slate-200 bg-slate-50 text-slate-600"
                          : isExpired
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                    )}
                  >
                    {contract.status === "ACTIVE"
                      ? "Hoạt động"
                      : contract.status === "DRAFT"
                        ? "Bản nháp"
                        : contract.status === "EXPIRED"
                          ? "Hết hạn"
                          : contract.status === "SIGNED"
                            ? "Đã ký"
                            : "Đang xử lý"}
                  </div>
                </div>

                {/* Validity */}
                <div className="w-56 shrink-0 px-4">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                    {format(new Date(contract.startDate), "dd/MM/yyyy")}
                    <ArrowRight className="h-2.5 w-2.5 text-slate-300" aria-hidden="true" />
                    <span className={cn(isExpiringSoon ? "font-black text-amber-600" : "")}>
                      {format(new Date(contract.endDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "bg-primary/20 h-full transition-all",
                        isExpiringSoon ? "bg-amber-400" : isExpired ? "bg-rose-400" : "bg-primary"
                      )}
                      style={{
                        width: `${Math.max(0, Math.min(100, (365 - daysRemaining) / 3.65))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="w-40 shrink-0 px-4 text-right">
                  <p className="text-sm font-black text-slate-900">
                    {formatCurrency(contract.monthlyAmount)}
                  </p>
                  <p className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                    / Tháng
                  </p>
                </div>

                {/* Plants */}
                <div className="flex w-24 shrink-0 flex-col items-center px-4">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span className="text-sm font-black text-slate-700">
                      {getTotalPlants(contract.items)}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                    Cây xanh
                  </span>
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
                        <Link href={`/contracts/${contract.id}`}>
                          <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                          Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      {["DRAFT", "PENDING"].includes(contract.status) && onActivate && (
                        <DropdownMenuItem
                          onClick={() => onActivate(contract.id)}
                          className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Kích hoạt hợp đồng
                        </DropdownMenuItem>
                      )}
                      {["ACTIVE", "EXPIRED"].includes(contract.status) && onRenew && (
                        <DropdownMenuItem
                          onClick={() => onRenew(contract.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-blue-600 uppercase"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                          Gia hạn hiệu lực
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {contract.status !== "CANCELLED" && onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(contract.id)}
                          className="py-2.5 font-sans text-xs font-bold tracking-tight text-rose-600 uppercase focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hủy hợp đồng
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
});
