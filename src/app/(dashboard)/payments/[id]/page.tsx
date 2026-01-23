/**
 * Payment Detail Page
 * View single payment with verification option
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Edit } from "lucide-react";
import { getPaymentById } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import { PaymentMethod } from "@prisma/client";

const paymentMethodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  MOMO: "Ví MoMo",
  ZALOPAY: "ZaloPay",
  VNPAY: "VNPay",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const payment = await getPaymentById(id).catch(() => notFound());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Chi tiết thanh toán</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về khoản thanh toán</p>
        </div>
        <div className="flex items-center gap-2">
          {!payment.isVerified && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/payments/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sửa
                </Link>
              </Button>
              <Button variant="default" size="sm">
                <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Xác minh
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 md:col-span-2">
          {/* Payment Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin thanh toán</CardTitle>
                <Badge variant={payment.isVerified ? "default" : "secondary"} className="text-sm">
                  {payment.isVerified ? "✓ Đã xác minh" : "⏳ Chưa xác minh"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Số tiền:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrencyDecimal(payment.amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày thanh toán:</span>
                  <span className="font-medium">
                    {new Date(payment.paymentDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phương thức:</span>
                  <Badge variant="outline">{paymentMethodLabels[payment.paymentMethod]}</Badge>
                </div>

                {payment.paymentMethod === "BANK_TRANSFER" && (
                  <>
                    {payment.bankRef && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số giao dịch:</span>
                        <span className="font-mono">{payment.bankRef}</span>
                      </div>
                    )}
                    {payment.bankName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngân hàng:</span>
                        <span>{payment.bankName}</span>
                      </div>
                    )}
                    {payment.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số TK:</span>
                        <span className="font-mono">{payment.accountNumber}</span>
                      </div>
                    )}
                    {payment.accountName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tên TK:</span>
                        <span>{payment.accountName}</span>
                      </div>
                    )}
                  </>
                )}

                {payment.paymentMethod === "CASH" && (
                  <>
                    {payment.receivedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Người nhận:</span>
                        <span>{payment.receivedBy}</span>
                      </div>
                    )}
                    {payment.receiptNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số biên nhận:</span>
                        <span className="font-mono">{payment.receiptNumber}</span>
                      </div>
                    )}
                  </>
                )}

                {payment.notes && (
                  <div className="border-t pt-3">
                    <span className="text-muted-foreground mb-1 block">Ghi chú:</span>
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                )}

                {payment.receiptUrl && (
                  <div>
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Xem biên lai/chứng từ →
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle>Hóa đơn liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/invoices/${payment.invoice.id}`}
                className="hover:bg-muted/50 block space-y-3 rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {payment.invoice.invoiceNumber}/{new Date(payment.invoice.issueDate).getDate()}-
                    {new Date(payment.invoice.issueDate).getMonth() + 1}
                  </span>
                  <Badge>{payment.invoice.status}</Badge>
                </div>

                <div className="text-muted-foreground text-sm">
                  {payment.invoice.customer.companyName}
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng hóa đơn:</span>
                    <span>{formatCurrencyDecimal(payment.invoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã thanh toán:</span>
                    <span>{formatCurrencyDecimal(payment.invoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Còn lại:</span>
                    <span className="font-medium text-orange-600">
                      {formatCurrencyDecimal(
                        Number(payment.invoice.totalAmount) - Number(payment.invoice.paidAmount)
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Info */}
          {payment.isVerified && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin xác minh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Đã xác minh lúc:</span>
                  <p className="font-medium">
                    {payment.verifiedAt
                      ? new Date(payment.verifiedAt).toLocaleString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin ghi nhận</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {payment.recordedBy && (
                <div>
                  <span className="text-muted-foreground">Người ghi nhận:</span>
                  <p className="font-medium">{payment.recordedBy.name}</p>
                  <p className="text-muted-foreground text-xs">{payment.recordedBy.email}</p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Ngày tạo:</span>
                <p className="text-xs">{new Date(payment.createdAt).toLocaleString("vi-VN")}</p>
              </div>

              {payment.updatedAt !== payment.createdAt && (
                <div>
                  <span className="text-muted-foreground">Cập nhật:</span>
                  <p className="text-xs">{new Date(payment.updatedAt).toLocaleString("vi-VN")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
