/**
 * Invoice Detail Component
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Receipt,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Send,
  XCircle,
  FileText,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendInvoice, cancelInvoice, recordPayment } from "@/actions/invoices";
import { formatCurrency } from "@/lib/format";
import type { InvoiceStatus, PaymentMethod } from "@prisma/client";

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes: string | null;
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    taxCode: string | null;
  };
  contract: { id: string; contractNumber: string } | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    method: PaymentMethod;
    reference: string | null;
    notes: string | null;
  }[];
};

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  PARTIAL: { label: "Thanh toán một phần", variant: "outline" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  OVERDUE: { label: "Quá hạn", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "secondary" },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  CARD: "Thẻ",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
  VNPAY: "VNPay",
};

interface InvoiceDetailProps {
  invoice: InvoiceDetail;
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: invoice.outstandingAmount,
    method: "BANK_TRANSFER" as PaymentMethod,
    reference: "",
    notes: "",
  });

  const status = statusConfig[invoice.status];
  const isOverdue =
    new Date(invoice.dueDate) < new Date() && !["PAID", "CANCELLED"].includes(invoice.status);

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendInvoice(invoice.id);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    if (confirm("Bạn có chắc chắn muốn hủy hóa đơn này?")) {
      startTransition(async () => {
        const result = await cancelInvoice(invoice.id);
        if (result.success) {
          router.refresh();
        }
      });
    }
  };

  const handleRecordPayment = () => {
    startTransition(async () => {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference || undefined,
        notes: paymentData.notes || undefined,
      });
      if (result.success) {
        setShowPaymentDialog(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {invoice.invoiceNumber}/{format(new Date(invoice.issueDate), "d-MM")}
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
            {isOverdue && <Badge variant="destructive">Quá hạn</Badge>}
          </div>
          <p className="text-muted-foreground mt-1">Khách hàng: {invoice.customer.companyName}</p>
        </div>

        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <Button onClick={handleSend} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Gửi hóa đơn
            </Button>
          )}
          {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Ghi nhận thanh toán
            </Button>
          )}
          {invoice.status !== "CANCELLED" && invoice.payments.length === 0 && (
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              <XCircle className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}
        </div>
      </div>

      {/* Contract link */}
      {invoice.contract && (
        <div className="bg-muted flex items-center gap-2 rounded-lg p-4">
          <FileText className="h-4 w-4" />
          <span className="text-muted-foreground">Hợp đồng:</span>
          <Link href={`/contracts/${invoice.contract.id}`} className="text-primary hover:underline">
            {invoice.contract.contractNumber}
          </Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Link
                href={`/customers/${invoice.customer.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {invoice.customer.companyName}
              </Link>
              <p className="text-muted-foreground text-sm">{invoice.customer.code}</p>
            </div>
            <p className="text-sm">{invoice.customer.address}</p>
            {invoice.customer.taxCode && <p className="text-sm">MST: {invoice.customer.taxCode}</p>}
            <div className="flex flex-wrap gap-4">
              {invoice.customer.contactPhone && (
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="h-4 w-4" />
                  {invoice.customer.contactPhone}
                </div>
              )}
              {invoice.customer.contactEmail && (
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-4 w-4" />
                  {invoice.customer.contactEmail}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Thông tin hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Ngày phát hành</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Hạn thanh toán</p>
                <p
                  className={`flex items-center gap-1 font-medium ${isOverdue ? "text-destructive" : ""}`}
                >
                  <Calendar className="h-4 w-4" />
                  {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Đã thanh toán</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(invoice.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Còn nợ</p>
                <p
                  className={`text-lg font-bold ${invoice.outstandingAmount > 0 ? "text-orange-600" : "text-green-600"}`}
                >
                  {formatCurrency(invoice.outstandingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Mô tả</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">
                  Tạm tính:
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(invoice.subtotal)}
                </TableCell>
              </TableRow>
              {invoice.taxAmount > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Thuế:
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.taxAmount)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">
                  Tổng cộng:
                </TableCell>
                <TableCell className="text-primary text-right text-lg font-bold">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Lịch sử thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Mã tham chiếu</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.paymentDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                    <TableCell>{payment.reference || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            <DialogDescription>
              Còn nợ: {formatCurrency(invoice.outstandingAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền *</Label>
              <Input
                id="amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })
                }
                max={invoice.outstandingAmount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Phương thức</Label>
              <Select
                value={paymentData.method}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, method: value as PaymentMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                  <SelectItem value="CASH">Tiền mặt</SelectItem>
                  <SelectItem value="CARD">Thẻ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Mã tham chiếu</Label>
              <Input
                id="reference"
                value={paymentData.reference}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                placeholder="Mã giao dịch, số biên lai..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleRecordPayment} disabled={isPending || paymentData.amount <= 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
