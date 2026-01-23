"use client";

import { formatCurrency } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  PiggyBank,
  AlertCircle,
} from "lucide-react";
import type { getFinancialKPIs } from "@/actions/dashboard-billing";

type KPI = Awaited<ReturnType<typeof getFinancialKPIs>>;

export function FinancialStats({ data }: { data: KPI }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Cash In Hand Card */}
      <div className="enterprise-card border-l-4 border-l-emerald-500 bg-white p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="kpi-title text-slate-500">Thực thu (Tháng này)</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              {formatCurrency(data.cashInHand.value)}
            </h3>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {data.cashInHand.trend === "up" ? (
            <span className="flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-600">
              <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" />+{formatCurrency(data.cashInHand.diff)}
            </span>
          ) : (
            <span className="flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-600">
              <TrendingDown className="mr-1 h-3 w-3" aria-hidden="true" />-{formatCurrency(data.cashInHand.diff)}
            </span>
          )}
          <span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">
            So với tháng trước
          </span>
        </div>
      </div>

      {/* Accounts Receivable Card */}
      <div className="enterprise-card border-l-4 border-l-rose-500 bg-white p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="kpi-title text-slate-500">Công nợ phải thu</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-rose-600">
              {formatCurrency(data.receivables.value)}
            </h3>
          </div>
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
            <PiggyBank className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-600">
            <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
            Cần chú ý
          </span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">
            Bao gồm quá hạn
          </span>
        </div>
      </div>

      {/* Unbilled Revenue Card */}
      <div className="enterprise-card border-l-4 border-l-blue-500 bg-white p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="kpi-title text-slate-500">Doanh thu chưa xuất đơn</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-blue-600">
              {formatCurrency(data.unbilled.value)}
            </h3>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <ArrowRightLeft className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-600">
            Đã duyệt bảng kê
          </span>
          <span className="text-muted-foreground text-[10px] font-medium tracking-tight uppercase">
            Ước tính
          </span>
        </div>
      </div>
    </div>
  );
}
