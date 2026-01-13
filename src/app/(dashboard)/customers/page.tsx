/**
 * Customers List Page
 * Server Component with search, filters, and pagination
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Download, Upload } from "lucide-react";
import { getCustomers, getDistricts, getCustomerStats } from "@/actions/customers";
import { CustomerSearch, CustomerFilters, CustomerTable } from "@/components/customers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: CustomerStatus;
    district?: string;
    hasDebt?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);

  const [customersResult, districts, stats] = await Promise.all([
    getCustomers({
      page,
      limit,
      search: params.search,
      status: params.status,
      district: params.district,
      hasDebt: params.hasDebt === "true",
    }),
    getDistricts(),
    getCustomerStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khách hàng</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Quản lý database khách hàng ({stats.total} đối tác)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md p-1 bg-white">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-bold uppercase tracking-tight">
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-bold uppercase tracking-tight">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
          <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4">
            <Link href="/customers/new" className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm khách hàng
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng cộng" value={stats.total} color="text-slate-600" />
        <StatCard title="Đang hoạt động" value={stats.active} color="text-emerald-600" />
        <StatCard title="Khách tiềm năng" value={stats.leads} color="text-blue-600" />
        <StatCard title="Đang nợ phí" value={stats.withDebt} color="text-rose-600" />
      </div>

      {/* Search and Filters Shell */}
      <div className="enterprise-card p-4 bg-white/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CustomerSearch defaultValue={params.search} />
          <Suspense fallback={<Skeleton className="h-9 w-[400px]" />}>
            <CustomerFilters districts={districts} />
          </Suspense>
        </div>
      </div>

      {/* Table Section */}
      <div className="enterprise-card overflow-hidden bg-white">
        <Suspense fallback={<TableSkeleton />}>
          <CustomerTable
            customers={customersResult.data as Array<{
              id: string;
              code: string;
              companyName: string;
              address: string;
              district: string | null;
              contactName: string | null;
              contactPhone: string | null;
              contactEmail: string | null;
              status: CustomerStatus;
              financials?: { totalDebt: number; monthlyContractValue: number };
              _count?: {
                customerPlants: number;
                stickyNotes: number;
                contracts: number;
              };
            }>}
            pagination={customersResult.pagination}
          />
        </Suspense>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="enterprise-card p-5 bg-white">
      <p className="kpi-title mb-2">{title}</p>
      <div className="flex items-end gap-2">
        <p className={cn("kpi-value", color)}>{value}</p>
        <p className="text-xs font-bold text-muted-foreground uppercase pb-1">Đơn vị</p>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
