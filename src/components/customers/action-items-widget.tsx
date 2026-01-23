"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileText,
  Receipt,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate: Date;
  totalAmount: number | { toNumber(): number };
  outstandingAmount: number | { toNumber(): number };
}

interface ActionItemsWidgetProps {
  invoices: Invoice[];
  contractsCount: number;
  contractExpiringDays?: number;
  exchangeRequestsCount?: number;
  urgentNotesCount?: number;
  customerId: string;
}

function getAmount(value: number | { toNumber(): number }): number {
  return typeof value === "number" ? value : value.toNumber();
}

export function ActionItemsWidget({
  invoices,
  exchangeRequestsCount = 0,
  urgentNotesCount = 0,
  customerId,
}: ActionItemsWidgetProps) {
  // Filter overdue invoices
  const now = new Date();
  const overdueInvoices = invoices.filter((inv) => {
    const dueDate = new Date(inv.dueDate);
    return (
      (inv.status === "OVERDUE" ||
        (dueDate < now && !["PAID", "CANCELLED"].includes(inv.status))) &&
      getAmount(inv.outstandingAmount) > 0
    );
  });

  // Calculate total overdue amount
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + getAmount(inv.outstandingAmount),
    0
  );

  const hasActions =
    overdueInvoices.length > 0 || exchangeRequestsCount > 0 || urgentNotesCount > 0;

  if (!hasActions) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            Cần xử lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-center">
            <div className="text-muted-foreground text-sm">
              <span className="font-bold text-emerald-600">✓ Tất cả đã xử lý!</span>
              <p className="mt-1 text-xs">Không có hóa đơn quá hạn hay yêu cầu chờ.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-rose-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="h-4 w-4 text-rose-500" aria-hidden="true" />
          Cần xử lý ngay
          <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
            {overdueInvoices.length + exchangeRequestsCount + urgentNotesCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overdue Invoices */}
        {overdueInvoices.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold tracking-wider text-rose-600 uppercase">
                <Receipt className="h-3 w-3" aria-hidden="true" />
                Hóa đơn quá hạn ({overdueInvoices.length})
              </span>
              <span className="text-sm font-black text-rose-600">
                {formatCurrency(totalOverdue)}
              </span>
            </div>
            <div className="space-y-1.5">
              {overdueInvoices.slice(0, 3).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="group flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/50 p-2 transition-colors hover:bg-rose-50"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                    <span className="text-xs font-bold text-slate-700">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-rose-500">
                      {formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600">
                      {formatCurrency(getAmount(inv.outstandingAmount))}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-rose-500" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
            {overdueInvoices.length > 3 && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Link href={`/invoices?customerId=${customerId}&status=OVERDUE`}>
                  Xem tất cả {overdueInvoices.length} hóa đơn quá hạn
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Exchange Requests */}
        {exchangeRequestsCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-700">Yêu cầu đổi cây</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600">
                {exchangeRequestsCount} chờ xử lý
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Urgent Notes */}
        {urgentNotesCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/50 p-2">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
              <span className="text-xs font-bold text-slate-700">Ghi chú khẩn cấp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600">
                {urgentNotesCount} chưa xử lý
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
