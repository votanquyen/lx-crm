import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractTable } from "@/components/contracts/contract-table";
import { Pagination } from "@/components/ui/pagination";
import { getContracts, getContractStats } from "@/actions/contracts";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@prisma/client";

async function ContractStats() {
  const stats = await getContractStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="enterprise-card p-5 bg-white">
        <p className="kpi-title mb-2 text-slate-500">Tổng hợp đồng</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="p-2 rounded bg-slate-50 text-slate-400">
            <FileText className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-emerald-100">
        <p className="kpi-title mb-2 text-emerald-600">Đang hoạt động</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-emerald-600">{stats.active}</p>
          <div className="p-2 rounded bg-emerald-50 text-emerald-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-amber-100">
        <p className="kpi-title mb-2 text-amber-600">Sắp hết hạn</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-amber-600">{stats.expiringSoon}</p>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-tight">Trong 30 ngày</p>
          </div>
          <div className="p-2 rounded bg-amber-50 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="enterprise-card p-5 bg-white border-blue-100">
        <p className="kpi-title mb-2 text-blue-600">Doanh thu (MRR)</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-blue-600">
              {formatCurrency(Number(stats.monthlyRecurring))}
            </p>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Thu hàng tháng</p>
          </div>
          <div className="p-2 rounded bg-blue-50 text-blue-500">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ContractList({
  page,
  status,
  search,
}: {
  page: number;
  status?: ContractStatus;
  search?: string;
}) {
  const result = await getContracts({ page, limit: 20, status, search });

  return (
    <div className="enterprise-card overflow-hidden bg-white">
      <ContractTable contracts={result.data} />

      {result.pagination.totalPages > 1 && (
        <div className="p-4 border-t bg-slate-50/30">
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

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: ContractStatus; search?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const search = params.search;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hợp đồng</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Quản lý hợp đồng cung cấp và bảo dưỡng cây xanh
          </p>
        </div>
        <Button asChild className="h-10 bg-primary hover:bg-primary/90 text-white font-bold px-4">
          <Link href="/contracts/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo hợp đồng
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card p-5 bg-white">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        }
      >
        <ContractStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="flex items-center gap-1 p-1 border rounded-lg bg-slate-50/50 w-fit max-w-full overflow-x-auto scrollbar-hide">
        <Link
          href="/contracts"
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
          href="/contracts?status=ACTIVE"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "ACTIVE"
              ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đang hoạt động
        </Link>
        <Link
          href="/contracts?status=DRAFT"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "DRAFT"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Nháp
        </Link>
        <Link
          href="/contracts?status=EXPIRED"
          className={cn(
            "px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
            status === "EXPIRED"
              ? "bg-white text-rose-600 shadow-sm border border-rose-100"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Hết hạn
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card bg-white p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        }
      >
        <ContractList page={page} status={status} search={search} />
      </Suspense>
    </div>
  );
}
