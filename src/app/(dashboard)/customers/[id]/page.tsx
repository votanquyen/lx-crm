/**
 * Customer Detail Page
 */
import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { getCustomerNotes } from "@/actions/sticky-notes";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { CustomerSheetManager } from "@/components/customers/customer-sheet-manager";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CustomerDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  try {
    const [customer, notes] = await Promise.all([getCustomerById(id), getCustomerNotes(id)]);
    return (
      <>
        <CustomerDetail customer={customer} notes={notes} defaultTab={tab} />
        <CustomerSheetManager />
      </>
    );
  } catch {
    notFound();
  }
}
