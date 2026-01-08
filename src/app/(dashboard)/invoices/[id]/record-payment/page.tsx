/**
 * Record Payment Page
 * Record a payment directly from an invoice
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInvoiceById } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/payments/payment-form";
import { subtractDecimal } from "@/lib/db-utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordPaymentPage({ params }: PageProps) {
  const { id } = await params;
  const invoice = await getInvoiceById(id).catch(() => notFound());

  // Calculate remaining balance
  const remainingBalance = Number(subtractDecimal(invoice.totalAmount, invoice.paidAmount));

  // Check if invoice is already fully paid
  if (remainingBalance <= 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/invoices/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ghi nhận thanh toán</h1>
            <p className="text-muted-foreground">
              Hóa đơn {invoice.invoiceNumber}/{new Date(invoice.issueDate).getDate()}-{new Date(invoice.issueDate).getMonth() + 1}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold mb-2">Hóa đơn đã thanh toán đầy đủ</p>
            <p className="text-muted-foreground mb-4">
              Hóa đơn này đã được thanh toán toàn bộ. Không thể ghi nhận thêm thanh toán.
            </p>
            <Button asChild>
              <Link href={`/invoices/${id}`}>Quay lại hóa đơn</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/invoices/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ghi nhận thanh toán</h1>
          <p className="text-muted-foreground">
            Hóa đơn {invoice.invoiceNumber}/{new Date(invoice.issueDate).getDate()}-{new Date(invoice.issueDate).getMonth() + 1}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm
            invoice={invoice as any}
            remainingBalance={remainingBalance}
          />
        </CardContent>
      </Card>
    </div>
  );
}
