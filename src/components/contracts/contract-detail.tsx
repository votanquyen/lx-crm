/**
 * Contract Detail Component
 * Display full contract information
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FileText,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Receipt,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { activateContract, cancelContract } from "@/actions/contracts";
import { formatCurrency } from "@/lib/format";
import type { ContractStatus, InvoiceStatus } from "@prisma/client";

type ContractDetail = {
  id: string;
  contractNumber: string;
  status: ContractStatus;
  startDate: Date;
  endDate: Date;
  monthlyAmount: number;
  totalAmount: number;
  depositAmount: number | null;
  paymentTerms: string | null;
  notes: string | null;
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes: string | null;
    plantType: {
      id: string;
      name: string;
      code: string;
      rentalPrice: number;
    };
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    issueDate: Date;
    dueDate: Date;
    totalAmount: number;
    outstandingAmount: number;
  }[];
  renewedFrom: { id: string; contractNumber: string } | null;
  renewedTo: { id: string; contractNumber: string } | null;
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

const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Nháp", variant: "secondary" },
  SENT: { label: "Đã gửi", variant: "outline" },
  PARTIAL: { label: "Thanh toán một phần", variant: "outline" },
  PAID: { label: "Đã thanh toán", variant: "default" },
  OVERDUE: { label: "Quá hạn", variant: "destructive" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "secondary" },
};

interface ContractDetailProps {
  contract: ContractDetail;
}

export function ContractDetail({ contract }: ContractDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const status = statusConfig[contract.status];

  const getDaysRemaining = () => {
    const now = new Date();
    const end = new Date(contract.endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleActivate = () => {
    startTransition(async () => {
      const result = await activateContract(contract.id);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelContract({ id: contract.id, reason: cancelReason });
      if (result.success) {
        setShowCancelDialog(false);
        router.refresh();
      }
    });
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = contract.status === "ACTIVE" && daysRemaining <= 30 && daysRemaining > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{contract.contractNumber}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
            {isExpiringSoon && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Còn {daysRemaining} ngày
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Khách hàng: {contract.customer.companyName}</p>
        </div>

        <div className="flex gap-2">
          {["DRAFT", "PENDING"].includes(contract.status) && (
            <>
              <Button onClick={handleActivate} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Kích hoạt
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/contracts/${contract.id}/edit`}>Chỉnh sửa</Link>
              </Button>
            </>
          )}
          {["ACTIVE", "EXPIRED"].includes(contract.status) && !contract.renewedTo && (
            <Button variant="outline" asChild>
              <Link href={`/contracts/${contract.id}/renew`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gia hạn
              </Link>
            </Button>
          )}
          {contract.status === "ACTIVE" && (
            <Button variant="outline" asChild>
              <Link href={`/invoices/new?contractId=${contract.id}`}>
                <Receipt className="mr-2 h-4 w-4" />
                Tạo hóa đơn
              </Link>
            </Button>
          )}
          {contract.status !== "CANCELLED" && (
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Hủy hợp đồng
            </Button>
          )}
        </div>
      </div>

      {/* Renewal links */}
      {(contract.renewedFrom || contract.renewedTo) && (
        <div className="bg-muted flex gap-4 rounded-lg p-4">
          {contract.renewedFrom && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Gia hạn từ:</span>
              <Link
                href={`/contracts/${contract.renewedFrom.id}`}
                className="text-primary hover:underline"
              >
                {contract.renewedFrom.contractNumber}
              </Link>
            </div>
          )}
          {contract.renewedTo && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Đã gia hạn sang:</span>
              <Link
                href={`/contracts/${contract.renewedTo.id}`}
                className="text-primary hover:underline"
              >
                {contract.renewedTo.contractNumber}
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Link
                href={`/customers/${contract.customer.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {contract.customer.companyName}
              </Link>
              <p className="text-muted-foreground text-sm">{contract.customer.code}</p>
            </div>
            <p className="text-sm">{contract.customer.address}</p>
            {contract.customer.contactName && (
              <p className="text-sm">Liên hệ: {contract.customer.contactName}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {contract.customer.contactPhone && (
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="h-4 w-4" />
                  {contract.customer.contactPhone}
                </div>
              )}
              {contract.customer.contactEmail && (
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-4 w-4" />
                  {contract.customer.contactEmail}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Thông tin hợp đồng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Ngày bắt đầu</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Ngày kết thúc</p>
                <p className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: vi })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Giá trị/tháng</p>
                <p className="text-primary flex items-center gap-1 text-lg font-bold">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(contract.monthlyAmount)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Tiền đặt cọc</p>
                <p className="font-medium">{formatCurrency(contract.depositAmount ?? 0)}</p>
              </div>
            </div>
            {contract.paymentTerms && (
              <div>
                <p className="text-muted-foreground text-sm">Điều khoản thanh toán</p>
                <p className="text-sm">{contract.paymentTerms}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contract Items */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách cây thuê</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại cây</TableHead>
                <TableHead className="text-center">Số lượng</TableHead>
                <TableHead className="text-right">Đơn giá/tháng</TableHead>
                <TableHead className="text-right">Thành tiền</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contract.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.plantType.name}</p>
                      <p className="text-muted-foreground text-sm">{item.plantType.code}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-semibold">
                  Tổng cộng:
                </TableCell>
                <TableCell className="text-primary text-right text-lg font-bold">
                  {formatCurrency(contract.monthlyAmount)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoices */}
      {contract.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hóa đơn liên quan</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số hóa đơn</TableHead>
                  <TableHead>Ngày phát hành</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="text-right">Còn nợ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.invoices.map((invoice) => {
                  const invStatus = invoiceStatusConfig[invoice.status];
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issueDate), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invStatus.variant}>{invStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {invoice.outstandingAmount > 0
                          ? formatCurrency(invoice.outstandingAmount)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {contract.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{contract.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy hợp đồng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy hợp đồng {contract.contractNumber}? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Lý do hủy hợp đồng (tùy chọn)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hủy hợp đồng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
