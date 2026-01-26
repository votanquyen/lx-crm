/**
 * Invoice Detail Component
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Receipt,
  Phone,
  DollarSign,
  Send,
  XCircle,
  FileText,
  CheckCircle,
  Loader2,
  Printer,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import type { InvoiceStatus, PaymentMethod } from "@prisma/client";

// Accept both Date and string for serialization compatibility
type DateOrString = Date | string;

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: DateOrString;
  dueDate: DateOrString;
  subtotal: number;
  // Accept both field names for compatibility
  taxAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  discountAmount?: number | null;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes?: string | null;
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
    paymentDate: DateOrString;
    // Accept both field names for compatibility
    method?: PaymentMethod;
    paymentMethod?: PaymentMethod;
    reference?: string | null;
    bankRef?: string | null;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

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
      {/* Action Bar - Floating Top */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md p-4 -mx-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Quay lại
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <Badge variant={status.variant} className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
            {status.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="animate-pulse">Quá hạn</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="In hóa đơn">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Tải xuống PDF">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Chia sẻ">
            <Share2 className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-slate-200 mx-1" />

          {invoice.status === "DRAFT" && (
            <Button onClick={handleSend} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Gửi hóa đơn
            </Button>
          )}
          {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
            <Button onClick={() => setShowPaymentDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200">
              <DollarSign className="mr-2 h-4 w-4" aria-hidden="true" />
              Thanh toán
            </Button>
          )}
          {invoice.status !== "CANCELLED" && invoice.payments.length === 0 && (
            <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200" onClick={handleCancel} disabled={isPending}>
              <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Hủy
            </Button>
          )}
        </div>
      </div>

      {/* Main Invoice Paper */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none">

        {/* Brand Header */}
        <div className="bg-slate-900 text-white p-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-500 rounded-lg p-1.5">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">LỘC XANH</span>
            </div>
            <p className="text-slate-400 text-sm max-w-[250px]">
              Giải pháp cây xanh văn phòng chuyên nghiệp và tận tâm.
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black tracking-widest uppercase text-white mb-1">
              HÓA ĐƠN GTGT
            </h1>
            <p className="text-slate-400 font-mono text-sm">#{invoice.invoiceNumber}</p>
            {invoice.contract && (
              <Link href={`/contracts/${invoice.contract.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center justify-end gap-1 mt-1">
                <FileText className="h-3 w-3" /> HĐ: {invoice.contract.contractNumber}
              </Link>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Grid: From / To */}
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhà cung cấp</h3>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">CÔNG TY TNHH LỘC XANH</p>
                <p className="text-sm text-slate-600">123 Đường ABC, Quận XYZ</p>
                <p className="text-sm text-slate-600">TP. Hồ Chí Minh, Việt Nam</p>
                <p className="text-sm text-slate-600">MST: 0312345678</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Khách hàng</h3>
              <div className="space-y-1">
                <Link href={`/customers/${invoice.customer.id}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  {invoice.customer.companyName}
                </Link>
                <p className="text-sm text-slate-600">{invoice.customer.address}</p>
                {invoice.customer.taxCode && <p className="text-sm text-slate-600">MST: {invoice.customer.taxCode}</p>}
                <div className="flex gap-4 mt-2">
                  {invoice.customer.contactPhone && (
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {invoice.customer.contactPhone}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Dates */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày phát hành</p>
              <p className="font-mono font-medium text-slate-700">{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hạn thanh toán</p>
              <p className={`font-mono font-medium ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                {format(new Date(invoice.dueDate), "dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</p>
              <p className="font-bold text-slate-700">{status.label}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiền</p>
              <p className="font-black text-slate-900 text-lg">{formatCurrency(invoice.totalAmount)}</p>
            </div>
          </div>

          {/* Table Items */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b-slate-200">
                  <TableHead className="font-bold text-slate-900 w-[50%]">Mô tả</TableHead>
                  <TableHead className="font-bold text-slate-900 text-center">SL</TableHead>
                  <TableHead className="font-bold text-slate-900 text-right">Đơn giá</TableHead>
                  <TableHead className="font-bold text-slate-900 text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id} className="border-b-slate-50 last:border-0 hover:bg-slate-50/50">
                    <TableCell className="text-slate-700 font-medium">{item.description}</TableCell>
                    <TableCell className="text-center text-slate-600 font-mono">{item.quantity}</TableCell>
                    <TableCell className="text-right text-slate-600 font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 font-mono">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          <div className="flex flex-col md:flex-row justify-between gap-8 border-t pt-8">
            <div className="w-full md:w-1/2 space-y-6">
              {invoice.notes && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-sm">
                  <strong className="block mb-1 text-amber-900 uppercase text-xs tracking-wide">Ghi chú</strong>
                  {invoice.notes}
                </div>
              )}

              {invoice.payments.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Lịch sử thanh toán
                  </h4>
                  <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
                    {invoice.payments.map((p) => (
                      <div key={p.id} className="flex justify-between p-3 border-b last:border-0 bg-slate-50/50">
                        <div>
                          <div className="font-medium text-slate-700">{format(new Date(p.paymentDate), "dd/MM/yyyy")}</div>
                          <div className="text-xs text-slate-500">{paymentMethodLabels[(p.method ?? p.paymentMethod) as PaymentMethod]}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">+{formatCurrency(p.amount)}</div>
                          <div className="text-xs text-slate-400">{p.reference || "-"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-5/12 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tạm tính</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {(invoice.taxAmount ?? invoice.vatAmount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Thuế GTGT</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount ?? invoice.vatAmount ?? 0)}</span>
                </div>
              )}
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Chiết khấu</span>
                  <span className="font-medium">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-900">TỔNG CỘNG</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(invoice.totalAmount)}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 font-medium">Đã thanh toán</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-base mt-2">
                  <span className={`${invoice.outstandingAmount > 0 ? "text-rose-600" : "text-slate-500"} font-bold`}>
                    CÒN NỢ
                  </span>
                  <span className={`${invoice.outstandingAmount > 0 ? "text-rose-600" : "text-emerald-600"} font-black`}>
                    {formatCurrency(invoice.outstandingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của Lộc Xanh.</p>
        </div>
      </div>

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
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
