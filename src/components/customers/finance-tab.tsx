"use client";

import Link from "next/link";
import { Receipt, ChevronRight, ExternalLink, Gavel } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { CustomerStatementsTable } from "./customer-statements-table";
import type { InvoiceStatus } from "@prisma/client";

type DecimalLike = { toString(): string } | number | string;
type DateOrString = Date | string;

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: DateOrString;
  dueDate: DateOrString;
  totalAmount: DecimalLike;
  paidAmount: DecimalLike;
  outstandingAmount: DecimalLike;
}

interface FinanceTabProps {
  customerId: string;
  invoices: CustomerInvoice[];
  contractsCount: number;
}

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  DRAFT: { label: "Nháp", color: "bg-slate-100 text-slate-600 border-slate-200" },
  SENT: { label: "Đã gửi", color: "bg-blue-50 text-blue-600 border-blue-200" },
  PAID: { label: "Đã TT", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  OVERDUE: { label: "Quá hạn", color: "bg-rose-50 text-rose-600 border-rose-200" },
  CANCELLED: { label: "Hủy", color: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  PARTIAL: { label: "TT 1 phần", color: "bg-amber-50 text-amber-600 border-amber-200" },
  REFUNDED: { label: "Hoàn tiền", color: "bg-purple-50 text-purple-600 border-purple-200" },
};

function getDecimalNumber(value: DecimalLike): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return parseFloat(value.toString());
}

export function FinanceTab({ customerId, invoices, contractsCount }: FinanceTabProps) {
  // Sort invoices by date (newest first) and take recent 5
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  // Calculate summary stats
  const totalDebt = invoices.reduce((sum, inv) => {
    if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
      return sum + getDecimalNumber(inv.outstandingAmount);
    }
    return sum;
  }, 0);

  const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Column: Statements (2/3) */}
      <div className="lg:col-span-2">
        <CustomerStatementsTable customerId={customerId} />
      </div>

      {/* Sidebar (1/3): Invoices + Contracts */}
      <div className="space-y-6">
        {/* Financial Summary Card */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Tổng quan tài chính</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Công nợ hiện tại</span>
              <span
                className={`text-sm font-black ${totalDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {formatCurrency(totalDebt)}
              </span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Hóa đơn quá hạn</span>
                <Badge variant="destructive" className="text-xs font-bold">
                  {overdueCount} HĐ
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices Widget */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Receipt className="h-4 w-4 text-blue-500" aria-hidden="true" />
                Hóa đơn
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href={`/invoices?customerId=${customerId}`}>
                  Xem tất cả
                  <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">Chưa có hóa đơn</p>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv) => {
                  const config = invoiceStatusConfig[inv.status];
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          {inv.invoiceNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`px-1.5 py-0 text-[10px] ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">
                          {formatCurrency(getDecimalNumber(inv.totalAmount))}
                        </span>
                        <ExternalLink className="group-hover:text-primary h-3 w-3 text-slate-300 opacity-0 transition-colors group-hover:opacity-100" aria-hidden="true" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contracts Widget (Legal Reference) */}
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Gavel className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Pháp lý
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href={`/contracts?customerId=${customerId}`}>
                  Xem HĐ
                  <ChevronRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <CardDescription className="text-[10px]">Tham chiếu hợp đồng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Số hợp đồng</span>
              <span className="font-bold text-slate-700">{contractsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
