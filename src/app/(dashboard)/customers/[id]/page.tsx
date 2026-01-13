/**
 * Customer Detail Page
 */
import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { getCustomerNotes } from "@/actions/sticky-notes";
import { CustomerDetail } from "@/components/customers/customer-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const [customer, notes] = await Promise.all([
      getCustomerById(id),
      getCustomerNotes(id),
    ]);
    return <CustomerDetail customer={customer} notes={notes} />;
  } catch {
    notFound();
  }
}
