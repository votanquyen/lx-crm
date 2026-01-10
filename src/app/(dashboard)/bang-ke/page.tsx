"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  getMonthlyStatements,
  getCustomersForStatements,
  getMonthlyStatement,
  confirmMonthlyStatement,
} from "@/actions/monthly-statements";
import type { StatementListItem, StatementDTO } from "@/types/monthly-statement";
import { formatCurrency } from "@/lib/format";
import { getMonthShort } from "@/lib/statement-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export default function BangKePage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statements, setStatements] = useState<StatementListItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [currentStatementDetail, setCurrentStatementDetail] = useState<StatementDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * PERFORMANCE: Load customers and statements in PARALLEL on mount/year change
   * This eliminates the waterfall: loadCustomers() -> loadStatements() (sequential)
   * Now both run simultaneously, saving ~200ms on initial load
   *
   * TODO: For further optimization, consider Option 4 (Hybrid SSR):
   * - Move this Promise.all to Server Component
   * - Pass data as props to client component
   * - Eliminates loading spinner entirely on first paint
   * - See: plans/260109-app-performance-optimization/phase-02-ssr-migration.md
   */
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [customersResult, statementsResult] = await Promise.all([
          getCustomersForStatements({}),
          getMonthlyStatements({
            year: selectedYear,
            limit: 500,
            offset: 0,
          }),
        ]);

        if (customersResult.success && customersResult.data) {
          setCustomers(customersResult.data);
        }
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [selectedYear]);

  // Load statement detail when customer/month changes
  useEffect(() => {
    // Compute current statement ID inside effect to avoid stale closure
    // Use statements directly (not the memoized map) since this runs once per filter change
    const customerStmts = selectedCustomerId
      ? statements.filter((s) => s.customerId === selectedCustomerId)
      : [];
    const currentStmt = customerStmts.find((s) => s.month === selectedMonth);

    if (selectedCustomerId && currentStmt) {
      loadStatementDetail(currentStmt.id);
    } else {
      setCurrentStatementDetail(null);
    }
  }, [selectedCustomerId, selectedMonth, statements]);

  async function loadStatementDetail(id: string) {
    try {
      setIsLoading(true);
      const result = await getMonthlyStatement({ id });
      if (result.success && result.data) {
        setCurrentStatementDetail(result.data);
      }
    } catch (error) {
      console.error("Failed to load statement detail:", error);
      setCurrentStatementDetail(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmStatement(id: string) {
    try {
      setIsConfirming(true);
      const result = await confirmMonthlyStatement({ id });
      if (result.success) {
        toast.success(result.data?.message || "Đã xác nhận bảng kê");
        // Reload statements after confirmation
        const statementsResult = await getMonthlyStatements({
          year: selectedYear,
          limit: 500,
          offset: 0,
        });
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data.items || []);
        }
        if (currentStatementDetail) {
          await loadStatementDetail(currentStatementDetail.id);
        }
      } else {
        throw new Error(result.error || "Không thể xác nhận");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể xác nhận bảng kê";
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleExportCSV() {
    if (!currentStatementDetail) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      // Dynamic import to reduce initial bundle size
      const { generateMonthlyStatementCSV, getStatementFilename } = await import("@/lib/csv/export-monthly-statement");

      const csv = generateMonthlyStatementCSV(currentStatementDetail);
      const filename = getStatementFilename(
        currentStatementDetail.customer?.companyName || "company",
        currentStatementDetail.year,
        currentStatementDetail.month
      );

      // Create blob and download
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã xuất file CSV");
    } catch (error) {
      console.error("Failed to export CSV:", error);
      toast.error("Không thể xuất file CSV");
    }
  }

  async function handleExportPDF() {
    if (!currentStatementDetail) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }

    try {
      // Dynamic import to reduce initial bundle size
      const { generateMonthlyStatementPDF } = await import("@/lib/pdf/monthly-statement-pdf");
      const { getStatementFilename } = await import("@/lib/csv/export-monthly-statement");

      const doc = generateMonthlyStatementPDF(currentStatementDetail);
      const filename = getStatementFilename(
        currentStatementDetail.customer?.companyName || "company",
        currentStatementDetail.year,
        currentStatementDetail.month
      ).replace(".csv", ".pdf");

      doc.save(filename);
      toast.success("Đã tạo file PDF");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Không thể xuất file PDF");
    }
  }

  // Filter customers by search (memoized)
  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) =>
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  // Pre-group statements by customerId for O(1) lookup (avoids O(n²) filter inside map)
  const statementsByCustomer = useMemo(() => {
    const grouped = new Map<string, StatementListItem[]>();
    statements.forEach((s) => {
      const existing = grouped.get(s.customerId) || [];
      existing.push(s);
      grouped.set(s.customerId, existing);
    });
    return grouped;
  }, [statements]);

  // Filter statements for selected customer (using pre-grouped map for O(1) lookup)
  const customerStatements = useMemo(
    () => (selectedCustomerId ? statementsByCustomer.get(selectedCustomerId) || [] : []),
    [selectedCustomerId, statementsByCustomer]
  );

  const currentStatement = useMemo(
    () => customerStatements.find((s) => s.month === selectedMonth),
    [customerStatements, selectedMonth]
  );

  // Years selector (current - 2 to current + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  // Months array
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Company List */}
        <div className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold mb-1">Bảng Kê</h1>
            <p className="text-sm text-muted-foreground">
              Cây xanh văn phòng
            </p>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm công ty..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filteredCustomers.map((customer) => {
              const customerStmts = statementsByCustomer.get(customer.id) || [];
              const hasUnconfirmed = customerStmts.some((s) => s.needsConfirmation);
              const monthlyTotal = customerStmts.find(
                (s) => s.month === selectedMonth // FIX: Use selectedMonth instead of current month
              )?.total || 0;

              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedCustomerId === customer.id
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {customer.shortName?.substring(0, 2).toUpperCase() ||
                            customer.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{customer.companyName}</div>
                          <div className="text-xs text-muted-foreground">
                            {customer.district} • {customerStmts.length} tháng
                          </div>
                        </div>
                        {hasUnconfirmed && (
                          <Badge variant="outline" className="border-amber-500 bg-amber-50 text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                      {monthlyTotal > 0 && (
                        <div className="mt-2 text-sm font-semibold text-primary">
                          {formatCurrency(monthlyTotal)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedCustomerId ? (
            <div className="p-6">
              {/* Header with customer name */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold">
                  {customers.find((c) => c.id === selectedCustomerId)?.companyName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {customers.find((c) => c.id === selectedCustomerId)?.address}
                </p>
              </div>

              {/* Year & Month Selector */}
              <div className="flex items-center gap-4 mb-6">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border rounded-md bg-background"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1 flex-wrap">
                  {months.map((month) => {
                    const stmt = customerStatements.find((s) => s.month === month);
                    const isSelected = selectedMonth === month;
                    const needsConfirm = stmt?.needsConfirmation;

                    return (
                      <Button
                        key={month}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMonth(month)}
                        className={`relative ${
                          needsConfirm ? "border-amber-500" : ""
                        }`}
                      >
                        {getMonthShort(month)}
                        {needsConfirm && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </Button>
                    );
                  })}
                </div>

                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!currentStatementDetail}>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!currentStatementDetail}>
                    <Printer className="h-4 w-4 mr-2" />
                    In
                  </Button>
                </div>
              </div>

              {/* Statement Card */}
              {currentStatement ? (
                <Card
                  className={
                    currentStatement.needsConfirmation
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                      : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {currentStatement.needsConfirmation && (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                          Tháng {selectedMonth}/{selectedYear}
                          {currentStatement.needsConfirmation && (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              Chưa xác nhận
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentStatement.plantCount} loại cây
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(currentStatement.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">đã gồm VAT</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentStatement.needsConfirmation && (
                      <div className="mb-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          ⚠ Tháng mới - Hệ thống tự động tạo từ tháng trước
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Vui lòng kiểm tra và xác nhận.
                        </p>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => handleConfirmStatement(currentStatement.id)}
                          disabled={isConfirming}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {isConfirming ? "Đang xác nhận..." : "Xác nhận"}
                        </Button>
                      </div>
                    )}

                    {/* Plant Table */}
                    {currentStatementDetail && isLoading ? (
                      <div className="text-center text-muted-foreground py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Đang tải...</p>
                      </div>
                    ) : currentStatementDetail ? (
                      <div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">STT</TableHead>
                              <TableHead>Tên cây</TableHead>
                              <TableHead>Quy cách</TableHead>
                              <TableHead className="text-right">Đơn giá</TableHead>
                              <TableHead className="text-right">Số lượng</TableHead>
                              <TableHead className="text-right">Thành tiền</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentStatementDetail.plants.map((plant, idx) => (
                              <TableRow key={plant.id}>
                                <TableCell className="font-medium">{idx + 1}</TableCell>
                                <TableCell>{plant.name}</TableCell>
                                <TableCell className="text-muted-foreground">{plant.sizeSpec}</TableCell>
                                <TableCell className="text-right">{formatCurrency(plant.unitPrice)}</TableCell>
                                <TableCell className="text-right">{plant.quantity}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(plant.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Financial Summary */}
                        <div className="mt-6 space-y-2 border-t pt-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tổng cộng:</span>
                            <span className="font-medium">{formatCurrency(currentStatementDetail.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT ({currentStatementDetail.vatRate}%):</span>
                            <span className="font-medium">{formatCurrency(currentStatementDetail.vatAmount)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Thành tiền:</span>
                            <span className="text-primary">{formatCurrency(currentStatementDetail.total)}</span>
                          </div>
                        </div>

                        {/* Period Display */}
                        <div className="mt-4 text-xs text-muted-foreground">
                          Kỳ: {new Date(currentStatementDetail.periodStart).toLocaleDateString('vi-VN')} → {new Date(currentStatementDetail.periodEnd).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có dữ liệu chi tiết</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có bảng kê cho tháng {selectedMonth}/{selectedYear}</p>
                    <Button className="mt-4" variant="outline">
                      Tạo bảng kê mới
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chọn một công ty để xem bảng kê</p>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
