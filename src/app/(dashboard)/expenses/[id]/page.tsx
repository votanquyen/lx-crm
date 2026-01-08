import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, FileText, Tag, DollarSign } from "lucide-react";
import { getExpense } from "@/actions/expenses";
import { formatCurrency } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";

interface ExpenseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const { id } = await params;

  const result = await getExpense({ id });

  if (!result.success || !result.data) {
    notFound();
  }

  const expense = result.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/expenses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{expense.companyName}</h1>
            <p className="text-muted-foreground text-sm">
              {expense.invoiceNumber ? `Số HĐ: ${expense.invoiceNumber}` : "Không có số hóa đơn"}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/expenses/${expense.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết chi phí</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs">Ngày hóa đơn</p>
              <p className="font-medium">
                {new Date(expense.invoiceDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DollarSign className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs">Số tiền</p>
              <p className="text-primary text-xl font-bold">{formatCurrency(expense.amount)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs">Danh mục</p>
              {expense.category ? (
                <Badge variant="outline">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
              ) : (
                <p className="text-muted-foreground">Chưa phân loại</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="text-muted-foreground h-4 w-4" />
            <div>
              <p className="text-muted-foreground text-xs">Kỳ</p>
              <p className="font-medium">
                Quý {expense.quarter}/{expense.year}
              </p>
            </div>
          </div>

          {expense.description && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-1 text-xs">Mô tả</p>
              <p className="text-sm">{expense.description}</p>
            </div>
          )}

          {expense.createdBy && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground text-xs">
                Tạo bởi {expense.createdBy.name} vào{" "}
                {new Date(expense.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
