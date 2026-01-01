/**
 * Invoice Server Actions
 * CRUD with payment tracking
 */
"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { toDecimal, toNumber, addDecimal, multiplyDecimal, subtractDecimal, compareDecimal } from "@/lib/db-utils";
import {
  createInvoiceSchema,
  invoiceSearchSchema,
  paymentSchema,
  type InvoiceSearchParams,
} from "@/lib/validations/contract";

/**
 * Generate next invoice number (INV-YYYYMM-XXXX)
 */
async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `INV-${yearMonth}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/-(\d{4})$/);
    if (match?.[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Get paginated list of invoices
 */
export async function getInvoices(params: InvoiceSearchParams) {
  await requireAuth();

  const validated = invoiceSearchSchema.parse(params);
  const { page, limit, search, status, customerId, overdueOnly, dateFrom, dateTo } = validated;

  const skip = (page - 1) * limit;
  const now = new Date();

  // Build where clause
  const where: Prisma.InvoiceWhereInput = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  // Overdue filter
  if (overdueOnly) {
    where.status = { in: ["SENT", "PARTIAL"] };
    where.dueDate = { lt: now };
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.issueDate = {};
    if (dateFrom) where.issueDate.gte = dateFrom;
    if (dateTo) where.issueDate.lte = dateTo;
  }

  // Search by invoice number or customer name
  if (search && search.trim()) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issueDate: "desc" },
      include: {
        customer: {
          select: { id: true, code: true, companyName: true },
        },
        contract: {
          select: { id: true, contractNumber: true },
        },
        _count: {
          select: { payments: true },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  // Convert Decimal to number for client components
  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    subtotal: inv.subtotal.toNumber(),
    discountAmount: inv.discountAmount?.toNumber() ?? null,
    vatRate: inv.vatRate.toNumber(),
    vatAmount: inv.vatAmount.toNumber(),
    totalAmount: inv.totalAmount.toNumber(),
    paidAmount: inv.paidAmount.toNumber(),
    outstandingAmount: inv.outstandingAmount.toNumber(),
  }));

  return {
    data: serializedInvoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single invoice by ID with full details
 * Returns serialized Decimal fields for client components
 */
export async function getInvoiceById(id: string) {
  await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          address: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          taxCode: true,
        },
      },
      contract: {
        select: { id: true, contractNumber: true },
      },
      items: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!invoice) throw new NotFoundError("Hóa đơn");

  // Serialize Decimal fields for client components
  return {
    ...invoice,
    subtotal: invoice.subtotal.toNumber(),
    discountAmount: invoice.discountAmount?.toNumber() ?? null,
    vatRate: invoice.vatRate.toNumber(),
    vatAmount: invoice.vatAmount.toNumber(),
    totalAmount: invoice.totalAmount.toNumber(),
    paidAmount: invoice.paidAmount.toNumber(),
    outstandingAmount: invoice.outstandingAmount.toNumber(),
    items: invoice.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      totalPrice: item.totalPrice.toNumber(),
    })),
    payments: invoice.payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toNumber(),
    })),
  };
}

/**
 * Create a new invoice
 */
export const createInvoice = createAction(createInvoiceSchema, async (input) => {
  const session = await requireAuth();

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, status: true },
  });
  if (!customer) throw new NotFoundError("Khách hàng");

  // Verify contract if provided
  if (input.contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
    });
    if (!contract) throw new NotFoundError("Hợp đồng");
    if (contract.customerId !== input.customerId) {
      throw new AppError("Hợp đồng không thuộc khách hàng này", "INVALID_CONTRACT");
    }
  }

  // Calculate amounts
  const subtotal = input.items.reduce(
    (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
    toDecimal(0)
  );
  const taxAmount = toDecimal(0); // Tax can be added later
  const totalAmount = addDecimal(subtotal, taxAmount);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice with items
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: input.customerId,
      contractId: input.contractId,
      status: "DRAFT",
      issueDate: input.issueDate ?? new Date(),
      dueDate: input.dueDate,
      subtotal: toNumber(subtotal),
      vatAmount: toNumber(taxAmount),
      totalAmount: toNumber(totalAmount),
      paidAmount: 0,
      outstandingAmount: toNumber(totalAmount),
      notes: input.notes,
      items: {
        create: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      items: true,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Invoice",
      entityId: invoice.id,
      newValues: invoice as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/customers/${input.customerId}`);
  return invoice;
});

/**
 * Generate invoices from active contract
 */
