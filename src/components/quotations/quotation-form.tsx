/**
 * Quotation Form Component
 * Form for creating and editing quotations with multiple items
 */
"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addDays } from "date-fns";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createQuotation } from "@/actions/quotations";
import { createQuotationSchema } from "@/lib/validations/quotation";
import { formatCurrency } from "@/lib/utils";
import type { z } from "zod";
import type { Customer, PlantType } from "@prisma/client";

type FormValues = z.infer<typeof createQuotationSchema>;

// Serialized PlantType with Decimal fields converted to numbers
type SerializedPlantType = Omit<
  PlantType,
  "rentalPrice" | "depositPrice" | "salePrice" | "replacementPrice"
> & {
  rentalPrice: number;
  depositPrice: number | null;
  salePrice: number | null;
  replacementPrice: number | null;
};

interface QuotationFormProps {
  customers: Customer[];
  plantTypes: SerializedPlantType[];
}

export function QuotationForm({ customers = [], plantTypes = [] }: QuotationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createQuotationSchema) as any,
    defaultValues: {
      validFrom: new Date(),
      validUntil: addDays(new Date(), 30),
      discountRate: 0,
      vatRate: 10,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Use targeted useWatch for specific fields to minimize re-renders
  const items = useWatch({ control: form.control, name: "items" }) || [];
  const discountRate = useWatch({ control: form.control, name: "discountRate" }) || 0;
  const vatRate = useWatch({ control: form.control, name: "vatRate" }) || 10;

  // Memoize totals calculation (computed from watched values)
  const calculatedTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const itemDiscount = item.discountRate || 0;
      const itemTotal = quantity * unitPrice * (1 - itemDiscount / 100);
      return sum + itemTotal;
    }, 0);

    const discountAmount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = subtotalAfterDiscount * (vatRate / 100);
    const totalAmount = subtotalAfterDiscount + vatAmount;

    return { subtotal, discountAmount, vatAmount, totalAmount };
  }, [items, discountRate, vatRate]);

  // Extract stable setValue reference to avoid infinite loop
  // (form object is not referentially stable, but setValue is)
  const { setValue } = form;

  // Update form values when totals change (still needed for form submission)
  useEffect(() => {
    const options = { shouldValidate: false, shouldDirty: false };
    setValue("subtotal", calculatedTotals.subtotal, options);
    setValue("discountAmount", calculatedTotals.discountAmount, options);
    setValue("vatAmount", calculatedTotals.vatAmount, options);
    setValue("totalAmount", calculatedTotals.totalAmount, options);
  }, [calculatedTotals, setValue]);

  function addItem() {
    append({
      plantTypeId: "",
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      locationNote: null,
      notes: null,
    });
  }

  async function onSubmit(data: FormValues) {
    if (data.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }

    setIsSubmitting(true);
    try {
      const quotation = await createQuotation(data);
      toast.success("Tạo báo giá thành công!");
      router.push(`/quotations/${quotation.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customerId">
          Khách hàng <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.watch("customerId")}
          onValueChange={(value) => form.setValue("customerId", value)}
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
        {form.formState.errors.customerId && (
          <p className="text-destructive text-sm">{form.formState.errors.customerId.message}</p>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề báo giá</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="VD: Báo giá cây xanh văn phòng"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil">
            Hạn hiệu lực <span className="text-destructive">*</span>
          </Label>
          <Input
            id="validUntil"
            type="date"
            {...form.register("validUntil", {
              valueAsDate: true,
            })}
          />
          {form.formState.errors.validUntil && (
            <p className="text-destructive text-sm">{form.formState.errors.validUntil.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder="Mô tả chi tiết về báo giá"
          rows={3}
        />
      </div>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách sản phẩm</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Thêm sản phẩm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Chưa có sản phẩm nào. Nhấn &quot;Thêm sản phẩm&quot; để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead className="w-24">Số lượng</TableHead>
                    <TableHead className="w-32">Đơn giá</TableHead>
                    <TableHead className="w-24">Giảm (%)</TableHead>
                    <TableHead className="w-32">Thành tiền</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    // Use already-watched items array instead of form.watch() in loop
                    const item = items[index];
                    const quantity = item?.quantity || 0;
                    const unitPrice = item?.unitPrice || 0;
                    const itemDiscount = item?.discountRate || 0;
                    const total = quantity * unitPrice * (1 - itemDiscount / 100);

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Select
                            value={item?.plantTypeId || ""}
                            onValueChange={(value) => {
                              form.setValue(`items.${index}.plantTypeId`, value);
                              // Auto-fill unit price
                              const plant = plantTypes.find((p) => p.id === value);
                              if (plant) {
                                form.setValue(
                                  `items.${index}.unitPrice`,
                                  Number(plant.rentalPrice)
                                );
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn cây" />
                            </SelectTrigger>
                            <SelectContent>
                              {plantTypes.map((plant) => (
                                <SelectItem key={plant.id} value={plant.id}>
                                  {plant.name} - {formatCurrency(Number(plant.rentalPrice))}/tháng
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            {...form.register(`items.${index}.unitPrice`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...form.register(`items.${index}.discountRate`, {
                              valueAsNumber: true,
                            })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(total)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="text-destructive h-4 w-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng kết giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discountRate">Chiết khấu chung (%)</Label>
              <Input
                id="discountRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...form.register("discountRate", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRate">VAT (%)</Label>
              <Input
                id="vatRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...form.register("vatRate", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="font-medium">{formatCurrency(calculatedTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chiết khấu ({discountRate}%):</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(calculatedTotals.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT ({vatRate}%):</span>
              <span className="font-medium">{formatCurrency(calculatedTotals.vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(calculatedTotals.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Ghi chú nội bộ</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Ghi chú cho nội bộ (khách hàng không thấy)"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="termsConditions">Điều khoản và điều kiện</Label>
          <Textarea
            id="termsConditions"
            {...form.register("termsConditions")}
            placeholder="Các điều khoản và điều kiện của báo giá"
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Tạo báo giá
        </Button>
      </div>
    </form>
  );
}
