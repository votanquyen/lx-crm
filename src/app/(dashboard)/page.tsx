/**
 * Dashboard Page with Real Data
 */
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && trendValue && (
            <span
              className={trend === "up" ? "text-green-600 flex items-center" : "text-red-600 flex items-center"}
            >
              {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
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
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>Không có lịch chăm sóc hôm nay</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.slice(0, 5).map((schedule) => (
        <div
          key={schedule.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <Link
              href={`/customers/${schedule.customer.id}`}
              className="font-medium hover:underline"
            >
              {schedule.customer.companyName}
            </Link>
            <p className="text-sm text-muted-foreground">
              {schedule.customer.district} • {schedule.scheduledTime ? new Date(schedule.scheduledTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Chưa xác định giờ"}
            </p>
          </div>
          <Badge
            variant={schedule.status === "IN_PROGRESS" ? "default" : "secondary"}
          >
            {schedule.status === "IN_PROGRESS" ? "Đang thực hiện" : "Đã lên lịch"}
          </Badge>
        </div>
      ))}
      {schedules.length > 5 && (
        <Link
          href="/care"
          className="block text-center text-sm text-primary hover:underline"
        >
          Xem thêm {schedules.length - 5} lịch khác
        </Link>
      )}
    </div>
  );
}

async function AlertsSection() {
  const [expiringContracts, overdueInvoices, recentNotes] = await Promise.all([
    getExpiringContracts(14),
    getOverdueInvoices(5),
    getRecentNotes(5),
  ]);

  const urgentNotes = recentNotes.filter((n) => n.category === "URGENT");

  if (expiringContracts.length === 0 && overdueInvoices.length === 0 && urgentNotes.length === 0) {
    return null;
  }

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
            <p className="font-medium text-sm mb-2">
              Hợp đồng sắp hết hạn ({expiringContracts.length})
            </p>
            <div className="space-y-2">
              {expiringContracts.slice(0, 3).map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  • {contract.customer.companyName} - {contract.contractNumber}
                </Link>
              ))}
            </div>
          </div>
        )}
        {overdueInvoices.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-2 text-red-600">
              Hóa đơn quá hạn ({overdueInvoices.length})
            </p>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  • {invoice.customer.companyName} - {new Intl.NumberFormat("vi-VN").format(Number(invoice.outstandingAmount))} VND
                </Link>
              ))}
            </div>
          </div>
        )}
        {urgentNotes.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-2 text-orange-600">
              Ghi chú khẩn cấp ({urgentNotes.length})
            </p>
            <div className="space-y-2">
              {urgentNotes.slice(0, 3).map((note) => (
                <Link
                  key={note.id}
                  href={`/customers/${note.customer.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  • {note.customer.companyName}: {note.content.substring(0, 50)}...
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function RecentNotesSection() {
  const notes = await getRecentNotes(5);

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <StickyNote className="mx-auto h-8 w-8 mb-2 opacity-50" />
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
          <div className="flex-1 min-w-0">
            <Link
              href={`/customers/${note.customer.id}`}
              className="font-medium text-sm hover:underline"
            >
              {note.customer.companyName}
            </Link>
            <p className="text-sm text-muted-foreground truncate">{note.content}</p>
          </div>
          <Badge variant={note.category === "URGENT" ? "destructive" : "secondary"}>
            {note.category}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Xin chào, {session?.user?.name?.split(" ").pop() || "Bạn"}!
        </h1>
        <p className="text-muted-foreground">
          Đây là tổng quan hoạt động kinh doanh hôm nay.
        </p>
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

      {/* Alerts */}
      <Suspense fallback={null}>
        <AlertsSection />
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

        {/* Recent Notes */}
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
              <RecentNotesSection />
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
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Thêm khách hàng</p>
                <p className="text-xs text-muted-foreground">Tạo khách hàng mới</p>
              </div>
            </Link>
            <Link
              href="/contracts/new"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Tạo hợp đồng</p>
                <p className="text-xs text-muted-foreground">Soạn hợp đồng mới</p>
              </div>
            </Link>
            <Link
              href="/invoices/new"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <Receipt className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Xuất hóa đơn</p>
                <p className="text-xs text-muted-foreground">Tạo hóa đơn thanh toán</p>
              </div>
            </Link>
            <Link
              href="/exchanges"
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <RefreshCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Đổi cây</p>
                <p className="text-xs text-muted-foreground">Xử lý yêu cầu đổi cây</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
