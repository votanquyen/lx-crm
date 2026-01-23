/**
 * Edit Contract Page
 * Only DRAFT contracts can be edited
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContractById } from "@/actions/contracts";
import { ContractForm } from "@/components/contracts/contract-form";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContractPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const contractRaw = await getContractById(id);

    // Only DRAFT contracts can be edited
    if (contractRaw.status !== "DRAFT") {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/contracts/${id}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Không thể chỉnh sửa</h1>
              <p className="text-muted-foreground">
                Chỉ có thể chỉnh sửa hợp đồng ở trạng thái Nháp
              </p>
            </div>
          </div>
          <div className="bg-destructive/10 text-destructive rounded-lg p-4">
            Hợp đồng này đang ở trạng thái &quot;{contractRaw.status}&quot; nên không thể chỉnh sửa.
            Vui lòng liên hệ quản trị viên nếu cần thay đổi.
          </div>
          <Button asChild>
            <Link href={`/contracts/${id}`}>Quay lại chi tiết hợp đồng</Link>
          </Button>
        </div>
      );
    }

    // Fetch customers and plant types for the form
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

    // Convert contract data for the form
    const contract = {
      id: contractRaw.id,
      customerId: contractRaw.customer.id,
      startDate: contractRaw.startDate,
      endDate: contractRaw.endDate,
      depositAmount: contractRaw.depositAmount,
      paymentTerms: contractRaw.paymentTerms,
      notes: null, // Contract doesn't have notes field
      items: contractRaw.items.map((item) => ({
        plantTypeId: item.plantType?.id ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })),
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/contracts/${id}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa hợp đồng</h1>
            <p className="text-muted-foreground">{contractRaw.contractNumber}</p>
          </div>
        </div>

        <ContractForm customers={customers} plantTypes={plantTypes} contract={contract} />
      </div>
    );
  } catch {
    notFound();
  }
}
