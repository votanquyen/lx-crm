/**
 * Invoices List Page
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Receipt, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Pagination } from "@/components/ui/pagination";
import { getInvoices, getInvoiceStats } from "@/actions/invoices";
import type { InvoiceStatus } from "@prisma/client";

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: InvoiceStatus;
    search?: string;
    overdueOnly?: string;
  }>;
}

async function InvoiceStats() {
  const stats = await getInvoiceStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng hóa đơn</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(Number(stats.overdueAmount))}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng phải thu</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(Number(stats.totalReceivables))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function InvoiceList({
  page,
  status,
  search,
  overdueOnly,
}: {
  page: number;
  status?: InvoiceStatus;
  search?: string;
  overdueOnly?: boolean;
}) {
  const result = await getInvoices({ page, limit: 20, status, search, overdueOnly });

  return (
    <div className="space-y-4">
      <InvoiceTable invoices={result.data} />

      {result.pagination.totalPages > 1 && (
        <Pagination
          page={result.pagination.page}
          limit={result.pagination.limit}
          total={result.pagination.total}
          totalPages={result.pagination.totalPages}
        />
      )}
    </div>
  );
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const search = params.search;
  const overdueOnly = params.overdueOnly === "true";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hóa đơn</h1>
          <p className="text-muted-foreground">
            Quản lý hóa đơn và thanh toán
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hóa đơn
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <InvoiceStats />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/invoices"
          className={`px-3 py-1.5 rounded-full text-sm ${
            !status && !overdueOnly ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Tất cả
        </Link>
        <Link
          href="/invoices?status=SENT"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "SENT" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đã gửi
        </Link>
        <Link
          href="/invoices?status=PARTIAL"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "PARTIAL" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Thanh toán một phần
        </Link>
        <Link
          href="/invoices?overdueOnly=true"
          className={`px-3 py-1.5 rounded-full text-sm ${
            overdueOnly ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Quá hạn
        </Link>
        <Link
          href="/invoices?status=PAID"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "PAID" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đã thanh toán
        </Link>
        <Link
          href="/invoices?status=DRAFT"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "DRAFT" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Nháp
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
      >
        <InvoiceList page={page} status={status} search={search} overdueOnly={overdueOnly} />
      </Suspense>
    </div>
  );
}
