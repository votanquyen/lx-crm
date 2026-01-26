/**
 * Customer Payments Component
 * Display payment history from invoices
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@prisma/client";

interface Payment {
  id: string;
  amount: number | string | { toString(): string };
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  bankRef?: string | null;
  notes: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  payments: Payment[];
}

interface CustomerPaymentsProps {
  invoices: Invoice[];
}

const methodLabels: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
  VNPAY: "VNPay",
};

export function CustomerPayments({ invoices }: CustomerPaymentsProps) {
  // Flatten all payments from all invoices
  const allPayments = invoices.flatMap((inv) =>
    inv.payments.map((p) => ({
      ...p,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
    }))
  );

  // Sort by date descending
  allPayments.sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  if (allPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Chưa có thanh toán nào
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lịch sử thanh toán ({allPayments.length})</CardTitle>
        <div className="text-sm">
          <span className="text-muted-foreground">Tổng đã thanh toán: </span>
          <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Hóa đơn</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Mã tham chiếu</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayments.slice(0, 50).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/invoices/${payment.invoiceId}`}
                      className="font-medium hover:underline"
                    >
                      {payment.invoiceNumber.match(/^(\d+)/)?.[1] ?? payment.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{methodLabels[payment.paymentMethod]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.bankRef || "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(Number(payment.amount))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
