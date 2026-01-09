/**
 * Plant Type Form Component
 * Create/Edit plant type with React Hook Form + Zod validation
 */
"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createPlantType, updatePlantType } from "@/actions/plant-types";
import { createPlantTypeSchema } from "@/lib/validations/plant-type";
import type { z } from "zod";
import type { PlantType, Prisma } from "@prisma/client";

type FormValues = z.infer<typeof createPlantTypeSchema>;

// Accept both Decimal (from Prisma) and number (from server actions with toNumber() conversion)
type PlantTypeInput = Omit<
  PlantType,
  "rentalPrice" | "depositPrice" | "salePrice" | "replacementPrice"
> & {
  rentalPrice: Prisma.Decimal | number;
  depositPrice: Prisma.Decimal | number | null;
  salePrice: Prisma.Decimal | number | null;
  replacementPrice: Prisma.Decimal | number | null;
};

interface PlantTypeFormProps {
  plantType?: PlantTypeInput;
}

export function PlantTypeForm({ plantType }: PlantTypeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createPlantTypeSchema) as Resolver<FormValues>,
    defaultValues: plantType
      ? {
          code: plantType.code,
          name: plantType.name,
          description: plantType.description ?? undefined,
          category: plantType.category ?? undefined,
          sizeSpec: plantType.sizeSpec ?? undefined,
          heightMin: plantType.heightMin ?? undefined,
          heightMax: plantType.heightMax ?? undefined,
          potSize: plantType.potSize ?? undefined,
          potDiameter: plantType.potDiameter ?? undefined,
          rentalPrice: Number(plantType.rentalPrice),
          depositPrice: plantType.depositPrice ? Number(plantType.depositPrice) : undefined,
          salePrice: plantType.salePrice ? Number(plantType.salePrice) : undefined,
          replacementPrice: plantType.replacementPrice
            ? Number(plantType.replacementPrice)
            : undefined,
          avgLifespanDays: plantType.avgLifespanDays,
          wateringFrequency: plantType.wateringFrequency ?? undefined,
          lightRequirement: plantType.lightRequirement ?? undefined,
          temperatureRange: plantType.temperatureRange ?? undefined,
          careInstructions: plantType.careInstructions ?? undefined,
          careLevel: (plantType.careLevel as "Easy" | "Medium" | "Hard") ?? undefined,
          imageUrl: plantType.imageUrl ?? undefined,
          thumbnailUrl: plantType.thumbnailUrl ?? undefined,
          isActive: plantType.isActive,
        }
      : {
          code: "",
          name: "",
          rentalPrice: 50000,
          avgLifespanDays: 30,
          isActive: true,
        },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      if (plantType) {
        await updatePlantType(plantType.id, data);
        toast.success("Cập nhật loại cây thành công!");
        router.push(`/plant-types/${plantType.id}`);
      } else {
        const created = await createPlantType(data);
        toast.success("Thêm loại cây mới thành công!");
        router.push(`/plant-types/${created.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">
              Mã cây <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="KT, PT, LH..."
              disabled={!!plantType}
              className="uppercase"
            />
            {form.formState.errors.code && (
              <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
            )}
            <p className="text-muted-foreground text-sm">
              Mã viết tắt (chỉ chữ in hoa và số). VD: KT, PT01
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Input
              id="category"
              {...form.register("category")}
              placeholder="Indoor, Outdoor, Bonsai..."
            />
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Tên cây <span className="text-red-500">*</span>
          </Label>
          <Input id="name" {...form.register("name")} placeholder="Cây Kim Tiền, Cây Phát Tài..." />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Mô tả chi tiết về loại cây..."
            rows={4}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Thông số kỹ thuật</h3>

        <div className="space-y-2">
          <Label htmlFor="sizeSpec">Kích thước</Label>
          <Input id="sizeSpec" {...form.register("sizeSpec")} placeholder="Cao 1.2m, Chậu 30cm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="heightMin">Chiều cao tối thiểu (cm)</Label>
            <Input
              id="heightMin"
              type="number"
              {...form.register("heightMin", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heightMax">Chiều cao tối đa (cm)</Label>
            <Input
              id="heightMax"
              type="number"
              {...form.register("heightMax", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="potDiameter">Đường kính chậu (cm)</Label>
            <Input
              id="potDiameter"
              type="number"
              {...form.register("potDiameter", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Giá cả (VND)</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rentalPrice">
              Giá thuê/tháng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rentalPrice"
              type="number"
              {...form.register("rentalPrice", { valueAsNumber: true })}
            />
            {form.formState.errors.rentalPrice && (
              <p className="text-sm text-red-500">{form.formState.errors.rentalPrice.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositPrice">Tiền cọc</Label>
            <Input
              id="depositPrice"
              type="number"
              {...form.register("depositPrice", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePrice">Giá bán</Label>
            <Input
              id="salePrice"
              type="number"
              {...form.register("salePrice", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="replacementPrice">Giá thay thế</Label>
            <Input
              id="replacementPrice"
              type="number"
              {...form.register("replacementPrice", { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* Care Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Hướng dẫn chăm sóc</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="careLevel">Độ khó chăm sóc</Label>
            <Select
              value={form.watch("careLevel") ?? undefined}
              onValueChange={(value) =>
                form.setValue("careLevel", value as "Easy" | "Medium" | "Hard")
              }
            >
              <SelectTrigger id="careLevel">
                <SelectValue placeholder="Chọn độ khó" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Dễ</SelectItem>
                <SelectItem value="Medium">Trung bình</SelectItem>
                <SelectItem value="Hard">Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avgLifespanDays">Tuổi thọ trung bình (ngày)</Label>
            <Input
              id="avgLifespanDays"
              type="number"
              {...form.register("avgLifespanDays", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wateringFrequency">Tần suất tưới nước</Label>
            <Input
              id="wateringFrequency"
              {...form.register("wateringFrequency")}
              placeholder="2 lần/tuần, 1 lần/ngày..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lightRequirement">Yêu cầu ánh sáng</Label>
            <Input
              id="lightRequirement"
              {...form.register("lightRequirement")}
              placeholder="Ánh sáng gián tiếp, Nắng trực tiếp..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="careInstructions">Hướng dẫn chăm sóc chi tiết</Label>
          <Textarea
            id="careInstructions"
            {...form.register("careInstructions")}
            placeholder="Mô tả chi tiết cách chăm sóc..."
            rows={4}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          {...form.register("isActive")}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isActive" className="font-normal">
          Đang hoạt động (Loại cây có thể được sử dụng trong hợp đồng mới)
        </Label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {plantType ? "Cập nhật" : "Tạo loại cây"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
