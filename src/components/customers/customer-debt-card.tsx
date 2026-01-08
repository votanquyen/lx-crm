/**
 * Customer Debt Card Component
 * Summary of outstanding debt from invoices
 */
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@prisma/client";

interface Invoice {
  id: string;
  status: InvoiceStatus;
  dueDate: Date;
  totalAmount: number | string | { toString(): string };
  outstandingAmount: number | string | { toString(): string };
}

interface CustomerDebtCardProps {
  invoices: Invoice[];
}

export function CustomerDebtCard({ invoices }: CustomerDebtCardProps) {
  const now = new Date();

  // Calculate debt summary
  const unpaidInvoices = invoices.filter(
    (inv) =>
      inv.status !== "PAID" &&
      inv.status !== "CANCELLED" &&
      Number(inv.outstandingAmount) > 0
  );

  const totalOutstanding = unpaidInvoices.reduce(
    (sum, inv) => sum + Number(inv.outstandingAmount),
    0
  );

  const overdueInvoices = unpaidInvoices.filter(
    (inv) => new Date(inv.dueDate) < now
  );

  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + Number(inv.outstandingAmount),
    0
  );

  // Find oldest overdue date
  const oldestOverdue = overdueInvoices.length > 0
    ? overdueInvoices.reduce((oldest, inv) =>
        new Date(inv.dueDate) < new Date(oldest.dueDate) ? inv : oldest
      )
    : null;

  const daysOverdue = oldestOverdue
    ? Math.floor(
        (now.getTime() - new Date(oldestOverdue.dueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Determine status
  const hasDebt = totalOutstanding > 0;
  const isOverdue = overdueAmount > 0;

  return (
    <Card
      className={cn(
        isOverdue && "border-red-500/50 bg-red-50 dark:bg-red-950/20",
        hasDebt && !isOverdue && "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20",
        !hasDebt && "border-green-500/50 bg-green-50 dark:bg-green-950/20"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : hasDebt ? (
            <Clock className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          Công nợ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDebt ? (
          <p className="text-green-600 font-medium">Không có công nợ</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Tổng còn nợ</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>

            {isOverdue && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-sm">Quá hạn</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(overdueAmount)}
                </p>
                <p className="text-sm text-red-500">
                  {overdueInvoices.length} hóa đơn, trễ {daysOverdue} ngày
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              {unpaidInvoices.length} hóa đơn chưa thanh toán
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
