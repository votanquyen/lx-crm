/**
 * Plant Types List Page
 * Server Component with search, filters, and inventory tracking
 */
import Link from "next/link";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { getPlantTypes, getPlantCategories, getInventoryStats } from "@/actions/plant-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyDecimal } from "@/lib/db-utils";

// Type for plant with optional inventory (present in non-search queries, absent in trigram search)
type PlantWithInventory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  rentalPrice: number;
  depositPrice: number | null;
  salePrice: number | null;
  replacementPrice: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  inventory?: {
    totalStock: number;
    availableStock: number;
    rentedStock: number;
  } | null;
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    isActive?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function PlantTypesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? "1", 10);
  const limit = parseInt(params.limit ?? "20", 10);
  const isActive =
    params.isActive === "true" ? true : params.isActive === "false" ? false : undefined;

  const [plantsResult, categories, inventoryStats] = await Promise.all([
    getPlantTypes({
      page,
      limit,
      search: params.search,
      category: params.category,
      isActive,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      sortBy: "name",
      sortOrder: "asc",
    }),
    getPlantCategories(),
    getInventoryStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục cây</h1>
          <p className="text-muted-foreground">
            Quản lý các loại cây và tồn kho ({plantsResult.pagination.total} loại cây)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/plant-types/new" className="gap-1">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm loại cây
            </Link>
          </Button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tổng tồn kho"
          value={inventoryStats._sum.totalStock?.toString() ?? "0"}
          icon={Package}
        />
        <StatCard
          title="Có sẵn"
          value={inventoryStats._sum.availableStock?.toString() ?? "0"}
          icon={Package}
          variant="success"
        />
        <StatCard
          title="Đang cho thuê"
          value={inventoryStats._sum.rentedStock?.toString() ?? "0"}
          icon={Package}
          variant="info"
        />
        <StatCard
          title="Hư hỏng"
          value={inventoryStats._sum.damagedStock?.toString() ?? "0"}
          icon={Package}
          variant="danger"
        />
        <StatCard
          title="Cảnh báo tồn kho"
          value={inventoryStats.lowStockCount?.toString() ?? "0"}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <form action="" method="get">
            <input
              type="search"
              name="search"
              defaultValue={params.search}
              placeholder="Tìm kiếm theo tên, mã cây..."
              className="w-full rounded-md border px-3 py-2"
            />
          </form>
        </div>
        <div className="flex gap-2">
          <select
            name="category"
            className="rounded-md border px-3 py-2"
            defaultValue={params.category ?? ""}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            name="isActive"
            className="rounded-md border px-3 py-2"
            defaultValue={params.isActive ?? ""}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Plant Types Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plantsResult.plantTypes.map((plant) => (
          <Card key={plant.id} className="overflow-hidden">
            <div className="bg-muted relative aspect-square">
              {plant.imageUrl ? (
                <img src={plant.imageUrl} alt={plant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <Package className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
              {!plant.isActive && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">Ngừng hoạt động</Badge>
                </div>
              )}
            </div>
            <CardHeader className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">
                    <Link href={`/plant-types/${plant.id}`} className="hover:underline">
                      {plant.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Mã: {plant.code}
                    {plant.category && ` • ${plant.category}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground text-sm">Giá thuê</span>
                <span className="font-semibold text-green-600">
                  {formatCurrencyDecimal(plant.rentalPrice)}/tháng
                </span>
              </div>
              {(plant as PlantWithInventory).inventory?.totalStock !== undefined && (
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>Tồn kho</span>
                  <span>
                    {(plant as PlantWithInventory).inventory?.availableStock}/
                    {(plant as PlantWithInventory).inventory?.totalStock}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/plant-types/${plant.id}`}>Xem chi tiết</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {plantsResult.plantTypes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="text-muted-foreground mb-4 h-12 w-12" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-semibold">Chưa có loại cây nào</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Bắt đầu bằng cách thêm loại cây đầu tiên vào danh mục
            </p>
            <Button asChild>
              <Link href="/plant-types/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Thêm loại cây
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {plantsResult.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: plantsResult.pagination.totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Link
                key={pageNum}
                href={`?page=${pageNum}${params.search ? `&search=${params.search}` : ""}${params.category ? `&category=${params.category}` : ""}`}
                className={`rounded px-3 py-1 ${
                  pageNum === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {pageNum}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  variant?: "success" | "info" | "warning" | "danger";
}) {
  const colors = {
    success: "text-green-600",
    info: "text-blue-600",
    warning: "text-orange-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant ? colors[variant] : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${variant ? colors[variant] : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
