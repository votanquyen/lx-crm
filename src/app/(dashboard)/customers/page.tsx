/**
 * Customers List Page
 * Server Component with search, filters, and pagination
 * Supports table and map views via URL param
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Download, Upload, Users, CheckCircle2, Target, AlertCircle } from "lucide-react";
import { getCustomers, getCustomerStats } from "@/actions/customers";
import { CustomerSearch, CustomerTable, CustomerMapMapcn, ViewToggle } from "@/components/customers";
import { CustomerSheetManager } from "@/components/customers/customer-sheet-manager";
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
    view?: "table" | "map";
  }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);
  const view = params.view ?? "table";

  const [customersResult, stats] = await Promise.all([
    getCustomers({
      page,
      limit,
      search: params.search,
      status: params.status,
      // district: params.district,
      // hasDebt: params.hasDebt === "true",
    }),
    // getDistricts(),
    getCustomerStats(),
  ]);

  // Build GeoJSON URL with filter params
  const geojsonParams = new URLSearchParams();
  if (params.status) geojsonParams.set("status", params.status);
  if (params.district) geojsonParams.set("district", params.district);
  const geojsonUrl = `/api/customers/geojson${geojsonParams.toString() ? `?${geojsonParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Khách hàng</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Quản lý database khách hàng ({stats.total} khách hàng)
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
          <ViewToggle currentView={view} />
          <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4">
            <Link href="/customers?action=new" className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm khách hàng
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="bg-white rounded-xl border shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x">
        <StatItem title="Tổng cộng" value={stats.total} icon={Users} color="text-slate-600" bg="bg-slate-50" />
        <StatItem title="Hoạt động" value={stats.active} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatItem title="Tiềm năng" value={stats.leads} icon={Target} color="text-blue-600" bg="bg-blue-50" />
        <StatItem title="Nợ phí" value={stats.withDebt} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Search & filters */}
        <div className="bg-white p-1 rounded-lg border shadow-sm inline-block w-full max-w-md">
          <CustomerSearch defaultValue={params.search} />
        </div>

        {/* Content: Table or Map based on view param */}
        {view === "table" ? (
          <div className="enterprise-card overflow-hidden bg-white border rounded-xl shadow-sm">
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
        ) : (
          <div className="enterprise-card overflow-hidden bg-white border rounded-xl shadow-sm">
            <Suspense fallback={<MapSkeleton />}>
              <CustomerMapMapcn geojsonUrl={geojsonUrl} />
            </Suspense>
          </div>
        )}
      </div>

      <CustomerSheetManager />
    </div>
  );
}

// Stat Item for Ribbon
function StatItem({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-4 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg, color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{title}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
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

function MapSkeleton() {
  return (
    <div className="h-[600px] w-full flex items-center justify-center bg-muted/10">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-32 mx-auto" />
        <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
      </div>
    </div>
  );
}
