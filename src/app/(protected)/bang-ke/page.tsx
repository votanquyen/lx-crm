"use client";

import { useState, useEffect } from "react";
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
import { getMonthlyStatements, getCustomersForStatements } from "@/actions/monthly-statements";
import type { StatementListItem } from "@/types/monthly-statement";
import { formatCurrency } from "@/lib/format";
import { getMonthShort } from "@/lib/statement-utils";

export default function BangKePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statements, setStatements] = useState<StatementListItem[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Load statements when filters change
  useEffect(() => {
    loadStatements();
  }, [selectedYear]);

  async function loadCustomers() {
    try {
      const result = await getCustomersForStatements();
      if (result.success && result.data) {
        setCustomers(result.data);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }

  async function loadStatements() {
    try {
      const result = await getMonthlyStatements({
        year: selectedYear,
        limit: 100,
        offset: 0,
      });
      if (result.success && result.data) {
        setStatements(result.data.items || []);
      }
    } catch (error) {
      console.error("Failed to load statements:", error);
    }
  }

  // Filter customers by search
  const filteredCustomers = customers.filter((c) =>
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter statements for selected customer and month
  const customerStatements = selectedCustomerId
    ? statements.filter((s) => s.customerId === selectedCustomerId)
    : [];

  const currentStatement = customerStatements.find(
    (s) => s.month === selectedMonth
  );

  // Years selector (current - 2 to current + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);

  // Months array
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-180px)]">
            {filteredCustomers.map((customer) => {
              const customerStmts = statements.filter(
                (s) => s.customerId === customer.id
              );
              const hasUnconfirmed = customerStmts.some((s) => s.needsConfirmation);
              const monthlyTotal = customerStmts.find(
                (s) => s.month === new Date().getMonth() + 1
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
                          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </Button>
                  <Button variant="outline" size="sm">
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
                        <Button size="sm" className="mt-3">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Xác nhận
                        </Button>
                      </div>
                    )}

                    <div className="text-center text-muted-foreground py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Bảng chi tiết cây đang được phát triển...</p>
                    </div>
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
    </div>
  );
}
