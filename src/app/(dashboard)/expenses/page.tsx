"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BarChart3 } from "lucide-react";
import { getExpenses } from "@/actions/expenses";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import type { ExpenseListItem } from "@/types/expense";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("");

  const loadExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getExpenses({
        year,
        quarter: quarter ?? undefined,
        companyName: companyName || undefined,
        category: category || undefined,
        limit: 100,
        offset: 0,
      });

      if (result.success && result.data) {
        setExpenses(result.data.items);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Failed to load expenses:", error);
      toast.error("Không thể tải danh sách chi phí");
    } finally {
      setIsLoading(false);
    }
  }, [year, quarter, companyName, category]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const resetFilters = () => {
    setQuarter(null);
    setCompanyName("");
    setCategory("");
  };

  // Calculate totals
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi phí</h1>
          <p className="text-muted-foreground text-sm">Quản lý hóa đơn đầu vào</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/expenses/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              Báo cáo
            </Link>
          </Button>
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm chi phí
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí năm {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-primary text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-muted-foreground text-xs">{total} hóa đơn</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ExpenseFilters
        year={year}
        quarter={quarter}
        companyName={companyName}
        category={category}
        onYearChange={setYear}
        onQuarterChange={setQuarter}
        onCompanyNameChange={setCompanyName}
        onCategoryChange={setCategory}
        onReset={resetFilters}
      />

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-muted-foreground py-12 text-center">
              <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
              Đang tải...
            </div>
          ) : (
            <ExpenseTable expenses={expenses} onRefresh={loadExpenses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
