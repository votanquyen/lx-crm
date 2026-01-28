/**
 * Payment Server Actions
 * CRUD operations for payment recording and management
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { toDecimal, addDecimal, subtractDecimal, compareDecimal } from "@/lib/db-utils";
import {
  createPaymentSchema,
  updatePaymentSchema,
  verifyPaymentSchema,
  paymentSearchSchema,
  type PaymentSearchParams,
} from "@/lib/validations/payment";

/**
 * Get paginated list of payments with filters
 */
export async function getPayments(params: PaymentSearchParams) {
  await requireAuth();

  const validated = paymentSearchSchema.parse(params);
  const {
    page,
    limit,
    invoiceId,
    customerId,
    paymentMethod,
    isVerified,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
  } = validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.PaymentWhereInput = {};

  if (invoiceId) where.invoiceId = invoiceId;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (isVerified !== undefined) where.isVerified = isVerified;

  // Customer filter (through invoice)
  if (customerId) {
    where.invoice = { customerId };
  }

  // Date range
  if (dateFrom || dateTo) {
    where.paymentDate = {};
    if (dateFrom) where.paymentDate.gte = dateFrom;
    if (dateTo) where.paymentDate.lte = dateTo;
  }

  // Amount range
  if (minAmount !== undefined || maxAmount !== undefined) {
    where.amount = {};
    if (minAmount !== undefined) where.amount.gte = toDecimal(minAmount);
    if (maxAmount !== undefined) where.amount.lte = toDecimal(maxAmount);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            totalAmount: true,
            paidAmount: true,
            customer: {
              select: {
                id: true,
                code: true,
                companyName: true,
              },
            },
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  // Convert Decimal to number for client components
  const serializedPayments = payments.map((p) => ({
    ...p,
    amount: p.amount.toNumber(),
    invoice: p.invoice
      ? {
          ...p.invoice,
          totalAmount: p.invoice.totalAmount.toNumber(),
          paidAmount: p.invoice.paidAmount.toNumber(),
        }
      : null,
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    payments: serializedPayments,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get single payment by ID
 */
export async function getPaymentById(id: string) {
  await requireAuth();

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              companyName: true,
              contactName: true,
              contactPhone: true,
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
            },
          },
        },
      },
      recordedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError(`Không tìm thấy thanh toán có ID: ${id}`);
  }

  return payment;
}

/**
 * Record new payment against invoice
 */
