/**
 * Invoice Table Component (Virtualized)
 * Uses TanStack Virtual for smooth scrolling with large datasets
 */
"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Eye, MoreHorizontal, Send, XCircle, DollarSign, Building2, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

// Accept both Date and string for serialization compatibility
type DateOrString = Date | string;

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: DateOrString;
  dueDate: DateOrString;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  customer: {
    id: string;
    code: string;
    companyName: string;
  };
  contract: {
    id: string;
    contractNumber: string;
  } | null;
  _count: { payments: number };
};

/** Check if invoice is overdue */
const isOverdue = (dueDate: DateOrString, status: InvoiceStatus): boolean => {
  if (["PAID", "CANCELLED"].includes(status)) return false;
  return new Date(dueDate) < new Date();
};

interface InvoiceTableProps {
  invoices: Invoice[];
  onSend?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRecordPayment?: (id: string) => void;
}

/** Memoized virtual row for invoice */
const InvoiceVirtualRow = React.memo(function InvoiceVirtualRow({
  invoice,
  virtualStart,
  measureElement,
  dataIndex,
  onSend,
  onCancel,
  onRecordPayment,
}: {
  invoice: Invoice;
  virtualStart: number;
  measureElement: (el: Element | null) => void;
  dataIndex: number;
  onSend?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRecordPayment?: (id: string) => void;
}) {
  const overdue = isOverdue(invoice.dueDate, invoice.status);

  return (
    <div
      data-index={dataIndex}
      ref={measureElement}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${virtualStart}px)`,
      }}
      className="flex items-center data-table-row group h-[72px]"
    >
      {/* Invoice Number */}
      <div className="w-[160px] px-4 py-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/invoices/${invoice.id}`}
              className="text-xs font-bold text-slate-900 hover:text-primary transition-colors truncate"
            >
              #{invoice.invoiceNumber}
            </Link>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              Kỳ {format(new Date(invoice.issueDate), "MM/yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="flex-1 px-4 py-2 min-w-0">
        <Link
          href={`/customers/${invoice.customer.id}`}
          className="text-xs font-bold text-slate-900 hover:text-primary transition-colors block truncate"
        >
          {invoice.customer.companyName}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
            {invoice.customer.code}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="w-36 px-4 py-2 shrink-0">
        <div className={cn(
          "status-badge",
          invoice.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            invoice.status === "DRAFT" ? "bg-slate-50 text-slate-600 border-slate-200" :
              invoice.status === "SENT" ? "bg-blue-50 text-blue-700 border-blue-200" :
                invoice.status === "PARTIAL" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  (invoice.status === "OVERDUE" || overdue) ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-50 text-slate-500"
        )}>
          {overdue && invoice.status !== "PAID" ? "Quá hạn" :
            invoice.status === "PAID" ? "Đã tất toán" :
              invoice.status === "SENT" ? "Đã gửi" :
                invoice.status === "PARTIAL" ? "Thanh toán một phần" :
                  invoice.status === "DRAFT" ? "Nháp" : "Đã hủy"}
        </div>
      </div>

      {/* Due Date */}
      <div className="w-32 px-4 py-2 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Hạn nộp</span>
          <span className={cn(
            "text-xs font-bold",
            overdue && invoice.status !== "PAID" ? "text-rose-600" : "text-slate-600"
          )}>
            {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
          </span>
        </div>
      </div>

      {/* Total Amount */}
      <div className="w-32 px-4 py-2 shrink-0 text-right">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">Tổng tiền</p>
        <p className="text-xs font-black text-slate-900">
          {formatCurrency(invoice.totalAmount)}
        </p>
      </div>

      {/* Outstanding */}
      <div className="w-32 px-4 py-2 shrink-0 text-right">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">Còn nợ</p>
        {invoice.outstandingAmount > 0 ? (
          <span className="text-sm font-black text-rose-600">
            {formatCurrency(invoice.outstandingAmount)}
          </span>
        ) : (
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">Đã thu đủ</span>
        )}
      </div>

      {/* Actions */}
      <div className="w-12 px-4 py-2 shrink-0 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
              <Link href={`/invoices/${invoice.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Dữ liệu chi tiết
              </Link>
            </DropdownMenuItem>
            {invoice.status === "DRAFT" && onSend && (
              <DropdownMenuItem onClick={() => onSend(invoice.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
                <Send className="mr-2 h-4 w-4" />
                Gửi đối tác
              </DropdownMenuItem>
            )}
            {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) &&
              onRecordPayment && (
                <DropdownMenuItem onClick={() => onRecordPayment(invoice.id)} className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-primary">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Ghi nhận thanh toán
                </DropdownMenuItem>
              )}
            <DropdownMenuSeparator />
            {invoice.status !== "CANCELLED" &&
              invoice._count.payments === 0 &&
              onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(invoice.id)}
                  className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-rose-600 focus:text-rose-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Hủy hóa đơn
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

export function InvoiceTable({ invoices, onSend, onCancel, onRecordPayment }: InvoiceTableProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Empty state
  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-4 border shadow-sm">
          <Receipt className="h-8 w-8" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Không có dữ liệu hóa đơn</h4>
        <p className="text-sm font-medium text-slate-400 mt-1">Vui lòng kiểm tra lại bộ lọc hoặc tạo hóa đơn mới.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm border-b">
        <div className="flex items-center h-10">
          <div className="w-[160px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Hóa đơn</div>
          <div className="flex-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đối tác / Khách hàng</div>
          <div className="w-36 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Trạng thái</div>
          <div className="w-32 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Hạn nộp</div>
          <div className="w-32 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Tổng cộng</div>
          <div className="w-32 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Phải thu</div>
          <div className="w-12 px-4 shrink-0"></div>
        </div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-hide"
        style={{ maxHeight: "calc(100vh - 440px)" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
          className="divide-y divide-border/50"
        >
          {virtualItems.map((virtualRow) => {
            const invoice = invoices[virtualRow.index];
            if (!invoice) return null;
            return (
              <InvoiceVirtualRow
                key={invoice.id}
                invoice={invoice}
                virtualStart={virtualRow.start}
                measureElement={virtualizer.measureElement}
                dataIndex={virtualRow.index}
                onSend={onSend}
                onCancel={onCancel}
                onRecordPayment={onRecordPayment}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
