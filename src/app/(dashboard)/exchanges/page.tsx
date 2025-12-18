/**
 * Exchange Requests Page
 */
import { Suspense } from "react";
import Link from "next/link";
import { Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExchangeTable } from "@/components/exchanges/exchange-table";
import { Pagination } from "@/components/ui/pagination";
import { getExchangeRequests, getExchangeStats } from "@/actions/exchange-requests";
import type { ExchangeStatus, ExchangePriority } from "@prisma/client";

interface ExchangesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: ExchangeStatus;
    priority?: ExchangePriority;
  }>;
}

async function ExchangeStats() {
  const stats = await getExchangeStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.scheduled}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gấp/Khẩn cấp</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ExchangeList({
  page,
  status,
  priority,
}: {
  page: number;
  status?: ExchangeStatus;
  priority?: ExchangePriority;
}) {
  const result = await getExchangeRequests({ page, limit: 20, status, priority });

  return (
    <div className="space-y-4">
      <ExchangeTable requests={result.data} />

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

export default async function ExchangesPage({ searchParams }: ExchangesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const status = params.status;
  const priority = params.priority;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yêu cầu đổi cây</h1>
          <p className="text-muted-foreground">
            Quản lý yêu cầu đổi/thay thế cây từ khách hàng
          </p>
        </div>
        <Button asChild>
          <Link href="/exchanges/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo yêu cầu
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
        <ExchangeStats />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Link
          href="/exchanges"
          className={`px-3 py-1.5 rounded-full text-sm ${
            !status && !priority ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Tất cả
        </Link>
        <Link
          href="/exchanges?status=PENDING"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "PENDING" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Chờ duyệt
        </Link>
        <Link
          href="/exchanges?status=APPROVED"
          className={`px-3 py-1.5 rounded-full text-sm ${
            status === "SCHEDULED" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Đã duyệt
        </Link>
        <Link
          href="/exchanges?priority=URGENT"
          className={`px-3 py-1.5 rounded-full text-sm ${
            priority === "URGENT" ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          Khẩn cấp
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
        <ExchangeList page={page} status={status} priority={priority} />
      </Suspense>
    </div>
  );
}
