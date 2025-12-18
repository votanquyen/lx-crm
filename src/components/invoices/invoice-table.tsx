/**
 * Invoice Table Component
 */
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Receipt, Eye, MoreHorizontal, Send, XCircle, DollarSign } from "lucide-react";
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

interface InvoiceTableProps {
  invoices: Invoice[];
  onSend?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRecordPayment?: (id: string) => void;
}

export function InvoiceTable({ invoices, onSend, onCancel, onRecordPayment }: InvoiceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const isOverdue = (dueDate: Date, status: InvoiceStatus) => {
    if (["PAID", "CANCELLED"].includes(status)) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Số hóa đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hạn thanh toán</TableHead>
            <TableHead className="text-right">Tổng tiền</TableHead>
            <TableHead className="text-right">Còn nợ</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Chưa có hóa đơn nào
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const overdue = isOverdue(invoice.dueDate, invoice.status);

              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    {invoice.contract && (
                      <p className="text-sm text-muted-foreground">
                        HĐ: {invoice.contract.contractNumber}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${invoice.customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {invoice.customer.companyName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customer.code}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {overdue && invoice.status !== "OVERDUE" && (
                      <Badge variant="destructive" className="ml-2">
                        Quá hạn
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={overdue ? "text-destructive font-medium" : ""}>
                      {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(invoice.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.outstandingAmount > 0 ? (
                      <span className="text-orange-600">
                        {formatCurrency(invoice.outstandingAmount)}
                      </span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {invoice.status === "DRAFT" && onSend && (
                          <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Gửi hóa đơn
                          </DropdownMenuItem>
                        )}
                        {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) &&
                          onRecordPayment && (
                            <DropdownMenuItem onClick={() => onRecordPayment(invoice.id)}>
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
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Hủy hóa đơn
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
