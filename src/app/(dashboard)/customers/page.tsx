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
import type { CustomerStatus, CustomerTier } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: CustomerStatus;
    tier?: CustomerTier;
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
      tier: params.tier,
      district: params.district,
      hasDebt: params.hasDebt === "true",
    }),
    getDistricts(),
    getCustomerStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách khách hàng ({stats.total} khách hàng)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button asChild>
            <Link href="/customers/new" className="gap-1">
              <Plus className="h-4 w-4" />
              Thêm khách hàng
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Tổng cộng" value={stats.total} />
        <StatCard title="Hoạt động" value={stats.active} variant="success" />
        <StatCard title="Tiềm năng" value={stats.leads} variant="info" />
        <StatCard title="VIP" value={stats.vip} variant="warning" />
        <StatCard title="Còn nợ" value={stats.withDebt} variant="danger" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CustomerSearch defaultValue={params.search} />
        <Suspense fallback={<Skeleton className="h-9 w-[400px]" />}>
          <CustomerFilters districts={districts} />
        </Suspense>
      </div>

      {/* Table */}
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
            tier: CustomerTier;
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
  );
}

function StatCard({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: number;
  variant?: "default" | "success" | "info" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "bg-card",
    success: "bg-green-50 dark:bg-green-950",
    info: "bg-blue-50 dark:bg-blue-950",
    warning: "bg-amber-50 dark:bg-amber-950",
    danger: "bg-red-50 dark:bg-red-950",
  };

  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
