/**
 * Customer Detail Component
 * Shows customer info with tabbed sections
 */
import Link from "next/link";
import {
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes";
import { CustomerBusinessCard } from "./customer-business-card";
import { ActionItemsWidget } from "./action-items-widget";
import { OpsSnapshotWidget } from "./ops-snapshot-widget";
import { RecentActivityFeed } from "./recent-activity-feed";
import { FinanceTab } from "./finance-tab";
import { OperationsTab } from "./operations-tab";
import type { getCustomerNotes } from "@/actions/sticky-notes";
import type { CustomerStatus, InvoiceStatus } from "@prisma/client";

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
  notes?: Awaited<ReturnType<typeof getCustomerNotes>>;
}

export function CustomerDetail({ customer, notes = [] }: CustomerDetailProps) {

  // Compute financial summary from invoices
  const financials = {
    totalDebt: customer.invoices
      .filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
      .reduce((sum, i) => sum + Number(i.outstandingAmount), 0),
    monthlyValue: 0, // Would come from contracts if available
    activeContracts: customer._count.contracts,
    overdueInvoices: customer.invoices.filter(
      (i) => i.status === "OVERDUE" || (i.status !== "PAID" && i.status !== "CANCELLED" && new Date(i.dueDate) < new Date())
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-slate-900">
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>

      {/* Business Card Header with Integrated Metrics */}
      <CustomerBusinessCard
        customer={customer}
        financials={financials}
        stats={{
          plants: customer._count.customerPlants,
          contracts: customer._count.contracts,
          invoices: customer._count.invoices,
          notes: customer._count.stickyNotes,
          careSchedules: customer._count.careSchedules,
        }}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="finance">
            Tài chính
          </TabsTrigger>
          <TabsTrigger value="operations">
            Vận hành ({customer._count.customerPlants})
          </TabsTrigger>
          <TabsTrigger value="notes">
            Ghi chú ({customer._count.stickyNotes})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Command Center Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Action Items */}
            <div className="space-y-4">
              <ActionItemsWidget
                invoices={customer.invoices.map(inv => ({
                  ...inv,
                  dueDate: new Date(inv.dueDate),
                  totalAmount: Number(inv.totalAmount),
                  outstandingAmount: Number(inv.outstandingAmount),
                }))}
                contractsCount={customer._count.contracts}
                exchangeRequestsCount={customer._count.exchangeRequests ?? 0}
                urgentNotesCount={0}
                customerId={customer.id}
              />
            </div>

            {/* Middle Column: Operations Snapshot */}
            <div className="space-y-4">
              <OpsSnapshotWidget
                plantsCount={customer._count.customerPlants}
                plantsHealthAvg={7.5}
                careSchedulesCount={customer._count.careSchedules}
                nextCareDate={null}
                lastCareDate={null}
              />
            </div>

            {/* Right Column: Recent Activity */}
            <div>
              <RecentActivityFeed
                activities={customer.invoices.slice(0, 5).map(inv => ({
                  id: `inv-${inv.id}`,
                  type: "invoice_created" as const,
                  title: `Hóa đơn ${inv.invoiceNumber}`,
                  description: inv.status === "PAID" ? "Đã thanh toán" : "Đang chờ thanh toán",
                  amount: Number(inv.totalAmount),
                  date: new Date(inv.issueDate),
                  linkHref: `/invoices/${inv.id}`,
                }))}
                maxItems={5}
              />
            </div>
          </div>

          {/* AI Notes (if any) */}
          {customer.aiNotes && (
            <Card className="mt-6">
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
        </TabsContent>

        <TabsContent value="finance">
          <FinanceTab
            customerId={customer.id}
            invoices={customer.invoices}
            contractsCount={customer._count.contracts}
          />
        </TabsContent>

        <TabsContent value="operations">
          <OperationsTab
            customerId={customer.id}
            plantsCount={customer._count.customerPlants}
            careSchedulesCount={customer._count.careSchedules}
            exchangeRequestsCount={customer._count.exchangeRequests}
          />
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
              <NoteList customerId={customer.id} initialNotes={notes} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


