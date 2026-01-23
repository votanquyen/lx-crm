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
      <div className="enterprise-card bg-white p-5">
        <p className="kpi-title mb-2 text-slate-500">Tổng hợp đồng</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-slate-900">{stats.total}</p>
          <div className="rounded bg-slate-50 p-2 text-slate-400">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-emerald-100 bg-white p-5">
        <p className="kpi-title mb-2 text-emerald-600">Đang hoạt động</p>
        <div className="flex items-center justify-between">
          <p className="kpi-value text-emerald-600">{stats.active}</p>
          <div className="rounded bg-emerald-50 p-2 text-emerald-500">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-amber-100 bg-white p-5">
        <p className="kpi-title mb-2 text-amber-600">Sắp hết hạn</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-amber-600">{stats.expiringSoon}</p>
            <p className="text-[10px] font-bold tracking-tight text-amber-400 uppercase">
              Trong 30 ngày
            </p>
          </div>
          <div className="rounded bg-amber-50 p-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="enterprise-card border-blue-100 bg-white p-5">
        <p className="kpi-title mb-2 text-blue-600">Doanh thu (MRR)</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="kpi-value text-blue-600">
              {formatCurrency(Number(stats.monthlyRecurring))}
            </p>
            <p className="text-[10px] font-bold tracking-tight text-blue-400 uppercase">
              Thu hàng tháng
            </p>
          </div>
          <div className="rounded bg-blue-50 p-2 text-blue-500">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
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

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: ContractStatus; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const search = params.search;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hợp đồng</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Quản lý hợp đồng cung cấp và bảo dưỡng cây xanh
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-white">
          <Link href="/contracts/new" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tạo hợp đồng
          </Link>
        </Button>
      </div>

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
        <ContractStats />
      </Suspense>

      {/* Filters Navigation */}
      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border bg-slate-50/50 p-1">
        <Link
          href="/contracts"
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
          href="/contracts?status=ACTIVE"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "ACTIVE"
              ? "border border-emerald-100 bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Đang hoạt động
        </Link>
        <Link
          href="/contracts?status=DRAFT"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "DRAFT"
              ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Nháp
        </Link>
        <Link
          href="/contracts?status=EXPIRED"
          className={cn(
            "rounded-md px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase transition-all",
            status === "EXPIRED"
              ? "border border-rose-100 bg-white text-rose-600 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          Hết hạn
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="enterprise-card space-y-4 bg-white p-4">
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
