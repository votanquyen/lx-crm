/**
 * Enhanced Invoice Table Component (Virtualized)
 * Features: Status badges with icons, column toggle, hover effects, overdue highlighting
 */
"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Receipt, Info } from "lucide-react";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { StatusBadge } from "@/components/invoices/status-badge";
import { ColumnToggle, useColumnVisibility, type ColumnConfig } from "@/components/invoices/column-toggle";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Column configuration
const COLUMN_CONFIGS: ColumnConfig[] = [
    { id: "company", label: "Công ty", defaultVisible: true, required: true },
    { id: "invoiceNumber", label: "Số HĐ", defaultVisible: true, required: true },
    { id: "serial", label: "Serial", defaultVisible: false },
    { id: "issueDate", label: "Ngày xuất", defaultVisible: true, required: true },
    { id: "breakdown", label: "Chi tiết", defaultVisible: true },
    { id: "subtotal", label: "Chưa VAT", defaultVisible: false },
    { id: "vat", label: "VAT", defaultVisible: false },
    { id: "total", label: "Tổng cộng", defaultVisible: true, required: true },
    { id: "paymentDate", label: "Ngày TT", defaultVisible: true },
    { id: "status", label: "Trạng thái", defaultVisible: true, required: true },
    { id: "actions", label: "Thao tác", defaultVisible: true, required: true },
];

interface InvoiceVirtualRowProps {
    invoice: Invoice;
    virtualStart: number;
    measureElement: (el: Element | null) => void;
    dataIndex: number;
    visibleColumns: string[];
}

