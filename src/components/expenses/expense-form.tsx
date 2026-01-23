"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpense, updateExpense } from "@/actions/expenses";
import { toast } from "sonner";
import type { ExpenseDTO } from "@/types/expense";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";
import type { ExpenseCategory } from "@prisma/client";

interface ExpenseFormProps {
  expense?: ExpenseDTO;
  mode: "create" | "edit";
}

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];

export function ExpenseForm({ expense, mode }: ExpenseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState(expense?.companyName ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(expense?.invoiceNumber ?? "");
  const [invoiceDate, setInvoiceDate] = useState(
    expense?.invoiceDate ? expense.invoiceDate.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [category, setCategory] = useState<string>(expense?.category ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Vui lòng nhập tên công ty");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    try {
      setIsSubmitting(true);

      const data = {
        companyName: companyName.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        amount: Number(amount),
        category: category || undefined,
        description: description.trim() || undefined,
      };

      if (mode === "create") {
        const result = await createExpense(data);
        if (result.success) {
          toast.success(result.data?.message || "Đã tạo chi phí");
          router.push("/expenses");
        } else {
          throw new Error(result.error);
        }
      } else if (expense) {
        const result = await updateExpense({ id: expense.id, ...data });
        if (result.success) {
          toast.success(result.data?.message || "Đã cập nhật chi phí");
          router.push("/expenses");
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Tạo chi phí mới" : "Chỉnh sửa chi phí"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Tên công ty / NCC *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nhập tên nhà cung cấp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Số hóa đơn</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="VD: 0001234"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Ngày hóa đơn *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền (VND) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về chi phí..."
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo chi phí" : "Lưu thay đổi"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
