/**
 * Payment Recording Form Component
 * Form for recording payments against invoices
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createPayment, updatePayment } from "@/actions/payments";
import { createPaymentSchema } from "@/lib/validations/payment";
import type { z } from "zod";
import type { Payment, Invoice, Customer, PaymentMethod } from "@prisma/client";

type FormValues = z.infer<typeof createPaymentSchema>;

interface PaymentFormProps {
  invoice: Invoice & {
    customer: Pick<Customer, "id" | "code" | "companyName">;
  };
  payment?: Payment;
  remainingBalance: number;
}

export function PaymentForm({ invoice, payment, remainingBalance }: PaymentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createPaymentSchema) as any,
    defaultValues: payment
      ? {
          invoiceId: payment.invoiceId,
          amount: Number(payment.amount),
          paymentDate: new Date(payment.paymentDate),
          paymentMethod: payment.paymentMethod,
          bankRef: payment.bankRef,
          bankName: payment.bankName,
          accountNumber: payment.accountNumber,
          accountName: payment.accountName,
          receivedBy: payment.receivedBy,
          receiptNumber: payment.receiptNumber,
          notes: payment.notes,
          receiptUrl: payment.receiptUrl,
        }
      : {
          invoiceId: invoice.id,
          amount: remainingBalance,
          paymentDate: new Date(),
          paymentMethod: "BANK_TRANSFER" as PaymentMethod,
        },
  });

  const selectedMethod = form.watch("paymentMethod");

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      if (payment) {
        await updatePayment(payment.id, data);
        toast.success("Cập nhật thanh toán thành công!");
        router.push(`/payments/${payment.id}`);
      } else {
        await createPayment(data);
        toast.success("Ghi nhận thanh toán thành công!");
        router.push(`/invoices/${invoice.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Invoice Info */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
        <h3 className="font-semibold">Thông tin hóa đơn</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số hóa đơn:</span>
            <span className="font-medium">
              {invoice.invoiceNumber}/{format(new Date(invoice.issueDate), "d-MM")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Khách hàng:</span>
            <span className="font-medium">{invoice.customer.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tổng tiền:</span>
            <span className="font-medium">{Number(invoice.totalAmount).toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Đã thanh toán:</span>
            <span className="font-medium">{Number(invoice.paidAmount).toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground font-semibold">Còn lại:</span>
            <span className="font-bold text-orange-600">
              {remainingBalance.toLocaleString()}đ
            </span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông tin thanh toán</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Số tiền thanh toán <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              {...form.register("amount", { valueAsNumber: true })}
              placeholder="0"
              max={remainingBalance}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Tối đa: {remainingBalance.toLocaleString()}đ
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">
              Ngày thanh toán <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentDate"
              type="date"
              {...form.register("paymentDate", {
                setValueAs: (value) => (value ? new Date(value) : undefined),
              })}
              max={new Date().toISOString().split("T")[0]}
            />
            {form.formState.errors.paymentDate && (
              <p className="text-sm text-red-500">{form.formState.errors.paymentDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">
            Phương thức thanh toán <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.watch("paymentMethod") ?? undefined}
            onValueChange={(value) => form.setValue("paymentMethod", value as PaymentMethod)}
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Chọn phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK_TRANSFER">Chuyển khoản ngân hàng</SelectItem>
              <SelectItem value="CASH">Tiền mặt</SelectItem>
              <SelectItem value="CARD">Thẻ</SelectItem>
              <SelectItem value="MOMO">Ví MoMo</SelectItem>
              <SelectItem value="ZALOPAY">ZaloPay</SelectItem>
              <SelectItem value="VNPAY">VNPay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bank Transfer Details */}
      {selectedMethod === "BANK_TRANSFER" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin chuyển khoản</h3>

          <div className="space-y-2">
            <Label htmlFor="bankRef">
              Số giao dịch <span className="text-red-500">*</span>
            </Label>
            <Input id="bankRef" {...form.register("bankRef")} placeholder="FT12345678" />
            {form.formState.errors.bankRef && (
              <p className="text-sm text-red-500">{form.formState.errors.bankRef.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Ngân hàng</Label>
              <Input id="bankName" {...form.register("bankName")} placeholder="Vietcombank, BIDV..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Số tài khoản</Label>
              <Input id="accountNumber" {...form.register("accountNumber")} placeholder="0123456789" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Tên tài khoản</Label>
            <Input id="accountName" {...form.register("accountName")} placeholder="NGUYEN VAN A" />
          </div>
        </div>
      )}

      {/* Cash Details */}
      {selectedMethod === "CASH" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thông tin tiền mặt</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receivedBy">
                Người nhận <span className="text-red-500">*</span>
              </Label>
              <Input id="receivedBy" {...form.register("receivedBy")} placeholder="Nguyễn Văn A" />
              {form.formState.errors.receivedBy && (
                <p className="text-sm text-red-500">{form.formState.errors.receivedBy.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Số biên nhận</Label>
              <Input id="receiptNumber" {...form.register("receiptNumber")} placeholder="BN-001" />
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông tin bổ sung</h3>

        <div className="space-y-2">
          <Label htmlFor="notes">Ghi chú</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Ghi chú về thanh toán..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptUrl">URL biên lai/chứng từ</Label>
          <Input
            id="receiptUrl"
            type="url"
            {...form.register("receiptUrl")}
            placeholder="https://example.com/receipt.pdf"
          />
          {form.formState.errors.receiptUrl && (
            <p className="text-sm text-red-500">{form.formState.errors.receiptUrl.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {payment ? "Cập nhật thanh toán" : "Ghi nhận thanh toán"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
