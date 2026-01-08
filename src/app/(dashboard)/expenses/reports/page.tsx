"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getQuarterlyReport } from "@/actions/expenses";
import { formatCurrency } from "@/lib/format";
import type { QuarterlyReportData } from "@/types/expense";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";
import type { ExpenseCategory } from "@prisma/client";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function ExpenseReportsPage() {
  const [year, setYear] = useState(currentYear);
  const [reports, setReports] = useState<QuarterlyReportData[]>([]);
  const [yearTotal, setYearTotal] = useState(0);
  const [yearCount, setYearCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const result = await getQuarterlyReport({ year });
        if (result.success && result.data) {
          setReports(result.data.reports);
          setYearTotal(result.data.yearTotal);
          setYearCount(result.data.yearCount);
        }
      } catch (error) {
        console.error("Failed to load report:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [year]);

  // Calculate quarter-over-quarter change
  const getQoQChange = (quarterIndex: number) => {
    if (quarterIndex === 0) return null;
    const current = reports[quarterIndex]?.total ?? 0;
    const previous = reports[quarterIndex - 1]?.total ?? 0;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/expenses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Báo cáo chi phí</h1>
            <p className="text-muted-foreground text-sm">Tổng hợp theo quý</p>
          </div>
        </div>
        <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
          Đang tải...
        </div>
      ) : (
        <>
          {/* Year Summary */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tổng chi phí năm {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-primary text-3xl font-bold">{formatCurrency(yearTotal)}</div>
              <p className="text-muted-foreground text-sm">{yearCount} hóa đơn</p>
            </CardContent>
          </Card>

          {/* Quarterly Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((q) => {
              const report = reports.find((r) => r.quarter === q);
              const qIndex = reports.findIndex((r) => r.quarter === q);
              const change = qIndex >= 0 ? getQoQChange(qIndex) : null;

              return (
                <Card key={q}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Quý {q}</span>
                      {change !== null && (
                        <span
                          className={`flex items-center text-sm ${
                            change > 0
                              ? "text-red-600"
                              : change < 0
                                ? "text-green-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {change > 0 ? (
                            <TrendingUp className="mr-1 h-4 w-4" />
                          ) : change < 0 ? (
                            <TrendingDown className="mr-1 h-4 w-4" />
                          ) : (
                            <Minus className="mr-1 h-4 w-4" />
                          )}
                          {Math.abs(change).toFixed(1)}%
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report ? formatCurrency(report.total) : "-"}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {report ? `${report.count} hóa đơn` : "Chưa có dữ liệu"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Category Breakdown */}
          {reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phân bổ theo danh mục</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    reports.reduce(
                      (acc, r) => {
                        Object.entries(r.byCategory).forEach(([cat, amount]) => {
                          acc[cat] = (acc[cat] || 0) + amount;
                        });
                        return acc;
                      },
                      {} as Record<string, number>
                    )
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => {
                      const percentage = yearTotal > 0 ? (amount / yearTotal) * 100 : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] || cat}
                            </span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <div className="bg-muted h-2 rounded-full">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-muted-foreground text-xs">{percentage.toFixed(1)}%</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
