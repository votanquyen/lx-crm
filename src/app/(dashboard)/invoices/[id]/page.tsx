/**
 * Invoice Detail Page
 */
import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { getInvoiceById } from "@/actions/invoices";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  try {
    const invoice = await getInvoiceById(id);
    return <InvoiceDetail invoice={invoice} />;
  } catch {
    notFound();
  }
}
