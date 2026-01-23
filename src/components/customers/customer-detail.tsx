import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteList } from "@/components/notes";
import { CustomerBusinessCard } from "./customer-business-card";
import { FinanceTab } from "./finance-tab";
import { OperationsTab } from "./operations-tab";
import { CustomerTimeline } from "./customer-timeline";
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
  defaultTab?: string;
}

export function CustomerDetail({ customer, notes = [], defaultTab }: CustomerDetailProps) {
  // Compute financial summary from invoices (memoized for performance)
  const financials = useMemo(
    () => ({
      totalDebt: customer.invoices
        .filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
        .reduce((sum, i) => sum + Number(i.outstandingAmount), 0),
      monthlyValue: 0, // Would come from contracts if available
      activeContracts: customer._count.contracts,
      overdueInvoices: customer.invoices.filter(
        (i) =>
          i.status === "OVERDUE" ||
          (i.status !== "PAID" && i.status !== "CANCELLED" && new Date(i.dueDate) < new Date())
      ).length,
    }),
    [customer.invoices, customer._count.contracts]
  );

  // Merge events for Timeline (memoized for performance)
  const timelineEvents = useMemo(
    () => [
      ...customer.invoices.map((inv) => ({
        id: `inv-${inv.id}`,
        type: "INVOICE" as const,
        date: new Date(inv.issueDate),
        title: `Hóa đơn #${inv.invoiceNumber}`,
        description: "Hóa đơn đã được tạo",
        amount: Number(inv.totalAmount),
        status: inv.status,
      })),
      ...notes.map((note) => ({
        id: `note-${note.id}`,
        type: "NOTE" as const,
        date: new Date(note.createdAt),
        title: "Ghi chú mới",
        description: note.content,
        user: { name: note.createdBy?.name || "Hệ thống", image: note.createdBy?.image },
      })),
    ],
    [customer.invoices, notes]
  );

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground h-8 px-2 hover:text-slate-900"
        >
          <Link href="/customers">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
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
      <Tabs defaultValue={defaultTab || "overview"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
          <TabsTrigger value="operations">Vận hành ({customer._count.customerPlants})</TabsTrigger>
          <TabsTrigger value="notes">Ghi chú ({customer._count.stickyNotes})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Column: Timeline */}
            <div className="space-y-6 lg:col-span-2">
              {/* AI Summary Card */}
              {customer.aiNotes && (
                <Card className="border-blue-100 bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-slate-700">
                      AI Phân tích
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600">{customer.aiNotes}</p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Hoạt động gần đây</h3>
                <CustomerTimeline events={timelineEvents} />
              </div>
            </div>

            {/* Right Column: Context (Map, etc) - Placeholder for now or moved content */}
            <div className="space-y-6">
              {/* Could put Map here, or Pending Tasks */}
              {/* Currently empty as map is not implemented in detail view logic yet */}
            </div>
          </div>
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
              <CardDescription>Các ghi chú về khách hàng (có phân tích AI)</CardDescription>
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
