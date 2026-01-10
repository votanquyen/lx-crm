/**
 * Customer Detail Page
 */
import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { CustomerDetail } from "@/components/customers/customer-detail";
import type { ComponentProps } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

type CustomerData = ComponentProps<typeof CustomerDetail>["customer"];

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const customer = (await getCustomerById(id)) as unknown as CustomerData;
    return <CustomerDetail customer={customer} />;
  } catch {
    notFound();
  }
}
