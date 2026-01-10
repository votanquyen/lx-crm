/**
 * Customer Contracts Component
 * Display list of customer contracts
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/format";
import type { ContractStatus } from "@prisma/client";

interface ContractItem {
  id: string;
  quantity: number;
  plantType: { name: string };
}

interface Contract {
  id: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  monthlyFee: number | string | { toString(): string };
  items: ContractItem[];
}

interface CustomerContractsProps {
  contracts: Contract[];
}

const statusConfig: Record<
  ContractStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  NEGOTIATING: { label: "Đàm phán", variant: "outline" },
  SIGNED: { label: "Đã ký", variant: "default" },
  ACTIVE: { label: "Hoạt động", variant: "default" },
  EXPIRED: { label: "Hết hạn", variant: "outline" },
  TERMINATED: { label: "Chấm dứt", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

export function CustomerContracts({ contracts }: CustomerContractsProps) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Khách hàng chưa có hợp đồng nào
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hợp đồng ({contracts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số HĐ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Số loại cây</TableHead>
                <TableHead className="text-right">Phí/tháng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => {
                const status = statusConfig[contract.status];
                const plantCount = contract.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="font-medium hover:underline"
                      >
                        {contract.contractNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </TableCell>
                    <TableCell>{plantCount} cây</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(contract.monthlyFee))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
