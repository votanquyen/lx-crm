/**
 * Quotation Detail Page
 * View quotation details with actions (send, accept, reject, convert)
 */
import { notFound } from "next/navigation";
import {
  FileText,
  Calendar,
  Building2,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { getQuotationById } from "@/actions/quotations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyDecimal } from "@/lib/db-utils";
import { QuotationActions } from "@/components/quotations/quotation-actions";
import type { QuotationStatus } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  CONVERTED: "Đã chuyển đổi",
};

const statusColors: Record<QuotationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  EXPIRED: "outline",
  CONVERTED: "default",
};

export default async function QuotationDetailPage({ params }: PageProps) {
  const { id } = await params;

  let quotation;
  try {
    quotation = await getQuotationById(id);
  } catch {
    notFound();
  }

  const isExpiringSoon =
    quotation.status === "SENT" &&
    new Date(quotation.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{quotation.quoteNumber}</h1>
            <Badge variant={statusColors[quotation.status]}>{statusLabels[quotation.status]}</Badge>
            {isExpiringSoon && <Badge variant="destructive">Sắp hết hạn</Badge>}
          </div>
          {quotation.title && <p className="text-muted-foreground text-lg">{quotation.title}</p>}
        </div>

        <QuotationActions quotation={quotation} />
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-muted-foreground text-sm">Công ty</p>
            <p className="font-medium">{quotation.customer.companyName}</p>
          </div>
          {quotation.customer.contactEmail && (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{quotation.customer.contactEmail}</span>
            </div>
          )}
          {quotation.customer.contactPhone && (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{quotation.customer.contactPhone}</span>
            </div>
          )}
          {quotation.customer.address && (
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{quotation.customer.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết báo giá
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Ngày tạo</p>
              <p className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                {format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Hạn hiệu lực</p>
              <p className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                {format(new Date(quotation.validUntil), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </p>
            </div>
          </div>

          {quotation.description && (
            <div>
              <p className="text-muted-foreground text-sm">Mô tả</p>
              <p className="mt-1">{quotation.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
          <CardDescription>{quotation.items.length} sản phẩm trong báo giá</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Giảm giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.plantType.name}</p>
                        <p className="text-muted-foreground text-sm">{item.plantType.code}</p>
                        {item.locationNote && (
                          <p className="text-muted-foreground text-sm">{item.locationNote}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrencyDecimal(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.discountRate.toString())}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyDecimal(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="my-4" />

          {/* Pricing Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="font-medium">{formatCurrencyDecimal(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Chiết khấu ({parseFloat(quotation.discountRate.toString())}%):
              </span>
              <span className="font-medium text-green-600">
                -{formatCurrencyDecimal(quotation.discountAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                VAT ({parseFloat(quotation.vatRate.toString())}%):
              </span>
              <span className="font-medium">{formatCurrencyDecimal(quotation.vatAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrencyDecimal(quotation.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      {(quotation.notes || quotation.termsConditions) && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú và điều khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotation.notes && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Ghi chú nội bộ</p>
                <p className="mt-1">{quotation.notes}</p>
              </div>
            )}
            {quotation.termsConditions && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Điều khoản và điều kiện</p>
                <p className="mt-1 whitespace-pre-line">{quotation.termsConditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {quotation.status !== "DRAFT" && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Tạo báo giá</p>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>

              {["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"].includes(
                quotation.status
              ) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Send className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Đã gửi</p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(quotation.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {quotation.status === "ACCEPTED" && quotation.responseDate && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Đã chấp nhận</p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(quotation.responseDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                </div>
              )}

              {quotation.status === "REJECTED" && quotation.responseDate && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Đã từ chối</p>
                    <p className="text-muted-foreground text-sm">
                      {format(new Date(quotation.responseDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                    {quotation.rejectionReason && (
                      <p className="text-sm">Lý do: {quotation.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
