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
import { Receipt, Eye, MoreHorizontal, Send, XCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import type { InvoiceStatus } from "@prisma/client";

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
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

const statusConfig: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  PARTIAL: { label: "Thanh toán một phần", variant: "outline" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  OVERDUE: { label: "Quá hạn", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "secondary" },
};

/** Check if invoice is overdue */
const isOverdue = (dueDate: Date, status: InvoiceStatus): boolean => {
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
  const status = statusConfig[invoice.status];
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
      className="flex items-center border-b hover:bg-muted/50 transition-colors"
    >
      {/* Invoice Number */}
      <div className="flex-1 p-4">
        <Link
          href={`/invoices/${invoice.id}`}
          className="font-medium hover:underline"
        >
          {invoice.invoiceNumber}/{format(new Date(invoice.issueDate), "d-MM")}
        </Link>
        {invoice.contract && (
          <p className="text-sm text-muted-foreground">
            HĐ: {invoice.contract.contractNumber}
          </p>
        )}
      </div>

      {/* Customer */}
      <div className="flex-1 p-4">
        <Link
          href={`/customers/${invoice.customer.id}`}
          className="font-medium hover:underline"
        >
          {invoice.customer.companyName}
        </Link>
        <p className="text-sm text-muted-foreground">
          {invoice.customer.code}
        </p>
      </div>

      {/* Status */}
      <div className="w-40 p-4">
        <Badge variant={status.variant}>{status.label}</Badge>
        {overdue && invoice.status !== "OVERDUE" && (
          <Badge variant="destructive" className="ml-2">
            Quá hạn
          </Badge>
        )}
      </div>

      {/* Due Date */}
      <div className="w-32 p-4">
        <span className={overdue ? "text-destructive font-medium" : ""}>
          {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
        </span>
      </div>

      {/* Total Amount */}
      <div className="w-32 p-4 text-right">
        {formatCurrency(invoice.totalAmount)}
      </div>

      {/* Outstanding */}
      <div className="w-32 p-4 text-right font-medium">
        {invoice.outstandingAmount > 0 ? (
          <span className="text-orange-600">
            {formatCurrency(invoice.outstandingAmount)}
          </span>
        ) : (
          <span className="text-green-600">0</span>
        )}
      </div>

      {/* Actions */}
      <div className="w-12 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mở menu thao tác">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${invoice.id}`}>
                <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                Xem chi tiết
              </Link>
            </DropdownMenuItem>
            {invoice.status === "DRAFT" && onSend && (
              <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Gửi hóa đơn
              </DropdownMenuItem>
            )}
            {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) &&
              onRecordPayment && (
                <DropdownMenuItem onClick={() => onRecordPayment(invoice.id)}>
                  <DollarSign className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ghi nhận thanh toán
                </DropdownMenuItem>
              )}
            <DropdownMenuSeparator />
            {invoice.status !== "CANCELLED" &&
              invoice._count.payments === 0 &&
              onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(invoice.id)}
                  className="text-destructive"
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
    estimateSize: () => 72, // Approximate row height with 2-line content
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Empty state
  if (invoices.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
        Chưa có hóa đơn nào
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex font-medium text-sm text-muted-foreground">
          <div className="flex-1 p-4">Số hóa đơn</div>
          <div className="flex-1 p-4">Khách hàng</div>
          <div className="w-40 p-4">Trạng thái</div>
          <div className="w-32 p-4">Hạn thanh toán</div>
          <div className="w-32 p-4 text-right">Tổng tiền</div>
          <div className="w-32 p-4 text-right">Còn nợ</div>
          <div className="w-12 p-4"></div>
        </div>
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
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
