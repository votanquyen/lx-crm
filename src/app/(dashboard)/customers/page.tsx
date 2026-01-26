/**
 * Customers List Page
 * Server Component with search, filters, and pagination
 * Supports table and map views via URL param
 */
import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus, Users, CheckCircle2, Target, AlertCircle } from "lucide-react";
import { getCustomers, getCustomerStats, getDistricts } from "@/actions/customers";
import {
  CustomerSearch,
  ViewToggle,
  CustomerFilters,
} from "@/components/customers";
import { CustomerSheetManager } from "@/components/customers/customer-sheet-manager";
import { CustomerMapWrapper } from "@/components/customers/customer-map-wrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@prisma/client";

// Loading skeleton for table component
function TableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// Dynamic imports for heavy table component - reduces initial bundle
const CustomerTable = dynamic(
  () => import("@/components/customers/customer-table").then((m) => m.CustomerTable),
  {
    loading: () => <TableSkeleton />,
  }
);

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: CustomerStatus;
    district?: string;
    hasDebt?: string;
    view?: "table" | "map";
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);
  const view = params.view ?? "table";

  const [customersResult, stats, districts] = await Promise.all([
    getCustomers({
      page,
      limit,
      search: params.search,
      status: params.status,
      district: params.district,
      hasDebt: params.hasDebt === "true",
    }),
    getCustomerStats(),
    getDistricts(),
  ]);

  // Build GeoJSON URL with filter params
  const geojsonParams = new URLSearchParams();
  if (params.status) geojsonParams.set("status", params.status);
  if (params.district) geojsonParams.set("district", params.district);
  const geojsonUrl = `/api/customers/geojson${geojsonParams.toString() ? `?${geojsonParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khách hàng</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Quản lý database khách hàng ({stats.total} khách hàng)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle currentView={view} />
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 font-bold"
          >
            <Link href="/customers?action=new" className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm khách hàng
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Ribbon - Clickable cards for quick filtering */}
      <div className="grid grid-cols-2 divide-y rounded-xl border bg-white shadow-sm lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        <StatItem
          title="Tổng cộng"
          value={stats.total}
          icon={Users}
          color="text-slate-600"
          bg="bg-slate-50"
        />
        <StatItem
          title="Hoạt động"
          value={stats.active}
          icon={CheckCircle2}
          color="text-emerald-600"
          bg="bg-emerald-50"
          filterStatus="ACTIVE"
        />
        <StatItem
          title="Tiềm năng"
          value={stats.leads}
          icon={Target}
          color="text-blue-600"
          bg="bg-blue-50"
          filterStatus="LEAD"
        />
        <StatItem
          title="Nợ phí"
          value={stats.withDebt}
          icon={AlertCircle}
          color="text-rose-600"
          bg="bg-rose-50"
          filterDebt
        />
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search & filters */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="inline-block w-full max-w-md rounded-lg border bg-white p-1 shadow-sm">
            <CustomerSearch defaultValue={params.search} />
          </div>
          <CustomerFilters districts={districts} />
        </div>

        {/* Content: Table or Map based on view param */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Hiển thị{" "}
            <span className="font-semibold text-slate-900">{customersResult.data.length}</span> của{" "}
            <span className="font-semibold text-slate-900">{customersResult.pagination.total}</span>{" "}
            khách hàng
          </p>
        </div>

        {view === "table" ? (
          <div className="enterprise-card overflow-hidden rounded-xl border bg-white shadow-sm">
            <Suspense fallback={<TableSkeleton />}>
              <CustomerTable
                customers={
                  customersResult.data as Array<{
                    id: string;
                    code: string;
                    companyName: string;
                    address: string;
                    district: string | null;
                    contactName: string | null;
                    contactPhone: string | null;
                    contactEmail: string | null;
                    contact2Name?: string | null;
                    contact2Phone?: string | null;
                    contact2Email?: string | null;
                    accountingName?: string | null;
                    accountingPhone?: string | null;
                    accountingEmail?: string | null;
                    status: CustomerStatus;
                    financials?: { totalDebt: number; monthlyContractValue: number };
                    _count?: {
                      customerPlants: number;
                      stickyNotes: number;
                      contracts: number;
                    };
                  }>
                }
                pagination={customersResult.pagination}
              />
            </Suspense>
          </div>
        ) : (
          <div className="enterprise-card overflow-hidden rounded-xl border bg-white shadow-sm">
            <CustomerMapWrapper geojsonUrl={geojsonUrl} />
          </div>
        )}
      </div>

      <CustomerSheetManager />
    </div>
  );
}

// Stat Item for Ribbon - Clickable for quick filtering
function StatItem({
  title,
  value,
  icon: Icon,
  color,
  bg,
  filterStatus,
  filterDebt,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  filterStatus?: CustomerStatus;
  filterDebt?: boolean;
}) {
  // Build filter URL
  const href = filterStatus
    ? `/customers?status=${filterStatus}`
    : filterDebt
      ? `/customers?hasDebt=true`
      : "/customers";

  const isClickable = filterStatus || filterDebt;

  const content = (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 transition-colors",
        isClickable && "cursor-pointer hover:bg-slate-50/80"
      )}
    >
      <div
        className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bg, color)}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-semibold tracking-tight uppercase">
          {title}
        </p>
        <p className="text-2xl leading-tight font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return isClickable ? (
    <Link href={href} aria-label={`Lọc theo ${title.toLowerCase()}`}>
      {content}
    </Link>
  ) : (
    content
  );
}
