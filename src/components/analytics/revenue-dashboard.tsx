/**
 * Revenue Dashboard Widget
 * Displays revenue overview with stats cards and monthly trend chart
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface RevenueData {
  totalRevenue: number;
  ytdRevenue: number;
  mtdRevenue: number;
  revenueGrowth: number;
  avgContractValue: number;
}

interface MonthlyData {
  month: string;
  amount: number;
}

interface RevenueDashboardProps {
  overview: RevenueData;
  monthlyData: MonthlyData[];
}

export function RevenueDashboard({ overview, monthlyData }: RevenueDashboardProps) {
  const isGrowthPositive = overview.revenueGrowth >= 0;

  return (
    <div className="space-y-6">
      {/* Revenue Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Tất cả các hóa đơn đã thanh toán</p>
          </CardContent>
        </Card>

        {/* YTD Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu năm nay</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.ytdRevenue)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Từ đầu năm đến nay</p>
          </CardContent>
        </Card>

        {/* MTD Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.mtdRevenue)}</div>
            <div className="mt-1 flex items-center text-xs">
              {isGrowthPositive ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={isGrowthPositive ? "text-green-500" : "text-red-500"}>
                {Math.abs(overview.revenueGrowth)}%
              </span>
              <span className="text-muted-foreground ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Contract Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị hợp đồng TB</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.avgContractValue)}</div>
            <p className="text-muted-foreground mt-1 text-xs">Trung bình mỗi hợp đồng/tháng</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 12 tháng gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Doanh thu"]}
                labelStyle={{ color: "#000" }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
