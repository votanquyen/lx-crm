/**
 * Contracts List Page
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractTable } from "@/components/contracts/contract-table";
import { Pagination } from "@/components/ui/pagination";
import { getContracts, getContractStats } from "@/actions/contracts";
import type { ContractStatus } from "@prisma/client";

interface ContractsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: ContractStatus;
    search?: string;
  }>;
}

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng hợp đồng</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Trong 30 ngày</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Doanh thu định kỳ</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(Number(stats.monthlyRecurring))}
          </div>
          <p className="text-xs text-muted-foreground">Hàng tháng</p>
        </CardContent>
      </Card>
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
    <div className="space-y-4">
      <ContractTable contracts={result.data as any} />

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

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const search = params.search;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hợp đồng</h1>
          <p className="text-muted-foreground">
            Quản lý hợp đồng thuê cây với khách hàng
          </p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hợp đồng
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
        <ContractStats />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-4">
        <Link
          href="/contracts"
          className={`px-3 py-1.5 rounded-full text-sm ${
            !status ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Tất cả
        </Link>
        <Link
          href="/contracts?status=ACTIVE"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "ACTIVE" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đang hoạt động
        </Link>
        <Link
          href="/contracts?status=DRAFT"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "DRAFT" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Nháp
        </Link>
        <Link
          href="/contracts?status=EXPIRED"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "EXPIRED" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Hết hạn
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
        <ContractList page={page} status={status} search={search} />
      </Suspense>
    </div>
  );
}
