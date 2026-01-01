/**
 * Payments List Page
 * View and manage all payments with filtering
 */
import Link from "next/link";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import { getPayments, getPaymentStats } from "@/actions/payments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import { PaymentMethod } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    invoiceId?: string;
    paymentMethod?: PaymentMethod;
    isVerified?: string;
  }>;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
  VNPAY: "VNPay",
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);
  const isVerified =
    params.isVerified === "true" ? true : params.isVerified === "false" ? false : undefined;

  const [paymentsResult, stats] = await Promise.all([
    getPayments({
      page,
      limit,
      invoiceId: params.invoiceId,
      paymentMethod: params.paymentMethod,
      isVerified,
    }),
    getPaymentStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán</h1>
          <p className="text-muted-foreground">
            Quản lý các khoản thanh toán ({paymentsResult.pagination.total} thanh toán)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng thanh toán"
          value={formatCurrencyDecimal(stats.totalAmount)}
          icon={DollarSign}
          count={stats.totalCount}
        />
        <StatCard
          title="Hôm nay"
          value={formatCurrencyDecimal(stats.todayAmount)}
          icon={DollarSign}
          count={stats.todayCount}
          variant="info"
        />
        <StatCard
          title="Chưa xác minh"
          value={stats.unverifiedCount.toString()}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Đã xác minh"
          value={(stats.totalCount - stats.unverifiedCount).toString()}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <select
            name="paymentMethod"
            className="rounded-md border px-3 py-2"
            defaultValue={params.paymentMethod ?? ""}
          >
            <option value="">Tất cả phương thức</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="CASH">Tiền mặt</option>
            <option value="CARD">Thẻ</option>
            <option value="MOMO">MoMo</option>
            <option value="ZALOPAY">ZaloPay</option>
            <option value="VNPAY">VNPay</option>
          </select>

          <select
            name="isVerified"
            className="rounded-md border px-3 py-2"
            defaultValue={params.isVerified ?? ""}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã xác minh</option>
            <option value="false">Chưa xác minh</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
          <CardDescription>Danh sách tất cả các khoản thanh toán đã ghi nhận</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentsResult.payments.map((payment) => (
              <Link
                key={payment.id}
                href={`/payments/${payment.id}`}
                className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{payment.invoice?.invoiceNumber ?? 'N/A'}</span>
                      <Badge variant={payment.isVerified ? "default" : "secondary"}>
                        {payment.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                      </Badge>
                      <Badge variant="outline">{paymentMethodLabels[payment.paymentMethod]}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {payment.invoice?.customer.companyName ?? 'Không xác định'}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Ngày: {new Date(payment.paymentDate).toLocaleDateString("vi-VN")}
                      </span>
                      {payment.bankRef && <span>Ref: {payment.bankRef}</span>}
                      {payment.receivedBy && <span>Người nhận: {payment.receivedBy}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrencyDecimal(payment.amount)}
                    </div>
                    {payment.recordedBy && (
                      <div className="text-sm text-muted-foreground">
                        Bởi: {payment.recordedBy.name}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {paymentsResult.payments.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Chưa có thanh toán nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {paymentsResult.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: paymentsResult.pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`?page=${pageNum}${params.paymentMethod ? `&paymentMethod=${params.paymentMethod}` : ""}${params.isVerified ? `&isVerified=${params.isVerified}` : ""}`}
                className={`px-3 py-1 rounded ${
                  pageNum === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {pageNum}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  count,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  count?: number;
  variant?: "success" | "info" | "warning" | "danger";
}) {
  const colors = {
    success: "text-green-600",
    info: "text-blue-600",
    warning: "text-orange-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant ? colors[variant] : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variant ? colors[variant] : ""}`}>{value}</div>
        {count !== undefined && (
          <p className="text-xs text-muted-foreground">{count} thanh toán</p>
        )}
      </CardContent>
    </Card>
  );
}
