/**
 * Customer Detail Page
 */
import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { CustomerDetail } from "@/components/customers/customer-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const customer = await getCustomerById(id);
    return <CustomerDetail customer={customer} />;
  } catch {
    notFound();
  }
}
