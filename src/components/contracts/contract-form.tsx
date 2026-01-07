/**
 * Contract Form Component
 * Create/edit contract with items
 */
"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createContractSchema, updateContractSchema, type CreateContractInput, type UpdateContractInput } from "@/lib/validations/contract";
import { createContract, updateContract } from "@/actions/contracts";
import { formatCurrency } from "@/lib/format";

type PlantType = {
  id: string;
  code: string;
  name: string;
  rentalPrice: number;
};

type Customer = {
  id: string;
  code: string;
  companyName: string;
};

type ContractForEdit = {
  id: string;
  customerId: string;
  startDate: Date;
  endDate: Date;
  depositAmount: number | null;
  paymentTerms: string | null;
  notes: string | null;
  items: {
    plantTypeId: string;
    quantity: number;
    unitPrice: number;
    notes: string | null;
  }[];
};

interface ContractFormProps {
  customers: Customer[];
  plantTypes: PlantType[];
  defaultCustomerId?: string;
  contract?: ContractForEdit;
}

export function ContractForm({ customers, plantTypes, defaultCustomerId, contract }: ContractFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!contract;

  const form = useForm<CreateContractInput>({
    resolver: zodResolver(isEditing ? updateContractSchema : createContractSchema) as Resolver<CreateContractInput>,
    defaultValues: isEditing
      ? {
          customerId: contract.customerId,
          startDate: new Date(contract.startDate),
          endDate: new Date(contract.endDate),
          depositAmount: contract.depositAmount ?? 0,
          paymentTerms: contract.paymentTerms ?? "",
          notes: contract.notes ?? "",
          items: contract.items.map((item) => ({
            plantTypeId: item.plantTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes ?? undefined,
          })),
        }
      : {
          customerId: defaultCustomerId || "",
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 12)),
          depositAmount: 0,
          paymentTerms: "Thanh toán hàng tháng, vào ngày 15 mỗi tháng",
          notes: "",
          items: [{ plantTypeId: "", quantity: 1, unitPrice: 0 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchItems = form.watch("items");
  const monthlyTotal = useMemo(
    () => watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0),
    [watchItems]
  );

  const handlePlantTypeChange = useCallback((index: number, plantTypeId: string) => {
    const plantType = plantTypes.find((pt) => pt.id === plantTypeId);
    if (plantType) {
      form.setValue(`items.${index}.plantTypeId`, plantTypeId);
      form.setValue(`items.${index}.unitPrice`, plantType.rentalPrice);
    }
  }, [plantTypes, form]);

  const onSubmit = (data: CreateContractInput) => {
    setError(null);
    startTransition(async () => {
      if (isEditing) {
        // Update existing contract
        const updateData: UpdateContractInput = {
          id: contract.id,
          startDate: data.startDate,
          endDate: data.endDate,
          depositAmount: data.depositAmount,
          paymentTerms: data.paymentTerms,
          notes: data.notes,
          items: data.items,
        };
        const result = await updateContract(updateData);
        if (result.success) {
          router.push(`/contracts/${contract.id}`);
        } else {
          setError(result.error);
        }
      } else {
        // Create new contract
        const result = await createContract(data);
        if (result.success) {
          router.push(`/contracts/${result.data.id}`);
        } else {
          setError(result.error);
        }
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Khách hàng *</Label>
              <Select
                value={form.watch("customerId")}
                onValueChange={(value) => form.setValue("customerId", value)}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.companyName} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Không thể thay đổi khách hàng khi chỉnh sửa hợp đồng
                </p>
              )}
              {form.formState.errors.customerId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.customerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount">Tiền đặt cọc</Label>
              <Input
                type="number"
                id="depositAmount"
                {...form.register("depositAmount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                type="date"
                id="startDate"
                {...form.register("startDate", { valueAsDate: true })}
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                type="date"
                id="endDate"
                {...form.register("endDate", { valueAsDate: true })}
                defaultValue={format(
                  new Date(new Date().setMonth(new Date().getMonth() + 12)),
                  "yyyy-MM-dd"
                )}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Điều khoản thanh toán</Label>
            <Textarea
              id="paymentTerms"
              {...form.register("paymentTerms")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" {...form.register("notes")} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách cây thuê</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ plantTypeId: "", quantity: 1, unitPrice: 0 })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm cây
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-4 items-start p-4 border rounded-lg"
              >
                <div className="flex-1 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Loại cây *</Label>
                    <Select
                      value={watchItems[index]?.plantTypeId || ""}
                      onValueChange={(value) => handlePlantTypeChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại cây" />
                      </SelectTrigger>
                      <SelectContent>
                        {plantTypes.map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.name} ({pt.code}) - {formatCurrency(pt.rentalPrice)}/cây
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Số lượng *</Label>
                    <Input
                      type="number"
                      min="1"
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Đơn giá/tháng</Label>
                    <Input
                      type="number"
                      min="0"
                      {...form.register(`items.${index}.unitPrice`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-sm text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Tổng giá trị hàng tháng:</span>
              <span className="text-primary">{formatCurrency(monthlyTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Cập nhật hợp đồng" : "Tạo hợp đồng"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
