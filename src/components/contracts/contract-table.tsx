"use client";

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
  Package
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
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b">
        <div className="flex items-center h-10">
          <div className="flex-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hợp đồng / Khách hàng</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Trạng thái</div>
          <div className="w-56 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Thời hạn hiệu lực</div>
          <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Giá trị/tháng</div>
          <div className="w-24 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-center">Số cây</div>
          <div className="w-12 px-4 shrink-0"></div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {contracts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="font-medium">Chưa có hợp đồng nào</p>
          </div>
        ) : (
          contracts.map((contract) => {
            const daysRemaining = getDaysRemaining(contract.endDate);
            const isExpiringSoon = contract.status === "ACTIVE" && daysRemaining <= 30 && daysRemaining > 0;
            const isExpired = contract.status === "EXPIRED" || daysRemaining <= 0;

            return (
              <div key={contract.id} className="flex items-center data-table-row group py-3 min-h-[64px]">
                {/* ID & Customer */}
                <div className="flex-1 px-4 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-primary transition-colors truncate"
                    >
                      {contract.contractNumber}
                    </Link>
                    {isExpiringSoon && (
                      <span className="flex items-center bg-amber-50 text-[9px] font-black text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 animate-pulse">
                        SẮP HẾT HẠN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-2.5 w-2.5 text-slate-400" />
                    <Link
                      href={`/customers/${contract.customer.id}`}
                      className="text-[10px] font-bold text-muted-foreground hover:text-slate-900 truncate"
                    >
                      {contract.customer.companyName} • {contract.customer.code}
                    </Link>
                  </div>
                </div>

                {/* Status */}
                <div className="w-40 px-4 shrink-0">
                  <div className={cn(
                    "status-badge scale-90 origin-left",
                    contract.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      contract.status === "DRAFT" ? "bg-slate-50 text-slate-600 border-slate-200" :
                        isExpired ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                  )}>
                    {contract.status === "ACTIVE" ? "Hoạt động" :
                      contract.status === "DRAFT" ? "Bản nháp" :
                        contract.status === "EXPIRED" ? "Hết hạn" :
                          contract.status === "SIGNED" ? "Đã ký" : "Đang xử lý"}
                  </div>
                </div>

                {/* Validity */}
                <div className="w-56 px-4 shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(contract.startDate), "dd/MM/yyyy")}
                    <ArrowRight className="h-2.5 w-2.5 text-slate-300" />
                    <span className={cn(isExpiringSoon ? "text-amber-600 font-black" : "")}>
                      {format(new Date(contract.endDate), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-primary/20 transition-all",
                        isExpiringSoon ? "bg-amber-400" : isExpired ? "bg-rose-400" : "bg-primary"
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, (365 - daysRemaining) / 3.65))}%` }}
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="w-40 px-4 shrink-0 text-right">
                  <p className="text-sm font-black text-slate-900">{formatCurrency(contract.monthlyAmount)}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">/ Tháng</p>
                </div>

                {/* Plants */}
                <div className="w-24 px-4 shrink-0 flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-slate-400" />
                    <span className="text-sm font-black text-slate-700">{getTotalPlants(contract.items)}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Cây xanh</span>
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
                        <Link href={`/contracts/${contract.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      {["DRAFT", "PENDING"].includes(contract.status) && onActivate && (
                        <DropdownMenuItem onClick={() => onActivate(contract.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-primary">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Kích hoạt hợp đồng
                        </DropdownMenuItem>
                      )}
                      {["ACTIVE", "EXPIRED"].includes(contract.status) && onRenew && (
                        <DropdownMenuItem onClick={() => onRenew(contract.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-blue-600">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Gia hạn hiệu lực
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {contract.status !== "CANCELLED" && onCancel && (
                        <DropdownMenuItem
                          onClick={() => onCancel(contract.id)}
                          className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-rose-600 focus:text-rose-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
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
}
