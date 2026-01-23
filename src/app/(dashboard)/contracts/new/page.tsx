/**
 * New Contract Page
 */
import { ContractForm } from "@/components/contracts/contract-form";
import { prisma } from "@/lib/prisma";

interface NewContractPageProps {
  searchParams: Promise<{ customerId?: string }>;
}

export default async function NewContractPage({ searchParams }: NewContractPageProps) {
  const params = await searchParams;

  // Fetch customers and plant types
  const [customers, plantTypesRaw] = await Promise.all([
    prisma.customer.findMany({
      where: { status: { not: "TERMINATED" } },
      select: { id: true, code: true, companyName: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.plantType.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, rentalPrice: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Convert Decimal to number for client components
  const plantTypes = plantTypesRaw.map((pt) => ({
    ...pt,
    rentalPrice: pt.rentalPrice.toNumber(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tạo hợp đồng mới</h1>
        <p className="text-muted-foreground">Điền thông tin để tạo hợp đồng thuê cây</p>
      </div>

      <ContractForm
        customers={customers}
        plantTypes={plantTypes}
        defaultCustomerId={params.customerId}
      />
    </div>
  );
}
