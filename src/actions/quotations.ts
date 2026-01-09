/**
 * Quotation Server Actions
 * CRUD operations for quotation management
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireManager } from "@/lib/auth-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { toDecimal } from "@/lib/db-utils";
import {
  createQuotationSchema,
  updateQuotationSchema,
  quotationSearchSchema,
  addQuotationItemSchema,
  updateQuotationItemSchema,
  removeQuotationItemSchema,
  convertToContractSchema,
  sendQuotationSchema,
  type CreateQuotationInput,
  type UpdateQuotationInput,
  type QuotationSearchInput,
  type AddQuotationItemInput,
  type UpdateQuotationItemInput,
  type RemoveQuotationItemInput,
  type ConvertToContractInput,
  type SendQuotationInput,
} from "@/lib/validations/quotation";

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate next quotation number
 * Format: QT-YYYYMM-XXXX
 * Example: QT-202512-0001
 */
async function generateQuotationNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `QT-${year}${month}-`;

  // Find the latest quotation number for this month
  const latestQuotation = await prisma.quotation.findFirst({
    where: {
      quoteNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quoteNumber: "desc",
    },
    select: {
      quoteNumber: true,
    },
  });

  let nextNumber = 1;
  if (latestQuotation) {
    const currentNumber = parseInt(latestQuotation.quoteNumber.split("-")[2] || "0");
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Calculate quotation totals
 */
function calculateQuotationTotals(data: {
  subtotal: number;
  discountRate: number;
  vatRate: number;
}): {
  discountAmount: number;
  vatAmount: number;
  totalAmount: number;
} {
  const subtotalDecimal = toDecimal(data.subtotal);
  const discountRate = data.discountRate || 0;
  const vatRate = data.vatRate || 10;

  // Calculate discount amount
  const discountAmount = subtotalDecimal.times(discountRate).div(100);

  // Subtotal after discount
  const subtotalAfterDiscount = subtotalDecimal.minus(discountAmount);

  // Calculate VAT
  const vatAmount = subtotalAfterDiscount.times(vatRate).div(100);

  // Calculate total
  const totalAmount = subtotalAfterDiscount.plus(vatAmount);

  return {
    discountAmount: parseFloat(discountAmount.toFixed(0)),
    vatAmount: parseFloat(vatAmount.toFixed(0)),
    totalAmount: parseFloat(totalAmount.toFixed(0)),
  };
}

/**
 * Calculate quotation item total
 */
function calculateItemTotal(data: {
  quantity: number;
  unitPrice: number;
  discountRate: number;
}): number {
  const unitPrice = toDecimal(data.unitPrice);
  const quantity = data.quantity;
  const discountRate = data.discountRate || 0;

  // Calculate total price before discount
  const totalBeforeDiscount = unitPrice.times(quantity);

  // Calculate discount amount
  const discountAmount = totalBeforeDiscount.times(discountRate).div(100);

  // Calculate total price
  const totalPrice = totalBeforeDiscount.minus(discountAmount);

  return parseFloat(totalPrice.toFixed(0));
}

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Get paginated list of quotations with filters
 */
export async function getQuotations(params: QuotationSearchInput) {
  await requireAuth();

  const validated = quotationSearchSchema.parse(params);
  const {
    page,
    limit,
    search,
    status,
    customerId,
    createdById,
    validFromStart,
    validFromEnd,
    validUntilStart,
    validUntilEnd,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  } = validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.QuotationWhereInput = {};

  // Search by quote number, title, customer name
  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      {
        customer: {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (createdById) where.createdById = createdById;

  // Valid from date range
  if (validFromStart || validFromEnd) {
    where.validFrom = {};
    if (validFromStart) where.validFrom.gte = validFromStart;
    if (validFromEnd) where.validFrom.lte = validFromEnd;
  }

  // Valid until date range
  if (validUntilStart || validUntilEnd) {
    where.validUntil = {};
    if (validUntilStart) where.validUntil.gte = validUntilStart;
    if (validUntilEnd) where.validUntil.lte = validUntilEnd;
  }

  // Amount range
  if (minAmount !== undefined || maxAmount !== undefined) {
    where.totalAmount = {};
    if (minAmount !== undefined) where.totalAmount.gte = toDecimal(minAmount);
    if (maxAmount !== undefined) where.totalAmount.lte = toDecimal(maxAmount);
  }

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            companyName: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            plantType: {
              select: {
                id: true,
                code: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.quotation.count({ where }),
  ]);

  // Convert Decimal to number for client components
  const serializedQuotations = quotations.map((q) => ({
    ...q,
    subtotal: q.subtotal.toNumber(),
    discountRate: q.discountRate?.toNumber() ?? 0,
    discountAmount: q.discountAmount?.toNumber() ?? null,
    vatRate: q.vatRate.toNumber(),
    vatAmount: q.vatAmount.toNumber(),
    totalAmount: q.totalAmount.toNumber(),
    items: q.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      discountRate: item.discountRate?.toNumber() ?? null,
      totalPrice: item.totalPrice.toNumber(),
    })),
  }));

  const totalPages = Math.ceil(total / limit);

  return {
    quotations: serializedQuotations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Get single quotation by ID with all details
 */
export async function getQuotationById(id: string) {
  await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          contactEmail: true,
          contactPhone: true,
          address: true,
          taxCode: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          plantType: {
            select: {
              id: true,
              code: true,
              name: true,
              description: true,
              imageUrl: true,
              rentalPrice: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  return quotation;
}

/**
 * Get quotation statistics for dashboard
 */
export async function getQuotationStats() {
  await requireAuth();

  const [total, draft, sent, accepted, rejected, expired, converted] = await Promise.all([
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: "DRAFT" } }),
    prisma.quotation.count({ where: { status: "SENT" } }),
    prisma.quotation.count({ where: { status: "ACCEPTED" } }),
    prisma.quotation.count({ where: { status: "REJECTED" } }),
    prisma.quotation.count({ where: { status: "EXPIRED" } }),
    prisma.quotation.count({ where: { status: "CONVERTED" } }),
  ]);

  const pending = sent; // SENT + VIEWED (you can add VIEWED count if needed)
  const conversionRate = accepted > 0 ? ((converted / accepted) * 100).toFixed(1) : "0.0";

  return {
    total,
    draft,
    sent,
    pending,
    accepted,
    rejected,
    expired,
    converted,
    conversionRate: parseFloat(conversionRate),
  };
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * Create new quotation
 */
export async function createQuotation(data: CreateQuotationInput) {
  const session = await requireAuth();

  const validated = createQuotationSchema.parse(data);

  // Generate quotation number
  const quoteNumber = await generateQuotationNumber();

  // Calculate subtotal from items
  let subtotal = 0;
  for (const item of validated.items) {
    const itemTotal = calculateItemTotal({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
    });
    subtotal += itemTotal;
  }

  // Calculate totals
  const totals = calculateQuotationTotals({
    subtotal,
    discountRate: validated.discountRate,
    vatRate: validated.vatRate,
  });

  // Create quotation with items in a transaction
  const quotation = await prisma.$transaction(async (tx) => {
    const newQuotation = await tx.quotation.create({
      data: {
        quoteNumber,
        customerId: validated.customerId,
        createdById: session.user.id,
        title: validated.title,
        description: validated.description,
        validFrom: validated.validFrom,
        validUntil: validated.validUntil,
        subtotal: toDecimal(subtotal),
        discountRate: toDecimal(validated.discountRate),
        discountAmount: toDecimal(totals.discountAmount),
        vatRate: toDecimal(validated.vatRate),
        vatAmount: toDecimal(totals.vatAmount),
        totalAmount: toDecimal(totals.totalAmount),
        proposedStartDate: validated.proposedStartDate,
        proposedDuration: validated.proposedDuration,
        proposedMonthlyFee: validated.proposedMonthlyFee
          ? toDecimal(validated.proposedMonthlyFee)
          : null,
        proposedDeposit: validated.proposedDeposit ? toDecimal(validated.proposedDeposit) : null,
        notes: validated.notes,
        termsConditions: validated.termsConditions,
        internalNotes: validated.internalNotes,
        status: "DRAFT",
      },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create quotation items
    if (validated.items && validated.items.length > 0) {
      await tx.quotationItem.createMany({
        data: validated.items.map((item) => ({
          quotationId: newQuotation.id,
          plantTypeId: item.plantTypeId,
          quantity: item.quantity,
          unitPrice: toDecimal(item.unitPrice),
          discountRate: toDecimal(item.discountRate),
          totalPrice: toDecimal(
            calculateItemTotal({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountRate: item.discountRate,
            })
          ),
          locationNote: item.locationNote,
          notes: item.notes,
        })),
      });
    }

    return newQuotation;
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotation.id}`);

  return quotation;
}

/**
 * Update quotation
 * Only allowed for DRAFT quotations
 */
export async function updateQuotation(data: UpdateQuotationInput) {
  await requireAuth();

  const validated = updateQuotationSchema.parse(data);
  const { id, ...updateData } = validated;

  // Check if quotation exists and is editable
  const existing = await prisma.quotation.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (existing.status !== "DRAFT") {
    throw new AppError(
      "Không thể chỉnh sửa báo giá đã gửi. Chỉ báo giá nháp mới có thể chỉnh sửa."
    );
  }

  // Recalculate totals if needed
  let totals = {};
  if (
    updateData.subtotal !== undefined ||
    updateData.discountRate !== undefined ||
    updateData.vatRate !== undefined
  ) {
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id },
      select: { subtotal: true, discountRate: true, vatRate: true },
    });

    if (currentQuotation) {
      totals = calculateQuotationTotals({
        subtotal:
          updateData.subtotal !== undefined
            ? updateData.subtotal
            : parseFloat(currentQuotation.subtotal.toString()),
        discountRate:
          updateData.discountRate !== undefined
            ? updateData.discountRate
            : parseFloat(currentQuotation.discountRate.toString()),
        vatRate:
          updateData.vatRate !== undefined
            ? updateData.vatRate
            : parseFloat(currentQuotation.vatRate.toString()),
      });
    }
  }

  const { customerId: _customerId, items: _items, ...updateFields } = updateData;

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      ...updateFields,
      ...(updateFields.subtotal !== undefined && {
        subtotal: toDecimal(updateFields.subtotal),
      }),
      ...(updateFields.discountRate !== undefined && {
        discountRate: toDecimal(updateFields.discountRate),
      }),
      ...(updateFields.vatRate !== undefined && {
        vatRate: toDecimal(updateFields.vatRate),
      }),
      ...(updateFields.proposedMonthlyFee !== undefined && {
        proposedMonthlyFee:
          updateFields.proposedMonthlyFee !== null
            ? toDecimal(updateFields.proposedMonthlyFee)
            : null,
      }),
      ...(updateFields.proposedDeposit !== undefined && {
        proposedDeposit:
          updateFields.proposedDeposit !== null ? toDecimal(updateFields.proposedDeposit) : null,
      }),
      ...totals,
    },
    include: {
      customer: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          plantType: true,
        },
      },
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);

  return quotation;
}

/**
 * Delete quotation
 * Only allowed for DRAFT quotations and only by managers
 */
export async function deleteQuotation(id: string) {
  await requireManager();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { status: true, quoteNumber: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "DRAFT") {
    throw new AppError("Chỉ có thể xóa báo giá nháp");
  }

  await prisma.quotation.delete({
    where: { id },
  });

  revalidatePath("/quotations");

  return { success: true, quoteNumber: quotation.quoteNumber };
}

// ============================================================
// QUOTATION ITEM OPERATIONS
// ============================================================

/**
 * Add item to quotation
 */
export async function addQuotationItem(data: AddQuotationItemInput) {
  await requireAuth();

  const validated = addQuotationItemSchema.parse(data);

  // Check if quotation is editable
  const quotation = await prisma.quotation.findUnique({
    where: { id: validated.quotationId },
    select: { status: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "DRAFT") {
    throw new AppError("Không thể thêm sản phẩm vào báo giá đã gửi");
  }

  // Calculate item total
  const totalPrice = calculateItemTotal({
    quantity: validated.quantity,
    unitPrice: validated.unitPrice,
    discountRate: validated.discountRate,
  });

  // Create item
  const item = await prisma.quotationItem.create({
    data: {
      quotationId: validated.quotationId,
      plantTypeId: validated.plantTypeId,
      quantity: validated.quantity,
      unitPrice: toDecimal(validated.unitPrice),
      discountRate: toDecimal(validated.discountRate),
      totalPrice: toDecimal(totalPrice),
      locationNote: validated.locationNote,
      notes: validated.notes,
    },
    include: {
      plantType: true,
    },
  });

  // Recalculate quotation totals
  const items = await prisma.quotationItem.findMany({
    where: { quotationId: validated.quotationId },
    select: { totalPrice: true },
  });

  const newSubtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);

  const currentQuotation = await prisma.quotation.findUnique({
    where: { id: validated.quotationId },
    select: { discountRate: true, vatRate: true },
  });

  if (currentQuotation) {
    const totals = calculateQuotationTotals({
      subtotal: newSubtotal,
      discountRate: parseFloat(currentQuotation.discountRate.toString()),
      vatRate: parseFloat(currentQuotation.vatRate.toString()),
    });

    await prisma.quotation.update({
      where: { id: validated.quotationId },
      data: {
        subtotal: toDecimal(newSubtotal),
        discountAmount: toDecimal(totals.discountAmount),
        vatAmount: toDecimal(totals.vatAmount),
        totalAmount: toDecimal(totals.totalAmount),
      },
    });
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${validated.quotationId}`);

  return item;
}

/**
 * Update quotation item
 */
export async function updateQuotationItem(data: UpdateQuotationItemInput) {
  await requireAuth();

  const validated = updateQuotationItemSchema.parse(data);
  const { id, ...updateData } = validated;

  // Get item and check if quotation is editable
  const item = await prisma.quotationItem.findUnique({
    where: { id },
    include: {
      quotation: {
        select: { status: true },
      },
    },
  });

  if (!item) {
    throw new NotFoundError("Không tìm thấy sản phẩm");
  }

  if (item.quotation.status !== "DRAFT") {
    throw new AppError("Không thể chỉnh sửa sản phẩm của báo giá đã gửi");
  }

  // Recalculate total if price or quantity changed
  let totalPrice = parseFloat(item.totalPrice.toString());
  if (
    updateData.quantity !== undefined ||
    updateData.unitPrice !== undefined ||
    updateData.discountRate !== undefined
  ) {
    totalPrice = calculateItemTotal({
      quantity: updateData.quantity ?? item.quantity,
      unitPrice: updateData.unitPrice ?? parseFloat(item.unitPrice.toString()),
      discountRate: updateData.discountRate ?? parseFloat(item.discountRate.toString()),
    });
  }

  const updatedItem = await prisma.quotationItem.update({
    where: { id },
    data: {
      ...updateData,
      ...(updateData.unitPrice !== undefined && {
        unitPrice: toDecimal(updateData.unitPrice),
      }),
      ...(updateData.discountRate !== undefined && {
        discountRate: toDecimal(updateData.discountRate),
      }),
      totalPrice: toDecimal(totalPrice),
    },
    include: {
      plantType: true,
    },
  });

  // Recalculate quotation totals
  const items = await prisma.quotationItem.findMany({
    where: { quotationId: item.quotationId },
    select: { totalPrice: true },
  });

  const newSubtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);

  const quotation = await prisma.quotation.findUnique({
    where: { id: item.quotationId },
    select: { discountRate: true, vatRate: true },
  });

  if (quotation) {
    const totals = calculateQuotationTotals({
      subtotal: newSubtotal,
      discountRate: parseFloat(quotation.discountRate.toString()),
      vatRate: parseFloat(quotation.vatRate.toString()),
    });

    await prisma.quotation.update({
      where: { id: item.quotationId },
      data: {
        subtotal: toDecimal(newSubtotal),
        discountAmount: toDecimal(totals.discountAmount),
        vatAmount: toDecimal(totals.vatAmount),
        totalAmount: toDecimal(totals.totalAmount),
      },
    });
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${item.quotationId}`);

  return updatedItem;
}

/**
 * Remove quotation item
 */
export async function removeQuotationItem(data: RemoveQuotationItemInput) {
  await requireAuth();

  const validated = removeQuotationItemSchema.parse(data);

  // Get item and check if quotation is editable
  const item = await prisma.quotationItem.findUnique({
    where: { id: validated.id },
    include: {
      quotation: {
        select: { status: true },
      },
    },
  });

  if (!item) {
    throw new NotFoundError("Không tìm thấy sản phẩm");
  }

  if (item.quotation.status !== "DRAFT") {
    throw new AppError("Không thể xóa sản phẩm của báo giá đã gửi");
  }

  await prisma.quotationItem.delete({
    where: { id: validated.id },
  });

  // Recalculate quotation totals
  const items = await prisma.quotationItem.findMany({
    where: { quotationId: item.quotationId },
    select: { totalPrice: true },
  });

  const newSubtotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);

  const quotation = await prisma.quotation.findUnique({
    where: { id: item.quotationId },
    select: { discountRate: true, vatRate: true },
  });

  if (quotation) {
    const totals = calculateQuotationTotals({
      subtotal: newSubtotal,
      discountRate: parseFloat(quotation.discountRate.toString()),
      vatRate: parseFloat(quotation.vatRate.toString()),
    });

    await prisma.quotation.update({
      where: { id: item.quotationId },
      data: {
        subtotal: toDecimal(newSubtotal),
        discountAmount: toDecimal(totals.discountAmount),
        vatAmount: toDecimal(totals.vatAmount),
        totalAmount: toDecimal(totals.totalAmount),
      },
    });
  }

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${item.quotationId}`);

  return { success: true };
}

// ============================================================
// STATUS MANAGEMENT
// ============================================================

/**
 * Send quotation to customer
 * Changes status from DRAFT to SENT
 */
export async function sendQuotation(data: SendQuotationInput) {
  await requireAuth();

  const validated = sendQuotationSchema.parse(data);

  const quotation = await prisma.quotation.findUnique({
    where: { id: validated.quotationId },
    select: { status: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "DRAFT") {
    throw new AppError("Chỉ có thể gửi báo giá nháp");
  }

  const updated = await prisma.quotation.update({
    where: { id: validated.quotationId },
    data: {
      status: "SENT",
    },
    include: {
      customer: true,
      items: {
        include: {
          plantType: true,
        },
      },
    },
  });

  // TODO: Send email with PDF attachment
  // await sendQuotationEmail(updated, validated.recipientEmail, validated.message);

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${validated.quotationId}`);

  return updated;
}

/**
 * Mark quotation as viewed by customer
 * Note: VIEWED status not in schema - just returns the quotation unchanged
 */
export async function markQuotationAsViewed(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  // VIEWED status not available in current schema - just return quotation
  return quotation;
}

/**
 * Accept quotation (customer accepts)
 */
export async function acceptQuotation(id: string, response?: string) {
  await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "SENT") {
    throw new AppError("Chỉ có thể chấp nhận báo giá đã gửi");
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      status: "ACCEPTED",
      customerResponse: response,
      responseDate: new Date(),
    },
    include: {
      customer: true,
      items: {
        include: {
          plantType: true,
        },
      },
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);

  return updated;
}

/**
 * Reject quotation (customer rejects)
 */
export async function rejectQuotation(id: string, reason?: string) {
  await requireAuth();

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "SENT") {
    throw new AppError("Chỉ có thể từ chối báo giá đã gửi");
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      responseDate: new Date(),
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${id}`);

  return updated;
}

/**
 * Mark expired quotations
 * Should be run daily via cron job
 */
export async function markExpiredQuotations() {
  const now = new Date();

  const result = await prisma.quotation.updateMany({
    where: {
      status: {
        in: ["SENT"],
      },
      validUntil: {
        lt: now,
      },
    },
    data: {
      status: "EXPIRED",
    },
  });

  revalidatePath("/quotations");

  return { count: result.count };
}

// ============================================================
// CONVERSION TO CONTRACT
// ============================================================

/**
 * Convert accepted quotation to contract
 * TODO: Implement when contract creation is ready
 */
export async function convertQuotationToContract(data: ConvertToContractInput) {
  await requireAuth();

  const validated = convertToContractSchema.parse(data);

  const quotation = await prisma.quotation.findUnique({
    where: { id: validated.quotationId },
    include: {
      items: {
        include: {
          plantType: true,
        },
      },
      customer: true,
    },
  });

  if (!quotation) {
    throw new NotFoundError("Không tìm thấy báo giá");
  }

  if (quotation.status !== "ACCEPTED") {
    throw new AppError("Chỉ có thể chuyển đổi báo giá đã được chấp nhận");
  }

  if (quotation.convertedToContractId) {
    throw new AppError("Báo giá này đã được chuyển đổi thành hợp đồng");
  }

  // TODO: Create contract when contract module is ready
  // For now, just mark as converted
  const updated = await prisma.quotation.update({
    where: { id: validated.quotationId },
    data: {
      status: "CONVERTED",
      convertedAt: new Date(),
      // convertedToContractId: contract.id,
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${validated.quotationId}`);

  return {
    success: true,
    message:
      "Báo giá đã được đánh dấu là đã chuyển đổi. Tính năng tạo hợp đồng sẽ được triển khai sau.",
    quotation: updated,
  };
}