export async function createPayment(data: unknown) {
  const user = await requireAuth();
  const validated = createPaymentSchema.parse(data);

  // Create payment in a transaction with atomic validation
  const payment = await prisma.$transaction(async (tx) => {
    // CRITICAL: Re-fetch invoice INSIDE transaction for fresh data (prevents race condition)
    const invoice = await tx.invoice.findUnique({
      where: { id: validated.invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError(`Không tìm thấy hóa đơn có ID: ${validated.invoiceId}`);
    }

    // Calculate remaining balance with fresh data
    const remainingBalance = subtractDecimal(invoice.totalAmount, invoice.paidAmount);

    // Validate payment amount doesn't exceed remaining balance (INSIDE transaction)
    if (compareDecimal(toDecimal(validated.amount), remainingBalance) > 0) {
      throw new AppError(
        `Số tiền thanh toán (${validated.amount.toLocaleString("vi-VN")}đ) vượt quá số tiền còn lại (${Number(remainingBalance).toLocaleString("vi-VN")}đ)`,
        "PAYMENT_EXCEEDS_BALANCE"
      );
    }

    // Create payment record
    const newPayment = await tx.payment.create({
      data: {
        ...validated,
        amount: toDecimal(validated.amount),
        recordedById: user.user?.id,
      },
      include: {
        invoice: {
          include: {
            customer: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    // Update invoice paidAmount and status
    const newAmountPaid = addDecimal(invoice.paidAmount, toDecimal(validated.amount));
    const newRemainingBalance = subtractDecimal(invoice.totalAmount, newAmountPaid);

    let newStatus = invoice.status;
    if (compareDecimal(newRemainingBalance, toDecimal(0)) === 0) {
      newStatus = "PAID";
    } else if (compareDecimal(newAmountPaid, toDecimal(0)) > 0) {
      newStatus = "PARTIAL";
    }

    await tx.invoice.update({
      where: { id: validated.invoiceId },
      data: {
        paidAmount: newAmountPaid,
        status: newStatus,
      },
    });

    return newPayment;
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${validated.invoiceId}`);

  return payment;
}

/**
 * Update existing payment
 */
export async function updatePayment(id: string, data: unknown) {
  await requireManager(); // Only managers can edit payments

  const validated = updatePaymentSchema.parse(data);

  // Check if payment exists
  const existing = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
        },
      },
    },
  });

  if (!existing) {
    throw new NotFoundError(`Không tìm thấy thanh toán có ID: ${id}`);
  }

  // If verified, don't allow editing
  if (existing.isVerified) {
    throw new AppError("Không thể sửa thanh toán đã được xác minh", "PAYMENT_VERIFIED");
  }

  // If amount is being changed, recalculate invoice balances
  let updatedPayment;

  if (validated.amount !== undefined && validated.amount !== Number(existing.amount)) {
    updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment
      const payment = await tx.payment.update({
        where: { id },
        data: {
          ...validated,
          amount: validated.amount ? toDecimal(validated.amount) : undefined,
        },
      });

      // Recalculate invoice paidAmount
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: existing.invoiceId },
        select: { amount: true },
      });

      const totalPaid = allPayments.reduce((sum, p) => addDecimal(sum, p.amount), toDecimal(0));

      const remainingBalance = subtractDecimal(existing.invoice.totalAmount, totalPaid);

      let newStatus: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" = "SENT";
      if (compareDecimal(remainingBalance, toDecimal(0)) === 0) {
        newStatus = "PAID";
      } else if (compareDecimal(totalPaid, toDecimal(0)) > 0) {
        newStatus = "PARTIAL";
      }

      await tx.invoice.update({
        where: { id: existing.invoiceId },
        data: {
          paidAmount: totalPaid,
          status: newStatus,
        },
      });

      return payment;
    });
  } else {
    // Simple update without amount change
    updatedPayment = await prisma.payment.update({
      where: { id },
      data: validated,
    });
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${existing.invoiceId}`);

  return updatedPayment;
}

/**
 * Verify a payment (mark as verified)
 */
export async function verifyPayment(data: unknown) {
  const user = await requireManager(); // Only managers can verify
  const validated = verifyPaymentSchema.parse(data);

  const payment = await prisma.payment.findUnique({
    where: { id: validated.paymentId },
  });

  if (!payment) {
    throw new NotFoundError(`Không tìm thấy thanh toán có ID: ${validated.paymentId}`);
  }

  if (payment.isVerified) {
    throw new AppError("Thanh toán đã được xác minh trước đó", "ALREADY_VERIFIED");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: validated.paymentId },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verifiedById: user.user?.id,
      notes: validated.notes || payment.notes,
    },
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${payment.invoiceId}`);

  return updatedPayment;
}

/**
 * Delete payment (soft delete by removing from invoice paidAmount)
 */
export async function deletePayment(id: string) {
  await requireManager(); // Only managers can delete

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError(`Không tìm thấy thanh toán có ID: ${id}`);
  }

  // If verified, don't allow deletion
  if (payment.isVerified) {
    throw new AppError("Không thể xóa thanh toán đã được xác minh", "PAYMENT_VERIFIED");
  }

  // Delete in transaction and update invoice
  await prisma.$transaction(async (tx) => {
    // Delete payment
    await tx.payment.delete({
      where: { id },
    });

    // Recalculate invoice paidAmount
    const remainingPayments = await tx.payment.findMany({
      where: { invoiceId: payment.invoiceId },
      select: { amount: true },
    });

    const totalPaid = remainingPayments.reduce((sum, p) => addDecimal(sum, p.amount), toDecimal(0));

    const remainingBalance = subtractDecimal(payment.invoice.totalAmount, totalPaid);

    let newStatus: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" = "SENT";
    if (compareDecimal(totalPaid, toDecimal(0)) === 0) {
      newStatus = "SENT";
    } else if (compareDecimal(remainingBalance, toDecimal(0)) === 0) {
      newStatus = "PAID";
    } else {
      newStatus = "PARTIAL";
    }

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmount: totalPaid,
        status: newStatus,
      },
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${payment.invoiceId}`);

  return { success: true };
}

/**
 * Get payment statistics
 */
export async function getPaymentStats() {
  await requireAuth();

  const stats = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get unverified count
  const unverifiedCount = await prisma.payment.count({
    where: { isVerified: false },
  });

  // Get today's payments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPayments = await prisma.payment.aggregate({
    where: {
      paymentDate: { gte: today },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    totalAmount: stats._sum.amount || toDecimal(0),
    totalCount: stats._count.id,
    unverifiedCount,
    todayAmount: todayPayments._sum.amount || toDecimal(0),
    todayCount: todayPayments._count.id,
  };
}
