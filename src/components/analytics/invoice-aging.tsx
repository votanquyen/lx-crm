/**
 * Invoice Aging Widget
 * Displays overdue invoices and aging buckets
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface AgingBucket {
  range: string;
  count: number;
  amount: number;
}

interface InvoiceAnalytics {
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  collectionRate: number;
  avgDaysToPayment: number;
}

interface InvoiceAgingProps {
  analytics: InvoiceAnalytics;
  aging: AgingBucket[];
}

export function InvoiceAging({ analytics, aging }: InvoiceAgingProps) {
  const getAgingColor = (range: string) => {
    if (range.includes("0-30")) return "bg-green-100 text-green-800";
    if (range.includes("31-60")) return "bg-yellow-100 text-yellow-800";
    if (range.includes("61-90")) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Invoice Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Outstanding */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa thanh toán</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.outstandingAmount)}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {analytics.outstandingCount} hóa đơn
            </p>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(analytics.overdueAmount)}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{analytics.overdueCount} hóa đơn</p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thu hồi</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.collectionRate.toFixed(1)}%</div>
            <p className="text-muted-foreground mt-1 text-xs">Đã thu / Tổng phát hành</p>
          </CardContent>
        </Card>

        {/* Avg Days to Payment */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian thanh toán TB</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgDaysToPayment} ngày</div>
            <p className="text-muted-foreground mt-1 text-xs">
              Trung bình từ phát hành đến thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Báo cáo phân loại công nợ theo thời gian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khoảng thời gian</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Mức độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aging.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    Không có công nợ chưa thanh toán
                  </TableCell>
                </TableRow>
              ) : (
                aging.map((bucket) => (
                  <TableRow key={bucket.range}>
                    <TableCell className="font-medium">{bucket.range}</TableCell>
                    <TableCell className="text-right">{bucket.count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(bucket.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getAgingColor(bucket.range)} variant="outline">
                        {bucket.range.includes("0-30") && "Bình thường"}
                        {bucket.range.includes("31-60") && "Cảnh báo"}
                        {bucket.range.includes("61-90") && "Nghiêm trọng"}
                        {bucket.range.includes("90+") && "Khẩn cấp"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {analytics.overdueCount > 0 && (
            <div className="mt-4 flex justify-end">
              <Link
                href="/invoices?status=OVERDUE"
                className="text-sm text-blue-600 hover:underline"
              >
                Xem chi tiết {analytics.overdueCount} hóa đơn quá hạn →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
