/**
 * Quotations List Page
 * View and manage all quotations with filtering and statistics
 */
import Link from "next/link";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Plus,
} from "lucide-react";
import { getQuotations, getQuotationStats } from "@/actions/quotations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import { QuotationStatus } from "@prisma/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: QuotationStatus;
    customerId?: string;
  }>;
}

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CONVERTED: "Đã chuyển đổi",
};

const statusColors: Record<
  QuotationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
  CONVERTED: "default",
};

export default async function QuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);

  const [quotationsResult, stats] = await Promise.all([
    getQuotations({
      page,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      search: params.search,
      status: params.status,
      customerId: params.customerId,
    }),
    getQuotationStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Báo giá</h1>
          <p className="text-muted-foreground">
            Quản lý báo giá cho khách hàng (
            {quotationsResult.pagination.total} báo giá)
          </p>
        </div>
        <Button asChild>
          <Link href="/quotations/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo báo giá
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng báo giá"
          value={stats.total.toString()}
          icon={FileText}
          description={`${stats.draft} nháp`}
        />
        <StatCard
          title="Đang chờ"
          value={stats.pending.toString()}
          icon={Clock}
          description="Đã gửi, chưa phản hồi"
          variant="warning"
        />
        <StatCard
          title="Đã chấp nhận"
          value={stats.accepted.toString()}
          icon={CheckCircle}
          description={`${stats.converted} đã chuyển đổi`}
          variant="success"
        />
        <StatCard
          title="Tỷ lệ chuyển đổi"
          value={`${stats.conversionRate}%`}
          icon={Send}
          description="Từ chấp nhận → hợp đồng"
          variant="info"
        />
      </div>

      {/* Quotations List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách báo giá</CardTitle>
          <CardDescription>
            Xem và quản lý tất cả các báo giá của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotationsResult.quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Chưa có báo giá nào
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Tạo báo giá đầu tiên để bắt đầu
              </p>
              <Button asChild>
                <Link href="/quotations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo báo giá
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quotationsResult.quotations.map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}

              {/* Pagination */}
              {quotationsResult.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {quotationsResult.pagination.page} /{" "}
                    {quotationsResult.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={quotationsResult.pagination.page === 1}
                    >
                      <Link
                        href={`/quotations?page=${quotationsResult.pagination.page - 1}`}
                      >
                        Trước
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={
                        quotationsResult.pagination.page ===
                        quotationsResult.pagination.totalPages
                      }
                    >
                      <Link
                        href={`/quotations?page=${quotationsResult.pagination.page + 1}`}
                      >
                        Sau
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// COMPONENTS
// ============================================================

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "success" | "warning" | "info";
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: StatCardProps) {
  const colors = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface QuotationCardProps {
  quotation: Awaited<ReturnType<typeof getQuotations>>["quotations"][0];
}

function QuotationCard({ quotation }: QuotationCardProps) {
  const isExpiringSoon =
    quotation.status === "SENT" &&
    new Date(quotation.validUntil) <
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Link
      href={`/quotations/${quotation.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side - Main info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{quotation.quoteNumber}</h3>
            <Badge variant={statusColors[quotation.status]}>
              {statusLabels[quotation.status]}
            </Badge>
            {isExpiringSoon && (
              <Badge variant="destructive">Sắp hết hạn</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {quotation.customer.companyName}
          </p>
          {quotation.title && (
            <p className="text-sm font-medium">{quotation.title}</p>
          )}
        </div>

        {/* Right side - Amount and dates */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-lg font-bold">
            {formatCurrencyDecimal(quotation.totalAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Hiệu lực:{" "}
            {format(new Date(quotation.validUntil), "dd/MM/yyyy", {
              locale: vi,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {quotation.items.length} sản phẩm
          </p>
        </div>
      </div>
    </Link>
  );
}
