import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { getInvoices } from "@/actions/invoices";
import { InvoiceStatsEnhanced } from "@/components/invoices/invoice-stats-enhanced";
import { FilterTabs } from "@/components/invoices/filter-tabs";
import { InvoiceSearch } from "@/components/invoices/invoice-search";
import type { InvoiceStatus } from "@prisma/client";

// Dynamic import for heavy table component
const InvoiceTable = dynamic(
  () => import("@/components/invoices/invoice-table-enhanced").then((m) => m.InvoiceTable),
  {
    loading: () => (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    ),
  }
);

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: InvoiceStatus;
    search?: string;
    overdueOnly?: string;
  }>;
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
    <div className="enterprise-card overflow-hidden bg-white">
      <InvoiceTable invoices={result.data} />

      {result.pagination.totalPages > 1 && (
        <div className="border-t bg-slate-50/30 p-4">
          <Pagination
            page={result.pagination.page}
            limit={result.pagination.limit}
            total={result.pagination.total}
            totalPages={result.pagination.totalPages}
          />
        </div>
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

  const filterTabs = [
    { label: "Tất cả", href: "/invoices" },
    { label: "Đã gửi", value: "SENT" as const, href: "/invoices?status=SENT" },
    { label: "TT một phần", value: "PARTIAL" as const, href: "/invoices?status=PARTIAL" },
    { label: "Quá hạn", value: "OVERDUE" as const, href: "/invoices?overdueOnly=true" },
    { label: "Đã TT", value: "PAID" as const, href: "/invoices?status=PAID" },
    { label: "Nháp", value: "DRAFT" as const, href: "/invoices?status=DRAFT" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Hóa đơn VAT</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Quản lý và theo dõi hóa đơn GTGT từ hệ thống SmartVAS
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-white font-bold">
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hóa đơn
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card bg-white p-5">
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        }
      >
        <InvoiceStatsEnhanced />
      </Suspense>

      {/* Filters Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <FilterTabs
          tabs={filterTabs}
          activeTab={status || (overdueOnly ? "OVERDUE" : undefined)}
          hasActiveFilters={!!status || !!search || overdueOnly}
        />
        <InvoiceSearch />
      </div>

      {/* Invoice List */}
      <Suspense
        fallback={
          <div className="enterprise-card space-y-4 bg-white p-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        }
      >
        <InvoiceList page={page} status={status} search={search} overdueOnly={overdueOnly} />
      </Suspense>
    </div>
  );
}
