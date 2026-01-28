import { SummaryCard } from "@/components/invoices/summary-card";
import { getInvoiceStats } from "@/actions/invoices";

export async function InvoiceStatsEnhanced() {
  const stats = await getInvoiceStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Invoices */}
      <SummaryCard
        title="Tổng hóa đơn"
        value={stats.total}
        icon="receipt"
        iconColor="text-slate-600"
        iconBgColor="bg-slate-100"
        href="/invoices"
      />

      {/* Pending */}
      <SummaryCard
        title="Chờ thanh toán"
        value={stats.pending}
        subtitle={formatCurrency(Number(stats.pendingAmount || 0))}
        icon="clock"
        iconColor="text-amber-600"
        iconBgColor="bg-amber-50"
        textColor="text-amber-600"
        href="/invoices?status=SENT"
        badge={stats.pending > 0 ? stats.pending : undefined}
      />

      {/* Overdue */}
      <SummaryCard
        title="Quá hạn"
        value={stats.overdue}
        subtitle={formatCurrency(Number(stats.overdueAmount))}
        icon="alert-triangle"
        iconColor="text-rose-600"
        iconBgColor="bg-rose-100"
        textColor="text-rose-600"
        bgColor="bg-rose-50/50"
        borderColor="border-rose-100"
        href="/invoices?overdueOnly=true"
        badge={stats.overdue > 0 ? stats.overdue : undefined}
      />

      {/* Total Receivables */}
      <SummaryCard
        title="Tổng phải thu"
        value={formatCurrency(Number(stats.totalReceivables))}
        icon="dollar-sign"
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        textColor="text-blue-600"
        bgColor="bg-blue-50/50"
        borderColor="border-blue-100"
      />
    </div>
  );
}
