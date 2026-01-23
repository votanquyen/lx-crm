/**
 * Edit Customer Page
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCustomerById } from "@/actions/customers";
import { CustomerForm } from "@/components/customers/customer-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const customer = await getCustomerById(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/customers/${id}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa khách hàng</h1>
            <p className="text-muted-foreground">{customer.companyName}</p>
          </div>
        </div>

        <CustomerForm customer={customer} />
      </div>
    );
  } catch {
    notFound();
  }
}
