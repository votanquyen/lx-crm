/**
 * Plant Type Detail Page
 * View and edit plant type with inventory management
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Package, TrendingUp } from "lucide-react";
import { getPlantTypeById } from "@/actions/plant-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyDecimal } from "@/lib/db-utils";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlantTypeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const plantType = await getPlantTypeById(id).catch(() => notFound());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/plant-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{plantType.name}</h1>
              {!plantType.isActive && <Badge variant="secondary">Ngừng hoạt động</Badge>}
            </div>
            <p className="text-muted-foreground">Mã: {plantType.code}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/plant-types/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Information */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plantType.category && (
                <div>
                  <span className="text-muted-foreground text-sm">Danh mục</span>
                  <p className="font-medium">{plantType.category}</p>
                </div>
              )}

              {plantType.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Mô tả</span>
                  <p className="text-sm">{plantType.description}</p>
                </div>
              )}

              <Separator />

              {/* Specifications */}
              <div>
                <h4 className="mb-3 font-semibold">Thông số kỹ thuật</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plantType.sizeSpec && (
                    <div>
                      <span className="text-muted-foreground text-sm">Kích thước</span>
                      <p className="text-sm">{plantType.sizeSpec}</p>
                    </div>
                  )}
                  {(plantType.heightMin || plantType.heightMax) && (
                    <div>
                      <span className="text-muted-foreground text-sm">Chiều cao</span>
                      <p className="text-sm">
                        {plantType.heightMin && `${plantType.heightMin}cm`}
                        {plantType.heightMin && plantType.heightMax && " - "}
                        {plantType.heightMax && `${plantType.heightMax}cm`}
                      </p>
                    </div>
                  )}
                  {plantType.potDiameter && (
                    <div>
                      <span className="text-muted-foreground text-sm">Đường kính chậu</span>
                      <p className="text-sm">{plantType.potDiameter}cm</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Care Instructions */}
              <div>
                <h4 className="mb-3 font-semibold">Hướng dẫn chăm sóc</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plantType.careLevel && (
                    <div>
                      <span className="text-muted-foreground text-sm">Độ khó</span>
                      <p className="text-sm">{plantType.careLevel}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground text-sm">Tuổi thọ TB</span>
                    <p className="text-sm">{plantType.avgLifespanDays} ngày</p>
                  </div>
                  {plantType.wateringFrequency && (
                    <div>
                      <span className="text-muted-foreground text-sm">Tưới nước</span>
                      <p className="text-sm">{plantType.wateringFrequency}</p>
                    </div>
                  )}
                  {plantType.lightRequirement && (
                    <div>
                      <span className="text-muted-foreground text-sm">Ánh sáng</span>
                      <p className="text-sm">{plantType.lightRequirement}</p>
                    </div>
                  )}
                </div>
                {plantType.careInstructions && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Chi tiết</span>
                    <p className="text-sm whitespace-pre-wrap">{plantType.careInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Contracts */}
          {plantType.contractItems && plantType.contractItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hợp đồng đang hoạt động</CardTitle>
                <CardDescription>
                  {plantType._count.contractItems} hợp đồng sử dụng loại cây này
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plantType.contractItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/contracts/${item.contract.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.contract.contractNumber}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {item.contract.customer.companyName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} cây</p>
                        <Badge
                          variant={item.contract.status === "ACTIVE" ? "default" : "secondary"}
                        >
                          {item.contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {plantType._count.contractItems > 5 && (
                    <p className="text-muted-foreground text-center text-sm">
                      Và {plantType._count.contractItems - 5} hợp đồng khác...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Giá cả
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-muted-foreground text-sm">Giá thuê/tháng</span>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrencyDecimal(plantType.rentalPrice)}
                </p>
              </div>
              {plantType.depositPrice && (
                <div>
                  <span className="text-muted-foreground text-sm">Tiền cọc</span>
                  <p className="font-medium">{formatCurrencyDecimal(plantType.depositPrice)}</p>
                </div>
              )}
              {plantType.salePrice && (
                <div>
                  <span className="text-muted-foreground text-sm">Giá bán</span>
                  <p className="font-medium">{formatCurrencyDecimal(plantType.salePrice)}</p>
                </div>
              )}
              {plantType.replacementPrice && (
                <div>
                  <span className="text-muted-foreground text-sm">Giá thay thế</span>
                  <p className="font-medium">{formatCurrencyDecimal(plantType.replacementPrice)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          {plantType.inventory && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Tồn kho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground text-sm">Tổng</span>
                    <p className="text-2xl font-bold">{plantType.inventory.totalStock}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Có sẵn</span>
                    <p className="text-2xl font-bold text-green-600">
                      {plantType.inventory.availableStock}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đang cho thuê</span>
                    <span className="font-medium">{plantType.inventory.rentedStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã đặt trước</span>
                    <span className="font-medium">{plantType.inventory.reservedStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hư hỏng</span>
                    <span className="font-medium text-red-600">
                      {plantType.inventory.damagedStock}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo dưỡng</span>
                    <span className="font-medium">{plantType.inventory.maintenanceStock}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngưỡng cảnh báo</span>
                    <span className="font-medium">{plantType.inventory.lowStockThreshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Điểm đặt hàng lại</span>
                    <span className="font-medium">{plantType.inventory.reorderPoint}</span>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                  <Link href={`/plant-types/${id}/inventory`}>Quản lý tồn kho</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê sử dụng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hợp đồng</span>
                <span className="font-medium">{plantType._count.contractItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Báo giá</span>
                <span className="font-medium">{plantType._count.quotationItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vị trí KH</span>
                <span className="font-medium">{plantType._count.customerPlants}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
