/**
 * Contract Table Component
 * Displays paginated list of contracts
 */
"use client";

import { memo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FileText, Eye, MoreHorizontal, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/format";
import type { ContractStatus } from "@prisma/client";

// Accept both Date and string for serialization compatibility
type DateOrString = Date | string;

type Contract = {
  id: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: DateOrString;
  endDate: DateOrString;
  monthlyAmount: number;
  totalAmount: number;
  customer: {
    id: string;
    code: string;
    companyName: string;
  };
  items: { quantity: number }[];
  _count: { invoices: number };
};

const statusConfig: Record<
  ContractStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  NEGOTIATING: { label: "Đang đàm phán", variant: "outline" },
  SIGNED: { label: "Đã ký", variant: "secondary" },
  ACTIVE: { label: "Đang hoạt động", variant: "default" },
  EXPIRED: { label: "Hết hạn", variant: "destructive" },
  TERMINATED: { label: "Đã chấm dứt", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

interface ContractTableProps {
  contracts: Contract[];
  onActivate?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRenew?: (id: string) => void;
}

export const ContractTable = memo(function ContractTable({
  contracts,
  onActivate,
  onCancel,
  onRenew,
}: ContractTableProps) {
  const getTotalPlants = (items: { quantity: number }[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getDaysRemaining = (endDate: DateOrString) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Số hợp đồng</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thời hạn</TableHead>
            <TableHead className="text-right">Giá trị/tháng</TableHead>
            <TableHead className="text-center">Số cây</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Chưa có hợp đồng nào
              </TableCell>
            </TableRow>
          ) : (
            contracts.map((contract) => {
              const status = statusConfig[contract.status];
              const daysRemaining = getDaysRemaining(contract.endDate);
              const isExpiringSoon =
                contract.status === "ACTIVE" && daysRemaining <= 30 && daysRemaining > 0;

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
                    <div>
                      <Link
                        href={`/customers/${contract.customer.id}`}
                        className="font-medium hover:underline"
                      >
                        {contract.customer.companyName}
                      </Link>
                      <p className="text-muted-foreground text-sm">{contract.customer.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {isExpiringSoon && (
                      <Badge variant="destructive" className="ml-2">
                        Còn {daysRemaining} ngày
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })}
                      <span className="text-muted-foreground"> → </span>
                      {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(contract.monthlyAmount)}
                  </TableCell>
                  <TableCell className="text-center">{getTotalPlants(contract.items)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/contracts/${contract.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {["DRAFT", "PENDING"].includes(contract.status) && onActivate && (
                          <DropdownMenuItem onClick={() => onActivate(contract.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Kích hoạt
                          </DropdownMenuItem>
                        )}
                        {["ACTIVE", "EXPIRED"].includes(contract.status) && onRenew && (
                          <DropdownMenuItem onClick={() => onRenew(contract.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Gia hạn
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {contract.status !== "CANCELLED" && onCancel && (
                          <DropdownMenuItem
                            onClick={() => onCancel(contract.id)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy hợp đồng
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
});
