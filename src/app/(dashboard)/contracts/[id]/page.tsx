/**
 * Contract Detail Page
 */
import { notFound } from "next/navigation";
import { ContractDetail } from "@/components/contracts/contract-detail";
import { getContractById } from "@/actions/contracts";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = await params;

  try {
    const contract = await getContractById(id);
    return <ContractDetail contract={contract} />;
  } catch {
    notFound();
  }
}
