/**
 * Dashboard Page with Real Data
 */
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Leaf,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCcw,
  AlertTriangle,
  StickyNote,
} from "lucide-react";
import { getCustomerStats } from "@/actions/customers";
import { getContractStats, getExpiringContracts } from "@/actions/contracts";
import { getInvoiceStats, getOverdueInvoices } from "@/actions/invoices";
import { getTodaySchedule } from "@/actions/care-schedules";
import { getRecentNotes } from "@/actions/sticky-notes";
import { formatCurrencyDecimal } from "@/lib/db-utils";

// Stats Card Component
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>{value}</div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {trend && trendValue && (
            <span
              className={
                trend === "up"
                  ? "flex items-center text-green-600"
                  : "flex items-center text-red-600"
              }
            >
              {trend === "up" ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trendValue}
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

async function DashboardStats() {
  const [customerStats, contractStats, invoiceStats] = await Promise.all([
    getCustomerStats(),
    getContractStats(),
    getInvoiceStats(),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Khách hàng"
        value={customerStats.total.toString()}
        description={`${customerStats.active} đang hoạt động`}
        icon={Users}
      />
      <StatsCard
        title="Hợp đồng"
        value={contractStats.active.toString()}
        description={`${contractStats.expiringSoon} sắp hết hạn`}
        icon={FileText}
        color={contractStats.expiringSoon > 0 ? "text-orange-600" : undefined}
      />
      <StatsCard
        title="Doanh thu định kỳ"
        value={formatCurrencyDecimal(contractStats.monthlyRecurring)}
        description="mỗi tháng"
        icon={Leaf}
        color="text-green-600"
      />
      <StatsCard
        title="Công nợ"
        value={formatCurrencyDecimal(invoiceStats.totalReceivables)}
        description={`${invoiceStats.overdue} quá hạn`}
        icon={Receipt}
        color={invoiceStats.overdue > 0 ? "text-red-600" : undefined}
      />
    </div>
  );
}

async function TodaySchedules() {
  const schedules = await getTodaySchedule();

  if (schedules.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Không có lịch chăm sóc hôm nay</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.slice(0, 5).map((schedule) => (
        <div key={schedule.id} className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Link
              href={`/customers/${schedule.customer.id}`}
              className="font-medium hover:underline"
            >
              {schedule.customer.companyName}
            </Link>
            <p className="text-muted-foreground text-sm">
              {schedule.customer.district} •{" "}
              {schedule.scheduledTime
                ? new Date(schedule.scheduledTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Chưa xác định giờ"}
            </p>
          </div>
          <Badge variant={schedule.status === "IN_PROGRESS" ? "default" : "secondary"}>
            {schedule.status === "IN_PROGRESS" ? "Đang thực hiện" : "Đã lên lịch"}
          </Badge>
        </div>
      ))}
      {schedules.length > 5 && (
        <Link href="/care" className="text-primary block text-center text-sm hover:underline">
          Xem thêm {schedules.length - 5} lịch khác
        </Link>
      )}
    </div>
  );
}

/**
 * Display component for recent notes (receives pre-fetched data)
 */
function RecentNotesDisplay({ notes }: { notes: Awaited<ReturnType<typeof getRecentNotes>> }) {
  if (notes.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <StickyNote className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Không có ghi chú nào cần xử lý</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div key={note.id} className="flex items-start gap-3">
          <div
            className={`rounded-full p-2 ${
              note.category === "URGENT"
                ? "bg-red-100 text-red-600"
                : note.category === "COMPLAINT"
                  ? "bg-orange-100 text-orange-600"
                  : "bg-muted"
            }`}
          >
            <StickyNote className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/customers/${note.customer.id}`}
              className="text-sm font-medium hover:underline"
            >
              {note.customer.companyName}
            </Link>
            <p className="text-muted-foreground truncate text-sm">{note.content}</p>
          </div>
          <Badge variant={note.category === "URGENT" ? "destructive" : "secondary"}>
            {note.category}
          </Badge>
        </div>
      ))}
    </div>
  );
}

/**
 * Wrapper for Alerts that only fetches expiring contracts and overdue invoices
 * Notes are fetched separately by RecentNotesWrapper
 */
async function AlertsAndNotesWrapper() {
  const [expiringContracts, overdueInvoices] = await Promise.all([
    getExpiringContracts(14),
    getOverdueInvoices(5),
  ]);

  const hasAlerts = expiringContracts.length > 0 || overdueInvoices.length > 0;

  if (!hasAlerts) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Cảnh báo cần xử lý
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiringContracts.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">
              Hợp đồng sắp hết hạn ({expiringContracts.length})
            </p>
            <div className="space-y-2">
              {expiringContracts.slice(0, 3).map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="text-muted-foreground hover:text-foreground block text-sm"
                >
                  • {contract.customer.companyName} - {contract.contractNumber}
                </Link>
              ))}
            </div>
          </div>
        )}
        {overdueInvoices.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-red-600">
              Hóa đơn quá hạn ({overdueInvoices.length})
            </p>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="text-muted-foreground hover:text-foreground block text-sm"
                >
                  • {invoice.customer.companyName} -{" "}
                  {new Intl.NumberFormat("vi-VN").format(Number(invoice.outstandingAmount))} VND
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper for recent notes section
 */
async function RecentNotesWrapper() {
  const notes = await getRecentNotes(5);
  return <RecentNotesDisplay notes={notes} />;
}

export default async function DashboardPage() {
  // Note: auth() is already called in layout.tsx - no need to duplicate here

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Xin chào!</h1>
        <p className="text-muted-foreground">Đây là tổng quan hoạt động kinh doanh hôm nay.</p>
      </div>

      {/* Stats Grid */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <DashboardStats />
      </Suspense>

      {/* Alerts and Notes - Single data fetch for both sections */}
      <Suspense fallback={null}>
        <AlertsAndNotesWrapper />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lịch chăm sóc hôm nay
            </CardTitle>
            <CardDescription>Các lịch cần thực hiện trong ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              }
            >
              <TodaySchedules />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Notes - Now part of AlertsAndNotesData above */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Ghi chú cần xử lý
            </CardTitle>
            <CardDescription>Các ghi chú từ khách hàng đang mở</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              }
            >
              <RecentNotesWrapper />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link
              href="/customers/new"
              className="hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <Users className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Thêm khách hàng</p>
                <p className="text-muted-foreground text-xs">Tạo khách hàng mới</p>
              </div>
            </Link>
            <Link
              href="/contracts/new"
              className="hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <FileText className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Tạo hợp đồng</p>
                <p className="text-muted-foreground text-xs">Soạn hợp đồng mới</p>
              </div>
            </Link>
            <Link
              href="/invoices/new"
              className="hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <Receipt className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Xuất hóa đơn</p>
                <p className="text-muted-foreground text-xs">Tạo hóa đơn thanh toán</p>
              </div>
            </Link>
            <Link
              href="/exchanges"
              className="hover:bg-accent flex items-center gap-3 rounded-lg border p-4 transition-colors"
            >
              <RefreshCcw className="text-primary h-5 w-5" />
              <div>
                <p className="font-medium">Đổi cây</p>
                <p className="text-muted-foreground text-xs">Xử lý yêu cầu đổi cây</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
