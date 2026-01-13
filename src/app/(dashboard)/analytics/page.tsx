/**
 * Analytics Dashboard Page
 * Main analytics and reporting interface
 */
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  getRevenueOverview,
  getMonthlyRevenue,
  getInvoiceAnalytics,
  getInvoiceAging,
  getCustomerAnalytics,
  getContractAnalytics,
  getTopCustomers,
} from "@/actions/reports";
// Dynamic import to reduce initial bundle size (recharts is large)
const RevenueDashboard = dynamic(
  () => import("@/components/analytics/revenue-dashboard").then(mod => ({ default: mod.RevenueDashboard })),
  { loading: () => <div className="h-[400px] animate-pulse bg-muted rounded-lg" /> }
);
const InvoiceAging = dynamic(
  () => import("@/components/analytics/invoice-aging").then(mod => ({ default: mod.InvoiceAging })),
  { loading: () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" /> }
);
import { AnalyticsExportButtons } from "@/components/analytics/export-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Báo cáo & Phân tích | Lộc Xanh CRM",
  description: "Tổng quan doanh thu, khách hàng, hóa đơn và hợp đồng",
};

async function RevenueSection() {
  const [overview, monthlyData] = await Promise.all([
    getRevenueOverview(),
    getMonthlyRevenue(),
  ]);

  return (
    <RevenueDashboard
      overview={overview}
      monthlyData={monthlyData}
    />
  );
}

async function InvoiceSection() {
  const [analytics, aging] = await Promise.all([
    getInvoiceAnalytics(),
    getInvoiceAging(),
  ]);

  return (
    <InvoiceAging
      analytics={analytics}
      aging={aging}
    />
  );
}

async function CustomerSection() {
  const [analytics, customers] = await Promise.all([
    getCustomerAnalytics(),
    getTopCustomers(),
  ]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Customer Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng hoạt động</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đang sử dụng dịch vụ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng mới</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tháng này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị trọn đời TB</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.avgLifetimeValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trung bình mỗi khách hàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ rời bỏ</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Khách hàng chấm dứt dịch vụ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 khách hàng theo doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã KH</TableHead>
                <TableHead>Tên công ty</TableHead>
                <TableHead className="text-right">Tổng doanh thu</TableHead>
                <TableHead className="text-right">Phí hàng tháng</TableHead>
                <TableHead className="text-right">Số hóa đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Chưa có dữ liệu khách hàng
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.code}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.companyName}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.monthlyFee)}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.invoiceCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

async function ContractSection() {
  const analytics = await getContractAnalytics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hợp đồng hoạt động</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.activeCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Đang có hiệu lực
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {analytics.expiringSoon}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Trong 30 ngày tới
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Thời hạn trung bình</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.avgDuration}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tháng
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tỷ lệ gia hạn</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.renewalRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Khách hàng gia hạn hợp đồng
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Báo cáo & Phân tích
          </h2>
          <p className="text-muted-foreground">
            Tổng quan doanh thu, khách hàng, hóa đơn và hợp đồng
          </p>
        </div>
        <AnalyticsExportButtons />
      </div>

      {/* Revenue Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Doanh thu
        </h3>
        <Suspense fallback={<LoadingSkeleton />}>
          <RevenueSection />
        </Suspense>
      </div>

      {/* Invoice Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Hóa đơn & Công nợ
        </h3>
        <Suspense fallback={<LoadingSkeleton />}>
          <InvoiceSection />
        </Suspense>
      </div>

      {/* Customer Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Khách hàng
        </h3>
        <Suspense fallback={<LoadingSkeleton />}>
          <CustomerSection />
        </Suspense>
      </div>

      {/* Contract Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Hợp đồng
        </h3>
        <Suspense fallback={<LoadingSkeleton />}>
          <ContractSection />
        </Suspense>
      </div>
    </div>
  );
}
