/**
 * Customer Detail Component
 * Shows customer info with tabbed sections
 */
import React from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Leaf,
  StickyNote,
  ArrowLeft,
  Edit,
  Trash2,
  Crown,
  Star,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CustomerStatus, CustomerTier, InvoiceStatus } from "@prisma/client";

// Prisma Decimal-like type for compatibility
type DecimalLike = { toString(): string } | number | string;
// Accept both Date and string for serialization compatibility
type DateOrString = Date | string;

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: DateOrString;
  dueDate: DateOrString;
  totalAmount: DecimalLike;
  paidAmount: DecimalLike;
  outstandingAmount: DecimalLike;
}

interface CustomerDetailProps {
  customer: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    district: string | null;
    city: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    taxCode: string | null;
    status: CustomerStatus;
    tier: CustomerTier;
    latitude: number | null;
    longitude: number | null;
    aiNotes?: string | null;
    createdAt: DateOrString;
    updatedAt: DateOrString;
    createdBy?: { id: string; name: string | null; email: string } | null;
    invoices: CustomerInvoice[];
    _count: {
      customerPlants: number;
      stickyNotes: number;
      contracts: number;
      invoices: number;
      careSchedules: number;
      exchangeRequests: number;
      quotations: number;
    };
  };
}

const statusConfig: Record<
  CustomerStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  LEAD: { label: "Tiềm năng", variant: "secondary" },
  ACTIVE: { label: "Hoạt động", variant: "default" },
  INACTIVE: { label: "Ngưng", variant: "outline" },
  TERMINATED: { label: "Đã xóa", variant: "destructive" },
};

const tierConfig: Record<CustomerTier, { label: string; icon: typeof Crown; color: string }> = {
  VIP: { label: "VIP", icon: Crown, color: "text-amber-500" },
  PREMIUM: { label: "Premium", icon: Star, color: "text-purple-500" },
  STANDARD: { label: "Standard", icon: Star, color: "text-muted-foreground" },
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

/** Memoized invoice row to prevent unnecessary re-renders */
const CustomerInvoiceRow = React.memo(({ invoice }: { invoice: CustomerInvoice }) => {
  const invStatus = invoiceStatusConfig[invoice.status];
  const isOverdue = invoice.status !== "PAID" && invoice.status !== "CANCELLED" && new Date(invoice.dueDate) < new Date();
  const invoiceNo = invoice.invoiceNumber.match(/^(\d+)/)?.[1] ?? invoice.invoiceNumber;

  return (
    <TableRow>
      <TableCell>
        <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
          {invoiceNo}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant={invStatus.variant}>{invStatus.label}</Badge>
        {isOverdue && invoice.status !== "OVERDUE" && (
          <Badge variant="destructive" className="ml-2">Quá hạn</Badge>
        )}
      </TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>
        {formatDate(invoice.dueDate)}
      </TableCell>
      <TableCell className="text-right">
        {Number(invoice.totalAmount).toLocaleString()}đ
      </TableCell>
      <TableCell className="text-right font-medium">
        {Number(invoice.outstandingAmount) > 0 ? (
          <span className="text-orange-600">
            {Number(invoice.outstandingAmount).toLocaleString()}đ
          </span>
        ) : (
          <span className="text-green-600">0</span>
        )}
      </TableCell>
    </TableRow>
  );
});
CustomerInvoiceRow.displayName = "CustomerInvoiceRow";

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const status = statusConfig[customer.status];
  const tier = tierConfig[customer.tier];
  const TierIcon = tier.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{customer.companyName}</h1>
              <Badge variant="outline">{customer.code}</Badge>
              <Badge variant={status.variant}>{status.label}</Badge>
              <div className={cn("flex items-center gap-1", tier.color)}>
                <TierIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{tier.label}</span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {customer.address}
                {customer.district && `, ${customer.district}`}
                {customer.city && `, ${customer.city}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Leaf}
          label="Cây xanh"
          value={customer._count.customerPlants}
        />
        <StatCard
          icon={FileText}
          label="Hợp đồng"
          value={customer._count.contracts}
        />
        <StatCard
          icon={Receipt}
          label="Hóa đơn"
          value={customer._count.invoices}
          highlight={customer._count.invoices > 0}
        />
        <StatCard
          icon={StickyNote}
          label="Ghi chú"
          value={customer._count.stickyNotes}
          highlight={customer._count.stickyNotes > 0}
        />
        <StatCard
          icon={Calendar}
          label="Lịch chăm sóc"
          value={customer._count.careSchedules}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="plants">
            Cây xanh ({customer._count.customerPlants})
          </TabsTrigger>
          <TabsTrigger value="contracts">
            Hợp đồng ({customer._count.contracts})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Hóa đơn ({customer._count.invoices})
          </TabsTrigger>
          <TabsTrigger value="notes">
            Ghi chú ({customer._count.stickyNotes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.contactName && (
                  <InfoRow
                    icon={Building2}
                    label="Người liên hệ"
                    value={customer.contactName}
                  />
                )}
                {customer.contactPhone && (
                  <InfoRow
                    icon={Phone}
                    label="Điện thoại"
                    value={customer.contactPhone}
                  />
                )}
                {customer.contactEmail && (
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={customer.contactEmail}
                  />
                )}
                {customer.taxCode && (
                  <InfoRow
                    icon={FileText}
                    label="Mã số thuế"
                    value={customer.taxCode}
                  />
                )}
                {!customer.contactName &&
                  !customer.contactPhone &&
                  !customer.contactEmail && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có thông tin liên hệ
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={Calendar}
                  label="Ngày tạo"
                  value={formatDate(customer.createdAt)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Cập nhật lần cuối"
                  value={formatDate(customer.updatedAt)}
                />
                {customer.createdBy && (
                  <InfoRow
                    icon={Building2}
                    label="Người tạo"
                    value={customer.createdBy.name ?? customer.createdBy.email}
                  />
                )}
                {customer.latitude && customer.longitude && (
                  <InfoRow
                    icon={MapPin}
                    label="Tọa độ"
                    value={`${customer.latitude.toFixed(6)}, ${customer.longitude.toFixed(6)}`}
                  />
                )}
              </CardContent>
            </Card>

            {/* AI Notes (if any) */}
            {customer.aiNotes && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>AI Notes</CardTitle>
                  <CardDescription>
                    Tóm tắt được tạo bởi AI từ các ghi chú
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{customer.aiNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plants">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách cây xanh</CardTitle>
              <CardDescription>
                Các loại cây đang được thuê bởi khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer._count.customerPlants === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Khách hàng chưa có cây xanh nào
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Tính năng đang được phát triển...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách hợp đồng</CardTitle>
              <CardDescription>
                Lịch sử hợp đồng thuê cây của khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer._count.contracts === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Khách hàng chưa có hợp đồng nào
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Tính năng đang được phát triển...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách hóa đơn</CardTitle>
              <CardDescription>
                Lịch sử thanh toán của khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.invoices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  Khách hàng chưa có hóa đơn nào
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Số HĐ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày phát hành</TableHead>
                        <TableHead>Hạn thanh toán</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Còn nợ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.invoices.map((invoice) => (
                        <CustomerInvoiceRow key={invoice.id} invoice={invoice} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú</CardTitle>
              <CardDescription>
                Các ghi chú về khách hàng (có phân tích AI)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer._count.stickyNotes === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Chưa có ghi chú nào
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Tính năng đang được phát triển...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: typeof Leaf;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-amber-500/50" : undefined}>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            highlight ? "bg-amber-100 text-amber-600" : "bg-muted"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
