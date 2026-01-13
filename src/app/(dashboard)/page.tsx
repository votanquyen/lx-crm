/**
 * Dashboard Page - Finance First Redesign
 * Tailored for Owner/Accountant persona
 */
import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Receipt,
  RefreshCcw,
  Calendar,
} from "lucide-react";
import { getFinancialKPIs, getBillingActionItems } from "@/actions/dashboard-billing";
import { getGlobalNotes } from "@/actions/sticky-notes";
import { getTodaySchedule } from "@/actions/care-schedules";
import { DashboardStickyNote } from "@/components/dashboard";
import { BillingActionCenter } from "@/components/dashboard/billing-action-center";
import { FinancialStats } from "@/components/dashboard/financial-kpis";
import { cn } from "@/lib/utils";

// --- Wrapper Components for Suspense ---

async function FinancialStatsWrapper() {
  const kpis = await getFinancialKPIs();
  return <FinancialStats data={kpis} />;
}

async function ActionCenterWrapper() {
  const actions = await getBillingActionItems();
  return <BillingActionCenter data={actions} />;
}

async function TodaySchedulesWrapper() {
  const schedules = await getTodaySchedule();

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-slate-50/30 rounded-lg border border-dashed">
        <Calendar className="mx-auto h-8 w-8 mb-2 opacity-30" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Không có lịch trình</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border/50">
      {schedules.slice(0, 5).map((schedule) => (
        <div
          key={schedule.id}
          className="data-table-row flex items-center justify-between py-3 px-1"
        >
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/customers/${schedule.customer.id}`}
              className="text-sm font-bold text-slate-800 hover:text-primary transition-colors"
            >
              {schedule.customer.companyName}
            </Link>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              <span>{schedule.customer.district}</span>
              <span>•</span>
              <span>
                {schedule.scheduledTime ? new Date(schedule.scheduledTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Chưa xác định"}
              </span>
            </div>
          </div>
          <div className={cn(
            "status-badge",
            schedule.status === "IN_PROGRESS"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200"
          )}>
            {schedule.status === "IN_PROGRESS" ? "Đang làm" : "Đã lên lịch"}
          </div>
        </div>
      ))}
      {schedules.length > 5 && (
        <Link
          href="/care"
          className="mt-3 text-center text-[10px] font-bold text-primary hover:text-primary/80 tracking-widest uppercase transition-colors py-2 bg-slate-50 rounded"
        >
          Xem thêm {schedules.length - 5} lịch khác
        </Link>
      )}
    </div>
  );
}

async function StickyNoteWrapper() {
  const notes = await getGlobalNotes(10);
  return <DashboardStickyNote initialNotes={notes} />;
}

export default async function DashboardPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-end justify-between border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Tổng quan tài chính
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Theo dõi dòng tiền, công nợ và các tác vụ hóa đơn quan trọng.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white shadow-sm rounded-md text-slate-900">Tài chính</span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">Vận hành</span>
        </div>
      </div>

      {/* 1. Top Row: Financial KPIs */}
      <Suspense fallback={<KPIsSkeleton />}>
        <FinancialStatsWrapper />
      </Suspense>

      {/* 2. Middle Row: Action Center & Operations Pulse */}
      <div className="grid gap-6 lg:grid-cols-3 min-h-[400px]">
        {/* Action Center - Takes up 2/3 space */}
        <div className="lg:col-span-2 shadow-sm rounded-xl">
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
            <ActionCenterWrapper />
          </Suspense>
        </div>

        {/* Right Column: Quick Ops & Sticky Notes */}
        <div className="space-y-6">
          {/* Operations Snapshot */}
          <div className="enterprise-card bg-white h-auto">
            <div className="border-b px-4 py-3 bg-slate-50/50">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <Calendar className="h-3.5 w-3.5" />
                Tiến độ vận hành
              </h3>
            </div>
            <div className="p-4">
              <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <TodaySchedulesWrapper />
              </Suspense>
            </div>
          </div>

          {/* AI Sticky Note */}
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-xl" />}>
            <StickyNoteWrapper />
          </Suspense>
        </div>
      </div>

      {/* 3. Bottom Row: Quick Actions */}
      <div className="enterprise-card p-5 bg-gradient-to-r from-slate-50 to-white">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lối tắt nghiệp vụ</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/invoices/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="p-2.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Xuất hóa đơn</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">VAT & Dịch vụ</p>
            </div>
          </Link>

          <Link
            href="/contracts/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="p-2.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Hợp đồng mới</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Soạn thảo</p>
            </div>
          </Link>

          <Link
            href="/customers/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="p-2.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Khách hàng</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Thêm đối tác</p>
            </div>
          </Link>

          <Link
            href="/exchanges"
            className="flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 group"
          >
            <div className="p-2.5 rounded-md bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Đổi cây</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Yêu cầu mới</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function KPIsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="enterprise-card p-5 h-32">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}
