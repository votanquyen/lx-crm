import Link from "next/link";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Plus,
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  RefreshCw,
} from "lucide-react";
import { getQuotations, getQuotationStats } from "@/actions/quotations";
import { Button } from "@/components/ui/button";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import { QuotationStatus } from "@prisma/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: QuotationStatus;
    customerId?: string;
  }>;
}

export default async function QuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);
  const status = params.status;

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
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Báo giá</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Thiết lập báo giá và theo dõi tỷ lệ chuyển đổi khách hàng
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-white">
          <Link href="/quotations/new" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo báo giá
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enterprise-card bg-white p-5">
          <p className="kpi-title mb-2 text-slate-500">Tổng báo giá</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-value text-slate-900">{stats.total}</p>
              <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                {stats.draft} bản nháp
              </p>
            </div>
            <div className="rounded bg-slate-50 p-2 text-slate-400">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="enterprise-card border-amber-100 bg-white p-5">
          <p className="kpi-title mb-2 text-amber-600">Đang chờ</p>
          <div className="flex items-center justify-between">
            <p className="kpi-value text-amber-600">{stats.pending}</p>
            <div className="rounded bg-amber-50 p-2 text-amber-500">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="enterprise-card border-emerald-100 bg-white p-5">
          <p className="kpi-title mb-2 text-emerald-600">Đã duyệt</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-value text-emerald-600">{stats.accepted}</p>
              <p className="text-[10px] font-bold tracking-tight text-emerald-400 uppercase">
                {stats.converted} đã chuyển đổi
              </p>
            </div>
            <div className="rounded bg-emerald-50 p-2 text-emerald-500">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="enterprise-card border-blue-100 bg-white p-5">
          <p className="kpi-title mb-2 text-blue-600">Tỷ lệ chuyển đổi</p>
          <div className="flex items-center justify-between">
            <p className="kpi-value text-blue-600">{stats.conversionRate}%</p>
            <div className="rounded bg-blue-50 p-2 text-blue-500">
              <Send className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Navigation */}
      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-slate-50/50 p-1">
        <Link
          href="/quotations"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            !status
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="mx-1 h-3 w-px bg-slate-200" />
        <Link
          href="/quotations?status=SENT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "SENT"
              ? "border border-amber-100 bg-white text-amber-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đang chờ
        </Link>
        <Link
          href="/quotations?status=ACCEPTED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "ACCEPTED"
              ? "border border-emerald-100 bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Chấp thuận
        </Link>
        <Link
          href="/quotations?status=REJECTED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "REJECTED"
              ? "border border-rose-100 bg-white text-rose-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Từ chối
        </Link>
        <Link
          href="/quotations?status=DRAFT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "DRAFT"
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Bản nháp
        </Link>
      </div>

      {/* Quotations List Table */}
      <div className="enterprise-card overflow-hidden bg-white">
        {/* Table Header */}
        <div className="sticky top-0 z-10 border-b bg-slate-50/80 backdrop-blur-sm">
          <div className="flex h-10 items-center">
            <div className="text-muted-foreground flex-1 px-4 text-[10px] font-bold tracking-widest uppercase">
              Mã số / Khách hàng
            </div>
            <div className="text-muted-foreground w-40 shrink-0 px-4 text-[10px] font-bold tracking-widest uppercase">
              Trạng thái
            </div>
            <div className="text-muted-foreground w-40 shrink-0 px-4 text-center text-[10px] font-bold tracking-widest uppercase">
              Hiệu lực
            </div>
            <div className="text-muted-foreground w-40 shrink-0 px-4 text-right text-[10px] font-bold tracking-widest uppercase">
              Tổng cộng
            </div>
            <div className="w-12 shrink-0 px-4"></div>
          </div>
        </div>

        <div className="divide-border/50 divide-y">
          {quotationsResult.quotations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900">Chưa có báo giá nào</h3>
              <p className="mt-1 text-sm text-slate-400">
                Tạo báo giá đầu tiên để bắt đầu quy trình bán hàng.
              </p>
            </div>
          ) : (
            quotationsResult.quotations.map((quotation) => {
              const isExpiringSoon =
                quotation.status === "SENT" &&
                new Date(quotation.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <div key={quotation.id} className="data-table-row group flex items-center py-2.5">
                  {/* ID & Customer */}
                  <div className="min-w-0 flex-1 px-4">
                    <div className="mb-0.5 flex items-center gap-2">
                      <Link
                        href={`/quotations/${quotation.id}`}
                        className="hover:text-primary truncate text-xs font-bold text-slate-900 transition-colors"
                      >
                        {quotation.quoteNumber}
                      </Link>
                      {isExpiringSoon && (
                        <span className="flex items-center gap-1 rounded border border-rose-100 bg-rose-50 px-1.5 py-0.5 text-[9px] font-black text-rose-600">
                          <Clock className="h-2.5 w-2.5" aria-hidden="true" /> SẮP HẾT HẠN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-2.5 w-2.5 text-slate-400" aria-hidden="true" />
                      <span className="text-muted-foreground truncate text-[10px] font-bold">
                        {quotation.customer.companyName}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-40 shrink-0 px-4">
                    <div
                      className={cn(
                        "status-badge origin-left scale-90",
                        quotation.status === "ACCEPTED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : quotation.status === "SENT"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : quotation.status === "DRAFT"
                              ? "border-slate-200 bg-slate-50 text-slate-600"
                              : quotation.status === "REJECTED"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                      )}
                    >
                      {quotation.status === "ACCEPTED"
                        ? "Chấp thuận"
                        : quotation.status === "SENT"
                          ? "Đã gửi"
                          : quotation.status === "DRAFT"
                            ? "Bản nháp"
                            : quotation.status === "REJECTED"
                              ? "Từ chối"
                              : quotation.status === "CONVERTED"
                                ? "Đã duyệt"
                                : "Hết hạn"}
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="w-40 shrink-0 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Calendar className="h-3 w-3 text-slate-400" aria-hidden="true" />
                        {format(new Date(quotation.validUntil), "dd/MM/yyyy")}
                      </div>
                      <span className="mt-0.5 text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                        Hạn hiệu lực
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="w-40 shrink-0 px-4 text-right">
                    <p className="text-sm font-black text-slate-900">
                      {formatCurrencyDecimal(quotation.totalAmount)}
                    </p>
                    <p className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                      {quotation.items.length} hạng mục
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex w-12 shrink-0 justify-end px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="group-hover:text-primary h-8 w-8 text-slate-300 transition-colors"
                          aria-label="Tùy chọn"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          asChild
                          className="py-2.5 font-sans text-xs font-bold tracking-tight uppercase"
                        >
                          <Link href={`/quotations/${quotation.id}`}>
                            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-2.5 font-sans text-xs font-bold tracking-tight text-blue-600 uppercase">
                          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                          Gửi khách hàng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-primary py-2.5 font-sans text-xs font-bold tracking-tight uppercase">
                          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                          Chuyển thành hợp đồng
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {quotationsResult.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50/30 p-4">
            <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Trang {quotationsResult.pagination.page} / {quotationsResult.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={quotationsResult.pagination.page === 1}
                className="h-8 px-3 text-xs font-bold"
              >
                <Link
                  href={`/quotations?page=${quotationsResult.pagination.page - 1}${status ? `&status=${status}` : ""}`}
                >
                  Trước
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={
                  quotationsResult.pagination.page === quotationsResult.pagination.totalPages
                }
                className="h-8 px-3 text-xs font-bold"
              >
                <Link
                  href={`/quotations?page=${quotationsResult.pagination.page + 1}${status ? `&status=${status}` : ""}`}
                >
                  Sau
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