/** Memoized virtual row for invoice */
const InvoiceVirtualRow = React.memo(function InvoiceVirtualRow({
    invoice,
    virtualStart,
    measureElement,
    dataIndex,
    visibleColumns,
}: InvoiceVirtualRowProps) {
    const overdue = isOverdue(invoice.dueDate, invoice.status);
    const isColumnVisible = (id: string) => visibleColumns.includes(id);

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
            className={cn(
                "group flex h-[60px] items-center border-b border-slate-100 transition-all duration-150",
                overdue && invoice.status !== "PAID"
                    ? "bg-rose-50/30 hover:bg-rose-50/50"
                    : "hover:bg-slate-50/50"
            )}
        >
            {/* Company Name */}
            {isColumnVisible("company") && (
                <div className="w-[200px] shrink-0 px-4 py-2">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/customers/${invoice.customer.id}`}
                                    className="block truncate text-xs font-bold text-slate-700 transition-colors hover:text-blue-600"
                                >
                                    {invoice.customer.companyName}
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                                <p className="font-bold">{invoice.customer.companyName}</p>
                                {invoice.customer.taxCode && (
                                    <p className="text-xs text-slate-400">MST: {invoice.customer.taxCode}</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="rounded bg-slate-100 px-1 text-[10px] font-bold tracking-tight text-slate-400">
                            {invoice.customer.code}
                        </span>
                    </div>
                </div>
            )}

            {/* Invoice Number */}
            {isColumnVisible("invoiceNumber") && (
                <div className="w-[100px] shrink-0 px-4 py-2">
                    <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                        {invoice.smartvasInvoiceNumber || invoice.invoiceNumber}
                    </Link>
                </div>
            )}

            {/* Serial */}
            {isColumnVisible("serial") && (
                <div className="w-[80px] shrink-0 px-4 py-2">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {invoice.smartvasSerial || "-"}
                    </span>
                </div>
            )}

            {/* Issue Date */}
            {isColumnVisible("issueDate") && (
                <div className="w-[100px] shrink-0 px-4 py-2">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {format(new Date(invoice.smartvasIssueDate || invoice.issueDate), "dd/MM/yyyy", {
                            locale: vi,
                        })}
                    </span>
                </div>
            )}

            {/* Breakdown (Subtotal + VAT with tooltip) */}
            {isColumnVisible("breakdown") && (
                <div className="w-[120px] shrink-0 px-4 py-2 text-right">
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center justify-end gap-1 cursor-help">
                                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                                        {invoice.subtotalAmount != null
                                            ? formatCurrency(invoice.subtotalAmount)
                                            : "-"}
                                    </span>
                                    <Info className="h-3 w-3 text-slate-400" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">Chưa VAT:</span>
                                        <span className="font-bold tabular-nums">
                                            {invoice.subtotalAmount != null
                                                ? formatCurrency(invoice.subtotalAmount)
                                                : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-400">VAT:</span>
                                        <span className="font-bold tabular-nums">
                                            {invoice.vatAmount != null ? formatCurrency(invoice.vatAmount) : "-"}
                                        </span>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Subtotal (hidden by default) */}
            {isColumnVisible("subtotal") && (
                <div className="w-[100px] shrink-0 px-4 py-2 text-right">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {invoice.subtotalAmount != null ? formatCurrency(invoice.subtotalAmount) : "-"}
                    </span>
                </div>
            )}

            {/* VAT (hidden by default) */}
            {isColumnVisible("vat") && (
                <div className="w-[80px] shrink-0 px-4 py-2 text-right">
                    <span className="text-xs font-medium text-slate-600 tabular-nums">
                        {invoice.vatAmount != null ? formatCurrency(invoice.vatAmount) : "-"}
                    </span>
                </div>
            )}

            {/* Total Amount */}
            {isColumnVisible("total") && (
                <div className="w-[120px] shrink-0 px-4 py-2 text-right">
                    <span className="text-sm font-black text-slate-900 tracking-tight tabular-nums">
                        {formatCurrency(invoice.totalAmount)}
                    </span>
                </div>
            )}

            {/* Payment Date */}
            {isColumnVisible("paymentDate") && (
                <div className="w-[100px] shrink-0 px-4 py-2">
                    {invoice.paymentDate ? (
                        <span className="text-xs font-medium text-emerald-600 tabular-nums">
                            {format(new Date(invoice.paymentDate), "dd/MM/yyyy", { locale: vi })}
                        </span>
                    ) : (
                        <span className="text-xs font-medium text-slate-400">-</span>
                    )}
                </div>
            )}

            {/* Status */}
            {isColumnVisible("status") && (
                <div className="w-[120px] shrink-0 px-4 py-2">
                    <StatusBadge
                        status={overdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status}
                        size="sm"
                    />
                </div>
            )}

            {/* Actions */}
            {isColumnVisible("actions") && (
                <div className="flex w-12 shrink-0 justify-end px-4 py-2">
                    <InvoiceActions invoice={invoice} />
                </div>
            )}
        </div>
    );
});

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
    const parentRef = React.useRef<HTMLDivElement>(null);
    const { visibleColumns, toggleColumn, resetColumns, isColumnVisible } =
        useColumnVisibility(COLUMN_CONFIGS);

    const virtualizer = useVirtualizer({
        count: invoices.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
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
            {/* Table Controls */}
            <div className="flex items-center justify-between border-b bg-slate-50/50 px-4 py-3">
                <div className="text-sm font-medium text-slate-600">
                    <span className="font-bold text-slate-900 tabular-nums">{invoices.length}</span> hóa đơn
                </div>
                <ColumnToggle
                    columns={COLUMN_CONFIGS}
                    visibleColumns={visibleColumns}
                    onToggle={toggleColumn}
                    onReset={resetColumns}
                />
            </div>

            {/* Sticky header */}
            <div className="sticky top-0 z-20 border-b bg-slate-50/95 backdrop-blur-sm">
                <div className="flex h-10 items-center">
                    {isColumnVisible("company") && (
                        <div className="w-[200px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Công ty
                        </div>
                    )}
                    {isColumnVisible("invoiceNumber") && (
                        <div className="w-[100px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Số HĐ
                        </div>
                    )}
                    {isColumnVisible("serial") && (
                        <div className="w-[80px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Serial
                        </div>
                    )}
                    {isColumnVisible("issueDate") && (
                        <div className="w-[100px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Ngày xuất
                        </div>
                    )}
                    {isColumnVisible("breakdown") && (
                        <div className="w-[120px] shrink-0 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Chi tiết
                        </div>
                    )}
                    {isColumnVisible("subtotal") && (
                        <div className="w-[100px] shrink-0 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Chưa VAT
                        </div>
                    )}
                    {isColumnVisible("vat") && (
                        <div className="w-[80px] shrink-0 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            VAT
                        </div>
                    )}
                    {isColumnVisible("total") && (
                        <div className="w-[120px] shrink-0 px-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Tổng cộng
                        </div>
                    )}
                    {isColumnVisible("paymentDate") && (
                        <div className="w-[100px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Ngày TT
                        </div>
                    )}
                    {isColumnVisible("status") && (
                        <div className="w-[120px] shrink-0 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            Trạng thái
                        </div>
                    )}
                    {isColumnVisible("actions") && (
                        <div className="w-12 shrink-0 px-4"></div>
                    )}
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
                                visibleColumns={visibleColumns}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

InvoiceTable.displayName = "InvoiceTable";
