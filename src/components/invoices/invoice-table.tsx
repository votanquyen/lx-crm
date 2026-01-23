/**
 * Invoice Table Component (Virtualized)
 * Uses TanStack Virtual for smooth scrolling with large datasets
 */
"use client";

import React, { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Eye, MoreHorizontal, Send, XCircle, DollarSign, Building2, Receipt } from "lucide-react";
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
  // SmartVAS fields (placeholders until Phase 2 migration)
  smartvasInvoiceNumber?: string | null;
  smartvasSerial?: string | null;
  smartvasIssueDate?: DateOrString | null;
  paymentDate?: DateOrString | null;
  subtotalAmount?: number | null;
  vatAmount?: number | null;
  customer: {
    id: string;
    code: string;
    companyName: string;
    taxCode?: string | null;
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
      className="data-table-row group flex h-[72px] items-center"
    >
      {/* Company Name (First) */}
      <div className="w-[200px] shrink-0 px-4 py-2">
        <Link
          href={`/customers/${invoice.customer.id}`}
          className="hover:text-primary block truncate text-xs font-bold text-slate-900 transition-colors"
        >
          {invoice.customer.companyName}
        </Link>
        <div className="mt-0.5 flex items-center gap-1.5">
          <Building2 className="text-muted-foreground h-2.5 w-2.5" aria-hidden="true" />
          <span className="text-muted-foreground text-[10px] font-bold tracking-tight">
            {invoice.customer.taxCode || invoice.customer.code}
          </span>
        </div>
      </div>

      {/* SmartVAS Invoice Number */}
      <div className="w-[100px] shrink-0 px-4 py-2">
        <span className="text-xs font-bold text-slate-900">
          {invoice.smartvasInvoiceNumber || invoice.invoiceNumber}
        </span>
      </div>

      {/* SmartVAS Serial */}
      <div className="w-[80px] shrink-0 px-4 py-2">
        <span className="text-xs font-medium text-slate-600">{invoice.smartvasSerial || "-"}</span>
      </div>

      {/* Issue Date */}
      <div className="w-[100px] shrink-0 px-4 py-2">
        <span className="text-xs font-medium text-slate-600">
          {format(new Date(invoice.smartvasIssueDate || invoice.issueDate), "dd/MM/yyyy", {
            locale: vi,
          })}
        </span>
      </div>

      {/* Subtotal (Chưa VAT) */}
      <div className="w-[100px] shrink-0 px-4 py-2 text-right">
        <span className="text-xs font-medium text-slate-600">
          {invoice.subtotalAmount != null ? formatCurrency(invoice.subtotalAmount) : "-"}
        </span>
      </div>

      {/* VAT */}
      <div className="w-[80px] shrink-0 px-4 py-2 text-right">
        <span className="text-xs font-medium text-slate-600">
          {invoice.vatAmount != null ? formatCurrency(invoice.vatAmount) : "-"}
        </span>
      </div>

      {/* Total Amount */}
      <div className="w-[100px] shrink-0 px-4 py-2 text-right">
        <span className="text-xs font-black text-slate-900">
          {formatCurrency(invoice.totalAmount)}
        </span>
      </div>

      {/* Payment Date */}
      <div className="w-[100px] shrink-0 px-4 py-2">
        {invoice.paymentDate ? (
          <span className="text-xs font-medium text-emerald-600">
            {format(new Date(invoice.paymentDate), "dd/MM/yyyy", { locale: vi })}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">-</span>
        )}
      </div>

      {/* Status */}
      <div className="w-[100px] shrink-0 px-4 py-2">
        <div
          className={cn(
            "status-badge text-[10px]",
            invoice.status === "PAID"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : invoice.status === "DRAFT"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : invoice.status === "SENT"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : invoice.status === "PARTIAL"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : invoice.status === "OVERDUE" || overdue
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "bg-slate-50 text-slate-500"
          )}
        >
          {overdue && invoice.status !== "PAID"
            ? "Quá hạn"
            : invoice.status === "PAID"
              ? "Đã TT"
              : invoice.status === "SENT"
                ? "Đã gửi"
                : invoice.status === "PARTIAL"
                  ? "TT 1 phần"
                  : invoice.status === "DRAFT"
                    ? "Nháp"
                    : "Đã hủy"}
        </div>
      </div>

      {/* Actions */}
      <div className="flex w-12 shrink-0 justify-end px-4 py-2">
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
              <Link href={`/invoices/${invoice.id}`}>
                <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                Dữ liệu chi tiết
              </Link>
            </DropdownMenuItem>
            {invoice.status === "DRAFT" && onSend && (
              <DropdownMenuItem
                onClick={() => onSend(invoice.id)}
                className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
              >
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Gửi đối tác
              </DropdownMenuItem>
            )}
            {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && onRecordPayment && (
              <DropdownMenuItem
                onClick={() => onRecordPayment(invoice.id)}
                className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
              >
                <DollarSign className="mr-2 h-4 w-4" aria-hidden="true" />
                Ghi nhận thanh toán
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {invoice.status !== "CANCELLED" && invoice._count.payments === 0 && onCancel && (
              <DropdownMenuItem
                onClick={() => onCancel(invoice.id)}
                className="py-2.5 font-sans text-xs font-bold tracking-tight text-rose-600 uppercase focus:text-rose-600"
              >
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-slate-50 text-slate-200 shadow-sm">
          <Receipt className="h-8 w-8" aria-hidden="true" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Chưa có hóa đơn</h4>
        <p className="mt-1 text-sm font-medium text-slate-400">
          Hóa đơn sẽ được tạo tự động từ bảng kê đã xác nhận.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b bg-slate-50/80 backdrop-blur-sm">
        <div className="flex h-10 items-center">
          <div className="text-muted-foreground w-[200px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Công ty
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Số HĐ
          </div>
          <div className="text-muted-foreground w-[80px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Ký hiệu
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Ngày xuất
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-right text-[10px] font-bold tracking-widest uppercase">
            Chưa VAT
          </div>
          <div className="text-muted-foreground w-[80px] shrink-0 px-4 text-right text-[10px] font-bold tracking-widest uppercase">
            VAT
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-right text-[10px] font-bold tracking-widest uppercase">
            Tổng cộng
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Ngày TT
          </div>
          <div className="text-muted-foreground w-[100px] shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
            Trạng thái
          </div>
          <div className="w-12 shrink-0 px-4"></div>
        </div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="scrollbar-hide overflow-auto"
        style={{ maxHeight: "calc(100vh - 440px)" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
          className="divide-border/50 divide-y"
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
});
