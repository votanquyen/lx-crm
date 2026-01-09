/**
 * New Invoice Page
 */
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { prisma } from "@/lib/prisma";

interface NewInvoicePageProps {
  searchParams: Promise<{ customerId?: string; contractId?: string }>;
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const params = await searchParams;

  // Fetch customers and active contracts
  const [customers, contracts] = await Promise.all([
    prisma.customer.findMany({
      where: { status: { not: "TERMINATED" } },
      select: { id: true, code: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.contract.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, contractNumber: true, customerId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tạo hóa đơn mới</h1>
        <p className="text-muted-foreground">Điền thông tin để tạo hóa đơn</p>
      </div>

      <InvoiceForm
        customers={customers}
        contracts={contracts}
        defaultCustomerId={params.customerId}
        defaultContractId={params.contractId}
      />
    </div>
  );
}