export const generateContractInvoice = createSimpleAction(
  async (data: { contractId: string; periodStart: Date; periodEnd: Date }) => {
    const session = await requireAuth();

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        customer: true,
        items: { include: { plantType: true } },
      },
    });
    if (!contract) throw new NotFoundError("Hợp đồng");

    if (contract.status !== "ACTIVE") {
      throw new AppError("Hợp đồng không đang hoạt động", "INVALID_STATUS");
    }

    // Create invoice items from contract items
    const items = contract.items.map((item) => ({
      description: `Thuê cây ${item.plantType.name} (${item.quantity} cây) - Kỳ ${data.periodStart.toLocaleDateString("vi-VN")} đến ${data.periodEnd.toLocaleDateString("vi-VN")}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const subtotal = items.reduce((sum, item) => addDecimal(sum, item.totalPrice), toDecimal(0));
    const totalAmount = subtotal;

    // Calculate due date (15 days from issue)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: contract.customerId,
        contractId: contract.id,
        status: "DRAFT",
        issueDate: new Date(),
        dueDate,
        subtotal: toNumber(subtotal),
        vatAmount: 0,
        totalAmount: toNumber(totalAmount),
        paidAmount: 0,
        outstandingAmount: toNumber(totalAmount),
        notes: `Hóa đơn tự động từ hợp đồng ${contract.contractNumber}`,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: toNumber(item.unitPrice),
            totalPrice: toNumber(item.totalPrice),
          })),
        },
      },
      include: {
        customer: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "GENERATE",
        entityType: "Invoice",
        entityId: invoice.id,
        newValues: { fromContract: contract.id } as Prisma.JsonObject,
      },
    });

    revalidatePath("/invoices");
    revalidatePath(`/contracts/${contract.id}`);
    return invoice;
  }
);

/**
 * Send invoice (DRAFT -> SENT)
 */
export const sendInvoice = createSimpleAction(async (id: string) => {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new NotFoundError("Hóa đơn");

  if (invoice.status !== "DRAFT") {
    throw new AppError("Chỉ có thể gửi hóa đơn ở trạng thái Nháp", "INVALID_STATUS");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "SENT" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "SEND",
      entityType: "Invoice",
      entityId: id,
    },
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return updated;
});

/**
 * Cancel invoice
 */
export const cancelInvoice = createSimpleAction(async (id: string) => {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!invoice) throw new NotFoundError("Hóa đơn");

  if (invoice.payments.length > 0) {
    throw new AppError("Không thể hủy hóa đơn đã có thanh toán", "HAS_PAYMENTS");
  }

  if (invoice.status === "CANCELLED") {
    throw new AppError("Hóa đơn đã bị hủy", "ALREADY_CANCELLED");
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CANCEL",
      entityType: "Invoice",
      entityId: id,
    },
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return updated;
});

/**
 * Record a payment
 */
export const recordPayment = createAction(paymentSchema, async (input) => {
  const session = await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
  });
  if (!invoice) throw new NotFoundError("Hóa đơn");

  if (!["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status)) {
    throw new AppError("Hóa đơn không thể nhận thanh toán", "INVALID_STATUS");
  }

  if (compareDecimal(toDecimal(input.amount), invoice.outstandingAmount) > 0) {
    throw new AppError(
      `Số tiền thanh toán vượt quá số tiền còn nợ (${toNumber(invoice.outstandingAmount).toLocaleString("vi-VN")} VND)`,
      "AMOUNT_EXCEEDS_OUTSTANDING"
    );
  }

  // Create payment and update invoice
  const result = await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentDate: input.paymentDate ?? new Date(),
        paymentMethod: input.method,
        bankRef: input.reference,
        // notes field doesn't exist in Payment schema
      },
    });

    // Update invoice amounts
    const newPaidAmount = addDecimal(invoice.paidAmount, input.amount);
    const newOutstanding = subtractDecimal(invoice.totalAmount, newPaidAmount);
    const newStatus = compareDecimal(newOutstanding, 0) <= 0 ? "PAID" : "PARTIAL";

    const updatedInvoice = await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmount: toNumber(newPaidAmount),
        outstandingAmount: toNumber(newOutstanding),
        status: newStatus,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "RECORD_PAYMENT",
      entityType: "Invoice",
      entityId: input.invoiceId,
      newValues: { paymentId: result.payment.id, amount: input.amount } as Prisma.JsonObject,
    },
  });

  revalidatePath(`/invoices/${input.invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath(`/customers/${invoice.customerId}`);
  return result;
});

/**
 * Get invoice stats for dashboard
 * Cached for 1 minute to improve performance
 */
export async function getInvoiceStats() {
  await requireAuth();

  return unstable_cache(
    async () => {
      const now = new Date();

      // Single query with FILTER instead of 5 separate queries
      const stats = await prisma.$queryRaw<[{
        total: bigint;
        pending: bigint;
        overdue: bigint;
        overdue_amount: string | null; // PostgreSQL Decimal returns as string
        total_receivables: string | null; // PostgreSQL Decimal returns as string
      }]>`
        SELECT
          COUNT(*) FILTER (WHERE status != 'CANCELLED') as total,
          COUNT(*) FILTER (WHERE status IN ('SENT', 'PARTIAL')) as pending,
          COUNT(*) FILTER (WHERE status IN ('SENT', 'PARTIAL') AND "dueDate" < ${now}) as overdue,
          COALESCE(SUM("outstandingAmount") FILTER (WHERE status IN ('SENT', 'PARTIAL') AND "dueDate" < ${now}), 0) as overdue_amount,
          COALESCE(SUM("outstandingAmount") FILTER (WHERE status IN ('SENT', 'PARTIAL')), 0) as total_receivables
        FROM invoices
      `;

      return {
        total: Number(stats[0].total),
        pending: Number(stats[0].pending),
        overdue: Number(stats[0].overdue),
        overdueAmount: Number(stats[0].overdue_amount || 0),
        totalReceivables: Number(stats[0].total_receivables || 0),
      };
    },
    ["invoice-stats"],
    { revalidate: 60 }
  )();
}

/**
 * Get overdue invoices
 */
export async function getOverdueInvoices(limit: number = 20) {
  await requireAuth();

  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PARTIAL"] },
      dueDate: { lt: now },
    },
    include: {
      customer: {
        select: { id: true, code: true, companyName: true, contactPhone: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  return invoices;
}

/**
 * Update overdue invoices status (background job)
 * Only ADMIN/MANAGER can run this
 */
export async function updateOverdueStatus() {
  await requireManager();

  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ["SENT", "PARTIAL"] },
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  return { updated: result.count };
}
