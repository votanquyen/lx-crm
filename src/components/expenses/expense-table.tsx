"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { deleteExpense } from "@/actions/expenses";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import type { ExpenseListItem } from "@/types/expense";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";

interface ExpenseTableProps {
  expenses: ExpenseListItem[];
  onRefresh: () => void;
}

export function ExpenseTable({ expenses, onRefresh }: ExpenseTableProps) {
  const handleDelete = async (id: string) => {
    try {
      const result = await deleteExpense({ id });
      if (result.success) {
        toast.success(result.data?.message || "Đã xóa chi phí");
        onRefresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa chi phí";
      toast.error(message);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Chưa có chi phí nào
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Công ty / NCC</TableHead>
            <TableHead>Số HĐ</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead>Quý</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                {new Date(expense.invoiceDate).toLocaleDateString("vi-VN")}
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/expenses/${expense.id}`} className="hover:underline">
                  {expense.companyName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {expense.invoiceNumber || "-"}
              </TableCell>
              <TableCell>
                {expense.category ? (
                  <Badge variant="outline">
                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>
                Q{expense.quarter}/{expense.year}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/expenses/${expense.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn xóa chi phí này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(expense.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
