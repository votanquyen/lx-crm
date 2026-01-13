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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Báo giá</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Thiết lập báo giá và theo dõi tỷ lệ chuyển đổi khách hàng
          </p>
        </div>
        <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-4">
          <Link href="/quotations/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo báo giá
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enterprise-card p-5 bg-white">
          <p className="kpi-title mb-2 text-slate-500">Tổng báo giá</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-value text-slate-900">{stats.total}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{stats.draft} bản nháp</p>
            </div>
            <div className="p-2 rounded bg-slate-50 text-slate-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="enterprise-card p-5 bg-white border-amber-100">
          <p className="kpi-title mb-2 text-amber-600">Đang chờ</p>
          <div className="flex items-center justify-between">
            <p className="kpi-value text-amber-600">{stats.pending}</p>
            <div className="p-2 rounded bg-amber-50 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="enterprise-card p-5 bg-white border-emerald-100">
          <p className="kpi-title mb-2 text-emerald-600">Đã duyệt</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-value text-emerald-600">{stats.accepted}</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">{stats.converted} đã chuyển đổi</p>
            </div>
            <div className="p-2 rounded bg-emerald-50 text-emerald-500">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="enterprise-card p-5 bg-white border-blue-100">
          <p className="kpi-title mb-2 text-blue-600">Tỷ lệ chuyển đổi</p>
          <div className="flex items-center justify-between">
            <p className="kpi-value text-blue-600">{stats.conversionRate}%</p>
            <div className="p-2 rounded bg-blue-50 text-blue-500">
              <Send className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Navigation */}
      <div className="flex items-center gap-1 p-1 border rounded-lg bg-slate-50/50 w-fit max-w-full overflow-x-auto scrollbar-hide">
        <Link
          href="/quotations"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            !status
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Tất cả
        </Link>
        <div className="w-px h-3 bg-slate-200 mx-1" />
        <Link
          href="/quotations?status=SENT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "SENT"
              ? "bg-white text-amber-600 shadow-sm border border-amber-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đang chờ
        </Link>
        <Link
          href="/quotations?status=ACCEPTED"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "ACCEPTED"
              ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Chấp thuận
        </Link>
        <Link
          href="/quotations?status=REJECTED"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "REJECTED"
              ? "bg-white text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Từ chối
        </Link>
        <Link
          href="/quotations?status=DRAFT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "DRAFT"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Bản nháp
        </Link>
      </div>

      {/* Quotations List Table */}
      <div className="enterprise-card overflow-hidden bg-white">
        {/* Table Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b">
          <div className="flex items-center h-10">
            <div className="flex-1 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mã số / Khách hàng</div>
            <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Trạng thái</div>
            <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-center">Hiệu lực</div>
            <div className="w-40 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">Tổng cộng</div>
            <div className="w-12 px-4 shrink-0"></div>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {quotationsResult.quotations.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-200 mb-4" />
              <h3 className="text-base font-bold text-slate-900">Chưa có báo giá nào</h3>
              <p className="text-sm text-slate-400 mt-1">Tạo báo giá đầu tiên để bắt đầu quy trình bán hàng.</p>
            </div>
          ) : (
            quotationsResult.quotations.map((quotation) => {
              const isExpiringSoon = quotation.status === "SENT" && new Date(quotation.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <div key={quotation.id} className="flex items-center data-table-row group py-2.5">
                  {/* ID & Customer */}
                  <div className="flex-1 px-4 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/quotations/${quotation.id}`}
                        className="text-xs font-bold text-slate-900 hover:text-primary transition-colors truncate"
                      >
                        {quotation.quoteNumber}
                      </Link>
                      {isExpiringSoon && (
                        <span className="bg-rose-50 text-[9px] font-black text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> SẮP HẾT HẠN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-2.5 w-2.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-muted-foreground truncate">{quotation.customer.companyName}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-40 px-4 shrink-0">
                    <div className={cn(
                      "status-badge scale-90 origin-left",
                      quotation.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        quotation.status === "SENT" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          quotation.status === "DRAFT" ? "bg-slate-50 text-slate-600 border-slate-200" :
                            quotation.status === "REJECTED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {quotation.status === "ACCEPTED" ? "Chấp thuận" :
                        quotation.status === "SENT" ? "Đã gửi" :
                          quotation.status === "DRAFT" ? "Bản nháp" :
                            quotation.status === "REJECTED" ? "Từ chối" :
                              quotation.status === "CONVERTED" ? "Đã chốt" : "Hết hạn"}
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="w-40 px-4 shrink-0 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {format(new Date(quotation.validUntil), "dd/MM/yyyy")}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Hạn hiệu lực</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="w-40 px-4 shrink-0 text-right">
                    <p className="text-sm font-black text-slate-900">{formatCurrencyDecimal(quotation.totalAmount)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{quotation.items.length} hạng mục</p>
                  </div>

                  {/* Actions */}
                  <div className="w-12 px-4 shrink-0 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild className="text-xs font-bold font-sans uppercase tracking-tight py-2.5">
                          <Link href={`/quotations/${quotation.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-blue-600">
                          <Send className="mr-2 h-4 w-4" />
                          Gửi khách hàng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs font-bold font-sans uppercase tracking-tight py-2.5 text-primary">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Chuyển thành hợp đồng
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {quotationsResult.pagination.totalPages > 1 && (
          <div className="p-4 border-t bg-slate-50/30 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Trang {quotationsResult.pagination.page} / {quotationsResult.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild disabled={quotationsResult.pagination.page === 1} className="h-8 font-bold text-xs px-3">
                <Link href={`/quotations?page=${quotationsResult.pagination.page - 1}${status ? `&status=${status}` : ""}`}>
                  Trước
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild disabled={quotationsResult.pagination.page === quotationsResult.pagination.totalPages} className="h-8 font-bold text-xs px-3">
                <Link href={`/quotations?page=${quotationsResult.pagination.page + 1}${status ? `&status=${status}` : ""}`}>
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
