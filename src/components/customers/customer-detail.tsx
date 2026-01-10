/**
 * Customer Detail Component
 * Shows customer info with tabbed sections for all related data
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
  Receipt,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CustomerContracts } from "./customer-contracts";
import { CustomerPlants } from "./customer-plants";
import { CustomerPayments } from "./customer-payments";
import { CustomerDebtCard } from "./customer-debt-card";
import { CustomerStatementPreview } from "./customer-statement-preview";
import { CustomerNotes } from "./customer-notes";
import type {
  CustomerStatus,
  InvoiceStatus,
  ContractStatus,
  PlantStatus,
  PlantCondition,
  PaymentMethod,
  NoteStatus,
  NoteCategory,
} from "@prisma/client";

/** Numeric type compatible with Prisma Decimal */
type NumericValue = number | string | { toString(): string };

interface Payment {
  id: string;
  amount: NumericValue;
  paymentDate: Date;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
}

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  totalAmount: NumericValue;
  paidAmount: NumericValue;
  outstandingAmount: NumericValue;
  payments: Payment[];
}

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
  monthlyFee: NumericValue;
  items: ContractItem[];
  createdBy: { id: string; name: string | null; email: string } | null;
}

interface CustomerPlant {
  id: string;
  quantity: number;
  location: string | null;
  position: string | null;
  condition: PlantCondition;
  status: PlantStatus;
  installedAt: Date;
  lastExchanged: Date | null;
  plantType: {
    name: string;
    scientificName: string | null;
  };
}

interface StickyNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  status: NoteStatus;
  priority: number;
  createdAt: Date;
  createdBy: { id: string; name: string | null } | null;
}

interface MonthlyStatement {
  id: string;
  month: number;
  year: number;
  needsConfirmation: boolean;
  confirmedAt: Date | null;
  total: NumericValue;
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
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
    contracts: Contract[];
    customerPlants: CustomerPlant[];
    invoices: CustomerInvoice[];
    stickyNotes: StickyNote[];
    monthlyStatements: MonthlyStatement[];
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
  const isOverdue =
    invoice.status !== "PAID" &&
    invoice.status !== "CANCELLED" &&
    new Date(invoice.dueDate) < new Date();
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
          <Badge variant="destructive" className="ml-2">
            Quá hạn
          </Badge>
        )}
      </TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell className={isOverdue ? "text-destructive font-medium" : ""}>
        {formatDate(invoice.dueDate)}
      </TableCell>
      <TableCell className="text-right">{Number(invoice.totalAmount).toLocaleString()}đ</TableCell>
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
            </div>
            <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Leaf} label="Cây xanh" value={customer._count.customerPlants} />
        <StatCard icon={FileText} label="Hợp đồng" value={customer._count.contracts} />
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
        <StatCard icon={Calendar} label="Lịch chăm sóc" value={customer._count.careSchedules} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="plants">Cây xanh ({customer._count.customerPlants})</TabsTrigger>
          <TabsTrigger value="contracts">Hợp đồng ({customer._count.contracts})</TabsTrigger>
          <TabsTrigger value="invoices">Hóa đơn ({customer._count.invoices})</TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="mr-1 h-3 w-3" />
            Thanh toán
          </TabsTrigger>
          <TabsTrigger value="notes">Ghi chú ({customer._count.stickyNotes})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column - Contact and metadata */}
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin liên hệ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customer.contactName && (
                      <InfoRow icon={Building2} label="Người liên hệ" value={customer.contactName} />
                    )}
                    {customer.contactPhone && (
                      <InfoRow icon={Phone} label="Điện thoại" value={customer.contactPhone} />
                    )}
                    {customer.contactEmail && (
                      <InfoRow icon={Mail} label="Email" value={customer.contactEmail} />
                    )}
                    {customer.taxCode && (
                      <InfoRow icon={FileText} label="Mã số thuế" value={customer.taxCode} />
                    )}
                    {!customer.contactName && !customer.contactPhone && !customer.contactEmail && (
                      <p className="text-muted-foreground text-sm">Chưa có thông tin liên hệ</p>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin hệ thống</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <InfoRow icon={Calendar} label="Ngày tạo" value={formatDate(customer.createdAt)} />
                    <InfoRow
                      icon={Calendar}
                      label="Cập nhật lần cuối"
                      value={formatDate(customer.updatedAt)}
                    />
                    {customer.latitude && customer.longitude && (
                      <InfoRow
                        icon={MapPin}
                        label="Tọa độ"
                        value={`${customer.latitude.toFixed(6)}, ${customer.longitude.toFixed(6)}`}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right column - Debt and Statement */}
            <div className="space-y-6">
              <CustomerDebtCard invoices={customer.invoices} />
              <CustomerStatementPreview
                statements={customer.monthlyStatements}
                customerId={customer.id}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plants">
          <CustomerPlants plants={customer.customerPlants} />
        </TabsContent>

        <TabsContent value="contracts">
          <CustomerContracts contracts={customer.contracts} />
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách hóa đơn</CardTitle>
              <CardDescription>Lịch sử thanh toán của khách hàng</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.invoices.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Receipt className="mx-auto mb-2 h-8 w-8 opacity-50" />
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

        <TabsContent value="payments">
          <CustomerPayments invoices={customer.invoices} />
        </TabsContent>

        <TabsContent value="notes">
          <CustomerNotes notes={customer.stickyNotes} />
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
          <p className="text-muted-foreground text-sm">{label}</p>
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
      <Icon className="text-muted-foreground h-4 w-4" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
