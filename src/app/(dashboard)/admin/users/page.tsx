import { Suspense } from "react";
import { getUsers, getUserStats } from "@/actions/users";
import { UserTable } from "./_components/user-table";
import { UserStats } from "./_components/user-stats";
import { UserFilters } from "./_components/user-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Valid role values for type safety
const VALID_ROLES = ["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    isActive?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search;
  // Validate role parameter to avoid as any
  const role = params.role && VALID_ROLES.includes(params.role as ValidRole)
    ? (params.role as ValidRole)
    : undefined;
  const isActive = params.isActive === "true" ? true : params.isActive === "false" ? false : undefined;

  const [usersData, stats] = await Promise.all([
    getUsers({ page, limit: 20, search, role, isActive }),
    getUserStats(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý vai trò và quyền truy cập của người dùng trong hệ thống
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <UserStats stats={stats} />
      </Suspense>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng</CardTitle>
          <CardDescription>
            Tổng số {usersData.pagination.total} người dùng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserFilters />
          <UserTable data={usersData.data} pagination={usersData.pagination} />
        </CardContent>
      </Card>
    </div>
  );
}
