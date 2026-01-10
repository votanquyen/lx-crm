/**
 * Invoice Form Component
 */
"use client";

import { useState, useTransition, useMemo } from "react";
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
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/contract";
import { createInvoice } from "@/actions/invoices";
import { formatCurrency } from "@/lib/format";

type Customer = {
  id: string;
  code: string;
  companyName: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  customerId: string;
};

interface InvoiceFormProps {
  customers: Customer[];
  contracts: Contract[];
  defaultCustomerId?: string;
  defaultContractId?: string;
}

export function InvoiceForm({
  customers,
  contracts,
  defaultCustomerId,
  defaultContractId,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema) as Resolver<CreateInvoiceInput>,
    defaultValues: {
      customerId: defaultCustomerId || "",
      contractId: defaultContractId || undefined,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedCustomerId = form.watch("customerId");
  const filteredContracts = useMemo(
    () => contracts.filter((c) => c.customerId === selectedCustomerId),
    [contracts, selectedCustomerId]
  );

  const watchItems = form.watch("items");
  const total = useMemo(
    () => watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0),
    [watchItems]
  );

  const onSubmit = (data: CreateInvoiceInput) => {
    setError(null);
    startTransition(async () => {
      const result = await createInvoice(data);
      if (result.success) {
        router.push(`/invoices/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="bg-destructive/10 text-destructive rounded-lg p-4">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Khách hàng *</Label>
              <Select
                value={form.watch("customerId")}
                onValueChange={(value) => {
                  form.setValue("customerId", value);
                  form.setValue("contractId", undefined);
                }}
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
                <p className="text-destructive text-sm">
                  {form.formState.errors.customerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractId">Hợp đồng (tùy chọn)</Label>
              <Select
                value={form.watch("contractId") || undefined}
                onValueChange={(value) =>
                  form.setValue("contractId", value === "none" ? undefined : value)
                }
                disabled={!selectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hợp đồng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không liên kết hợp đồng</SelectItem>
                  {filteredContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Ngày phát hành</Label>
              <Input
                type="date"
                id="issueDate"
                {...form.register("issueDate", { valueAsDate: true })}
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Hạn thanh toán *</Label>
              <Input
                type="date"
                id="dueDate"
                {...form.register("dueDate", { valueAsDate: true })}
                defaultValue={format(
                  new Date(new Date().setDate(new Date().getDate() + 15)),
                  "yyyy-MM-dd"
                )}
              />
              {form.formState.errors.dueDate && (
                <p className="text-destructive text-sm">{form.formState.errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea id="notes" {...form.register("notes")} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Chi tiết hóa đơn</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm mục
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 rounded-lg border p-4">
                <div className="grid flex-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Mô tả *</Label>
                    <Input
                      {...form.register(`items.${index}.description`)}
                      placeholder="Mô tả dịch vụ/sản phẩm"
                    />
                    {form.formState.errors.items?.[index]?.description && (
                      <p className="text-destructive text-sm">
                        {form.formState.errors.items[index]?.description?.message}
                      </p>
                    )}
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
                    <Label>Đơn giá</Label>
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
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {form.formState.errors.items && (
              <p className="text-destructive text-sm">{form.formState.errors.items.message}</p>
            )}
          </div>

          <div className="bg-muted mt-6 rounded-lg p-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Tạo hóa đơn
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
