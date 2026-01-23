/**
 * Dashboard Page - Finance First Redesign
 * Tailored for Owner/Accountant persona
 */
import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, Receipt, RefreshCcw, Calendar } from "lucide-react";
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
      <div className="text-muted-foreground rounded-lg border border-dashed bg-slate-50/30 py-12 text-center">
        <Calendar className="mx-auto mb-2 h-8 w-8 opacity-30" aria-hidden="true" />
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Không có lịch trình
        </p>
      </div>
    );
  }

  return (
    <div className="divide-border/50 flex flex-col divide-y">
      {schedules.slice(0, 5).map((schedule) => (
        <div
          key={schedule.id}
          className="data-table-row flex items-center justify-between px-1 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/customers/${schedule.customer.id}`}
              className="hover:text-primary text-sm font-bold text-slate-800 transition-colors"
            >
              {schedule.customer.companyName}
            </Link>
            <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-medium">
              <span>{schedule.customer.district}</span>
              <span>•</span>
              <span>
                {schedule.scheduledTime
                  ? new Date(schedule.scheduledTime).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Chưa xác định"}
              </span>
            </div>
          </div>
          <div
            className={cn(
              "status-badge",
              schedule.status === "IN_PROGRESS"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            )}
          >
            {schedule.status === "IN_PROGRESS" ? "Đang làm" : "Đã lên lịch"}
          </div>
        </div>
      ))}
      {schedules.length > 5 && (
        <Link
          href="/care"
          className="text-primary hover:text-primary/80 mt-3 rounded bg-slate-50 py-2 text-center text-[10px] font-bold tracking-widest uppercase transition-colors"
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Tổng quan tài chính</h1>
          <p className="text-sm font-medium text-slate-500">
            Theo dõi dòng tiền, công nợ và các tác vụ hóa đơn quan trọng.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg bg-slate-100 p-1 md:flex">
          <span className="rounded-md bg-white px-3 py-1 text-[10px] font-bold tracking-widest text-slate-900 uppercase shadow-sm">
            Tài chính
          </span>
          <span className="cursor-pointer px-3 py-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-slate-600">
            Vận hành
          </span>
        </div>
      </div>

      {/* 1. Top Row: Financial KPIs */}
      <Suspense fallback={<KPIsSkeleton />}>
        <FinancialStatsWrapper />
      </Suspense>

      {/* 2. Middle Row: Action Center & Operations Pulse */}
      <div className="grid min-h-[400px] gap-6 lg:grid-cols-3">
        {/* Action Center - Takes up 2/3 space */}
        <div className="rounded-xl shadow-sm lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
            <ActionCenterWrapper />
          </Suspense>
        </div>

        {/* Right Column: Quick Ops & Sticky Notes */}
        <div className="space-y-6">
          {/* Operations Snapshot */}
          <div className="enterprise-card h-auto bg-white">
            <div className="border-b bg-slate-50/50 px-4 py-3">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-600 uppercase">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
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
      <div className="enterprise-card bg-gradient-to-r from-slate-50 to-white p-5">
        <h3 className="mb-4 text-xs font-black tracking-widest text-slate-400 uppercase">
          Lối tắt nghiệp vụ
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/invoices"
            className="hover:border-primary/40 group flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="rounded-md border border-blue-100 bg-blue-50 p-2.5 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <Receipt className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm leading-tight font-bold text-slate-900">Theo dõi Hóa đơn</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">SmartVAS</p>
            </div>
          </Link>

          <Link
            href="/contracts/new"
            className="hover:border-primary/40 group flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm leading-tight font-bold text-slate-900">Hợp đồng mới</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Soạn thảo</p>
            </div>
          </Link>

          <Link
            href="/customers/new"
            className="hover:border-primary/40 group flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="rounded-md border border-amber-100 bg-amber-50 p-2.5 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm leading-tight font-bold text-slate-900">Khách hàng</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Thêm đối tác</p>
            </div>
          </Link>

          <Link
            href="/exchanges"
            className="hover:border-primary/40 group flex items-center gap-3 rounded-lg border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="rounded-md border border-purple-100 bg-purple-50 p-2.5 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <RefreshCcw className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm leading-tight font-bold text-slate-900">Đổi cây</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">Yêu cầu mới</p>
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
        <div key={i} className="enterprise-card h-32 p-5">
          <Skeleton className="mb-4 h-4 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}
