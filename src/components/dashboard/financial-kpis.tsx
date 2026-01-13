"use client";

import { formatCurrency } from "@/lib/format";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    PiggyBank,
    AlertCircle
} from "lucide-react";
import type { getFinancialKPIs } from "@/actions/dashboard-billing";

type KPI = Awaited<ReturnType<typeof getFinancialKPIs>>;

export function FinancialStats({ data }: { data: KPI }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Cash In Hand Card */}
            <div className="enterprise-card p-5 bg-white border-l-4 border-l-emerald-500">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="kpi-title text-slate-500">Thực thu (Tháng này)</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                            {formatCurrency(data.cashInHand.value)}
                        </h3>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Wallet className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    {data.cashInHand.trend === 'up' ? (
                        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{formatCurrency(data.cashInHand.diff)}
                        </span>
                    ) : (
                        <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            -{formatCurrency(data.cashInHand.diff)}
                        </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">So với tháng trước</span>
                </div>
            </div>

            {/* Accounts Receivable Card */}
            <div className="enterprise-card p-5 bg-white border-l-4 border-l-rose-500">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="kpi-title text-slate-500">Công nợ phải thu</p>
                        <h3 className="text-2xl font-black text-rose-600 mt-1 tracking-tight">
                            {formatCurrency(data.receivables.value)}
                        </h3>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <PiggyBank className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Cần chú ý
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Bao gồm quá hạn</span>
                </div>
            </div>

            {/* Unbilled Revenue Card */}
            <div className="enterprise-card p-5 bg-white border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="kpi-title text-slate-500">Doanh thu chưa xuất đơn</p>
                        <h3 className="text-2xl font-black text-blue-600 mt-1 tracking-tight">
                            {formatCurrency(data.unbilled.value)}
                        </h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <ArrowRightLeft className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Đã chốt bảng kê
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Ước tính</span>
                </div>
            </div>
        </div>
    );
}
