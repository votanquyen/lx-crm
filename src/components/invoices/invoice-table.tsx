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
      className="flex items-center data-table-row group h-[72px]"
    >
      {/* Company Name (First) */}
      <div className="w-[200px] px-4 py-2 shrink-0">
        <Link
          href={`/customers/${invoice.customer.id}`}
          className="text-xs font-bold text-slate-900 hover:text-primary transition-colors block truncate"
        >
          {invoice.customer.companyName}
        </Link>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Building2 className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
            {invoice.customer.taxCode || invoice.customer.code}
          </span>
        </div>
      </div>

      {/* SmartVAS Invoice Number */}
      <div className="w-[100px] px-4 py-2 shrink-0">
        <span className="text-xs font-bold text-slate-900">
          {invoice.smartvasInvoiceNumber || invoice.invoiceNumber}
        </span>
      </div>

      {/* SmartVAS Serial */}
      <div className="w-[80px] px-4 py-2 shrink-0">
        <span className="text-xs font-medium text-slate-600">
          {invoice.smartvasSerial || "-"}
        </span>
      </div>

      {/* Issue Date */}
      <div className="w-[100px] px-4 py-2 shrink-0">
        <span className="text-xs font-medium text-slate-600">
          {format(new Date(invoice.smartvasIssueDate || invoice.issueDate), "dd/MM/yyyy", { locale: vi })}
        </span>
      </div>

      {/* Subtotal (Chưa VAT) */}
      <div className="w-[100px] px-4 py-2 shrink-0 text-right">
        <span className="text-xs font-medium text-slate-600">
          {invoice.subtotalAmount != null ? formatCurrency(invoice.subtotalAmount) : "-"}
        </span>
      </div>

      {/* VAT */}
      <div className="w-[80px] px-4 py-2 shrink-0 text-right">
        <span className="text-xs font-medium text-slate-600">
          {invoice.vatAmount != null ? formatCurrency(invoice.vatAmount) : "-"}
        </span>
      </div>

      {/* Total Amount */}
      <div className="w-[100px] px-4 py-2 shrink-0 text-right">
        <span className="text-xs font-black text-slate-900">
          {formatCurrency(invoice.totalAmount)}
        </span>
      </div>

      {/* Payment Date */}
      <div className="w-[100px] px-4 py-2 shrink-0">
        {invoice.paymentDate ? (
          <span className="text-xs font-medium text-emerald-600">
            {format(new Date(invoice.paymentDate), "dd/MM/yyyy", { locale: vi })}
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">-</span>
        )}
      </div>

      {/* Status */}
      <div className="w-[100px] px-4 py-2 shrink-0">
        <div className={cn(
          "status-badge text-[10px]",
          invoice.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            invoice.status === "DRAFT" ? "bg-slate-50 text-slate-600 border-slate-200" :
              invoice.status === "SENT" ? "bg-blue-50 text-blue-700 border-blue-200" :
                invoice.status === "PARTIAL" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  (invoice.status === "OVERDUE" || overdue) ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-50 text-slate-500"
        )}>
          {overdue && invoice.status !== "PAID" ? "Quá hạn" :
            invoice.status === "PAID" ? "Đã TT" :
              invoice.status === "SENT" ? "Đã gửi" :
                invoice.status === "PARTIAL" ? "TT 1 phần" :
                  invoice.status === "DRAFT" ? "Nháp" : "Đã hủy"}
        </div>
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
        <h4 className="text-base font-bold text-slate-900">Chưa có hóa đơn</h4>
        <p className="text-sm font-medium text-slate-400 mt-1">Hóa đơn sẽ được tạo tự động từ bảng kê đã xác nhận.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm border-b">
        <div className="flex items-center h-10">
          <div className="w-[200px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Công ty</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Số HĐ</div>
          <div className="w-[80px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Ký hiệu</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Ngày xuất</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Chưa VAT</div>
          <div className="w-[80px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">VAT</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Tổng cộng</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Ngày TT</div>
          <div className="w-[100px] px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Trạng thái</div>
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
