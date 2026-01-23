"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { getMonthlyStatements } from "@/actions/monthly-statements";

interface CustomerStatementsTableProps {
  customerId: string;
}

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

interface StatementItem {
  id: string;
  year: number;
  month: number;
  total: number;
  needsConfirmation: boolean;
  plantCount: number;
}

export function CustomerStatementsTable({ customerId }: CustomerStatementsTableProps) {
  const [statements, setStatements] = useState<StatementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  useEffect(() => {
    async function loadStatements() {
      setIsLoading(true);
      try {
        const result = await getMonthlyStatements({
          customerId,
          year: selectedYear,
          limit: 12,
          offset: 0,
        });
        // Handle ActionResponse wrapper
        if ("success" in result && !result.success) {
          console.error("Failed to load statements:", result.error);
          setStatements([]);
        } else if ("items" in result) {
          setStatements(result.items as StatementItem[]);
        } else {
          setStatements([]);
        }
      } catch (error) {
        console.error("Failed to load statements:", error);
        setStatements([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadStatements();
  }, [customerId, selectedYear]);

  // Calculate totals
  const totalAmount = statements.reduce((sum, s) => sum + s.total, 0);
  const confirmedCount = statements.filter((s) => !s.needsConfirmation).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bảng kê hàng tháng</CardTitle>
            <CardDescription>Chi tiết cây xanh và dịch vụ theo từng kỳ</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-bold"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : statements.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" aria-hidden="true" />
            <p className="text-muted-foreground text-sm">
              Không có bảng kê trong năm {selectedYear}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={`/bang-ke?customerId=${customerId}`}>Tạo bảng kê mới</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Tổng bảng kê
                </p>
                <p className="text-xl font-black text-slate-800">{statements.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase">
                  Đã xác nhận
                </p>
                <p className="text-xl font-black text-emerald-700">
                  {confirmedCount} / {statements.length}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">
                  Tổng giá trị
                </p>
                <p className="text-xl font-black text-blue-700">{formatCurrency(totalAmount)}</p>
              </div>
            </div>

            {/* Statements Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-[10px] font-bold tracking-widest uppercase">
                      Kỳ
                    </TableHead>
                    <TableHead className="text-center text-[10px] font-bold tracking-widest uppercase">
                      Cây
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-bold tracking-widest uppercase">
                      Giá trị
                    </TableHead>
                    <TableHead className="text-center text-[10px] font-bold tracking-widest uppercase">
                      Trạng thái
                    </TableHead>
                    <TableHead className="w-10 text-[10px] font-bold tracking-widest uppercase"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((stmt) => (
                    <TableRow key={stmt.id} className="group">
                      <TableCell className="font-bold text-slate-800">
                        {MONTHS[stmt.month - 1]} {stmt.year}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-slate-600">{stmt.plantCount} cây</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-slate-800">
                          {formatCurrency(stmt.total)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {stmt.needsConfirmation ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Đã duyệt
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/bang-ke?customerId=${customerId}&year=${stmt.year}&month=${stmt.month}`}
                          className="hover:text-primary rounded p-1.5 text-slate-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-slate-100"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* View All Link */}
            <div className="mt-4 text-center">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground text-xs">
                <Link href={`/bang-ke?customerId=${customerId}`}>
                  Xem chi tiết đầy đủ
                  <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
