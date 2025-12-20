/**
 * Contract Server Actions
 * CRUD operations with status transitions
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { differenceInMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAction, createSimpleAction, requireRole, uuidSchema } from "@/lib/action-utils";
import { AppError, NotFoundError, ConflictError } from "@/lib/errors";
import { toDecimal, toNumber, addDecimal, multiplyDecimal } from "@/lib/db-utils";
import {
  createContractSchema,
  updateContractSchema,
  contractSearchSchema,
  type ContractSearchParams,
} from "@/lib/validations/contract";

/**
 * Generate next contract number (HD-YYYYMM-XXXX)
 */
async function generateContractNumber(): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `HD-${yearMonth}-`;

  const lastContract = await prisma.contract.findFirst({
    where: { contractNumber: { startsWith: prefix } },
    orderBy: { contractNumber: "desc" },
    select: { contractNumber: true },
  });

  let nextNumber = 1;
  if (lastContract?.contractNumber) {
    const match = lastContract.contractNumber.match(/-(\d{4})$/);
    if (match?.[1]) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Get paginated list of contracts with filters
 */
export async function getContracts(params: ContractSearchParams) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const validated = contractSearchSchema.parse(params);
  const { page, limit, search, status, customerId, expiringDays } = validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ContractWhereInput = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  // Search by contract number or customer name
  if (search && search.trim()) {
    where.OR = [
      { contractNumber: { contains: search, mode: "insensitive" } },
      { customer: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Expiring within X days
  if (expiringDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + expiringDays);
    where.status = "ACTIVE";
    where.endDate = { lte: futureDate, gte: new Date() };
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, code: true, companyName: true },
        },
        items: {
          include: {
            plantType: { select: { id: true, name: true, code: true } },
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
    }),
    prisma.contract.count({ where }),
  ]);

  // Convert Decimal to number for client components
  const serializedContracts = contracts.map((contract) => ({
    ...contract,
    monthlyFee: contract.monthlyFee.toNumber(),
    depositAmount: contract.depositAmount?.toNumber() ?? null,
    setupFee: contract.setupFee?.toNumber() ?? null,
    vatRate: contract.vatRate.toNumber(),
    discountPercent: contract.discountPercent?.toNumber() ?? null,
    discountAmount: contract.discountAmount?.toNumber() ?? null,
    totalMonthlyAmount: contract.totalMonthlyAmount?.toNumber() ?? null,
    totalContractValue: contract.totalContractValue?.toNumber() ?? null,
    // Add aliases for contract-table compatibility
    monthlyAmount: contract.totalMonthlyAmount?.toNumber() ?? contract.monthlyFee.toNumber(),
    totalAmount: contract.totalContractValue?.toNumber() ?? 0,
    items: contract.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toNumber(),
      discountRate: item.discountRate?.toNumber() ?? null,
      totalPrice: item.totalPrice.toNumber(),
    })),
  }));

  return {
    data: serializedContracts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single contract by ID with full details
 */
export async function getContractById(id: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const contract = await prisma.contract.findUnique({
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
        },
      },
      items: {
        include: {
          plantType: { select: { id: true, name: true, code: true, rentalPrice: true } },
        },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 10,
      },
      // Previous contract for renewals (uses previousContractId)
    },
  });

  if (!contract) throw new NotFoundError("Hợp đồng");
  return contract;
}

/**
 * Create a new contract
 */
export const createContract = createAction(createContractSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, status: true },
  });
  if (!customer) throw new NotFoundError("Khách hàng");
  if (customer.status === "TERMINATED") {
    throw new AppError("Khách hàng đã ngừng hoạt động", "CUSTOMER_TERMINATED");
  }

  // Validate dates
  if (input.endDate <= input.startDate) {
    throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", "INVALID_DATES");
  }

  // Calculate contract duration in months
  const months = differenceInMonths(input.endDate, input.startDate) + 1;

  // Verify plant types exist and get prices
  const plantTypeIds = input.items.map((item) => item.plantTypeId);
  const plantTypes = await prisma.plantType.findMany({
    where: { id: { in: plantTypeIds } },
    select: { id: true, rentalPrice: true },
  });

  if (plantTypes.length !== plantTypeIds.length) {
    throw new AppError("Một số loại cây không tồn tại", "INVALID_PLANT_TYPES");
  }

  // Calculate monthly amount
  let monthlyAmount = toDecimal(0);
  const itemsData = input.items.map((item) => {
    const plantType = plantTypes.find((pt) => pt.id === item.plantTypeId);
    const unitPrice = toDecimal(item.unitPrice ?? toNumber(plantType?.rentalPrice ?? 0));
    const totalPrice = multiplyDecimal(unitPrice, item.quantity);
    monthlyAmount = addDecimal(monthlyAmount, totalPrice);

    return {
      plantTypeId: item.plantTypeId,
      quantity: item.quantity,
      unitPrice: toNumber(unitPrice),
      totalPrice: toNumber(totalPrice),
      notes: item.notes,
    };
  });

  const totalAmount = multiplyDecimal(monthlyAmount, months);

  // Generate contract number
  const contractNumber = await generateContractNumber();

  // Create contract with items
  const contract = await prisma.contract.create({
    data: {
      contractNumber,
      customerId: input.customerId,
      status: "DRAFT",
      startDate: input.startDate,
      endDate: input.endDate,
      monthlyFee: toNumber(monthlyAmount),
      totalContractValue: toNumber(totalAmount),
      depositAmount: input.depositAmount ?? 0,
      paymentTerms: input.paymentTerms,
      termsNotes: input.notes, // Use termsNotes instead of notes
      items: {
        create: itemsData,
      },
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      items: {
        include: { plantType: { select: { id: true, name: true } } },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Contract",
      entityId: contract.id,
      newValues: contract as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath("/contracts");
  revalidatePath(`/customers/${input.customerId}`);
  return contract;
});

/**
 * Update contract (only DRAFT contracts can be updated)
 */
export const updateContract = createAction(updateContractSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const { id, ...updateData } = input;

  // Get existing contract
  const existing = await prisma.contract.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) throw new NotFoundError("Hợp đồng");

  // Only DRAFT contracts can be fully updated
  if (existing.status !== "DRAFT") {
    throw new AppError("Chỉ có thể sửa hợp đồng ở trạng thái Nháp", "INVALID_STATUS");
  }

  // Validate dates if provided
  const startDate = updateData.startDate ?? existing.startDate;
  const endDate = updateData.endDate ?? existing.endDate;
  if (endDate <= startDate) {
    throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", "INVALID_DATES");
  }

  // Calculate new amounts if items changed
  let monthlyFee: number | Prisma.Decimal | null = existing.monthlyFee;
  let totalContractValue: number | Prisma.Decimal | null = existing.totalContractValue;
  let itemsData: Prisma.ContractItemCreateManyContractInput[] | undefined;

  if (updateData.items) {
    const months = differenceInMonths(endDate, startDate) + 1;

    const plantTypeIds = updateData.items.map((item) => item.plantTypeId);
    const plantTypes = await prisma.plantType.findMany({
      where: { id: { in: plantTypeIds } },
      select: { id: true, rentalPrice: true },
    });

    if (plantTypes.length !== plantTypeIds.length) {
      throw new AppError("Một số loại cây không tồn tại", "INVALID_PLANT_TYPES");
    }

    monthlyFee = toDecimal(0);
    itemsData = updateData.items.map((item) => {
      const plantType = plantTypes.find((pt) => pt.id === item.plantTypeId);
      const unitPrice = toDecimal(item.unitPrice ?? toNumber(plantType?.rentalPrice ?? 0));
      const totalPrice = multiplyDecimal(unitPrice, item.quantity);
      monthlyFee = addDecimal(monthlyFee ?? toDecimal(0), totalPrice);

      return {
        plantTypeId: item.plantTypeId,
        quantity: item.quantity,
        unitPrice: toNumber(unitPrice),
        totalPrice: toNumber(totalPrice),
        notes: item.notes,
      };
    });

    totalContractValue = multiplyDecimal(monthlyFee, months);
  }

  // Update contract
  const contract = await prisma.$transaction(async (tx) => {
    // Delete existing items if new items provided
    if (itemsData) {
      await tx.contractItem.deleteMany({ where: { contractId: id } });
    }

    return tx.contract.update({
      where: { id },
      data: {
        startDate,
        endDate,
        monthlyFee: monthlyFee ? toNumber(monthlyFee) : existing.monthlyFee,
        totalContractValue: totalContractValue ? toNumber(totalContractValue) : existing.totalContractValue,
        depositAmount: updateData.depositAmount ?? existing.depositAmount,
        paymentTerms: updateData.paymentTerms ?? existing.paymentTerms,
        termsNotes: updateData.notes ?? existing.termsNotes,
        ...(itemsData && {
          items: { createMany: { data: itemsData } },
        }),
      },
      include: {
        customer: { select: { id: true, companyName: true } },
        items: {
          include: { plantType: { select: { id: true, name: true } } },
        },
      },
    });
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Contract",
      entityId: contract.id,
      oldValues: existing as unknown as Prisma.JsonObject,
      newValues: contract as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  return contract;
});

/**
 * Activate a contract (DRAFT/PENDING -> ACTIVE)
 * Requires ADMIN or MANAGER role
 */
export const activateContract = createSimpleAction(async (id: string) => {
  // Validate ID format and require role
  uuidSchema.parse(id);
  const user = await requireRole("ADMIN", "MANAGER");

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!contract) throw new NotFoundError("Hợp đồng");

  if (!["DRAFT", "PENDING"].includes(contract.status)) {
    throw new AppError("Hợp đồng không thể kích hoạt", "INVALID_STATUS");
  }

  // Batch fetch all required inventories
  const plantTypeIds = contract.items.map((item) => item.plantTypeId);

  // Update contract and inventory atomically in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Fetch inventories inside transaction for atomicity
    const inventories = await tx.inventory.findMany({
      where: { plantTypeId: { in: plantTypeIds } },
    });

    // Verify all items have sufficient stock
    for (const item of contract.items) {
      const inventory = inventories.find((inv) => inv.plantTypeId === item.plantTypeId);
      if (!inventory || inventory.availableStock < item.quantity) {
        throw new AppError(
          `Không đủ cây trong kho (cần ${item.quantity}, có ${inventory?.availableStock ?? 0})`,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    // Update contract status
    const updatedContract = await tx.contract.update({
      where: { id },
      data: { status: "ACTIVE" },
    });

    // Create customer plants and update inventory
    for (const item of contract.items) {
      // Create CustomerPlant records (without contractId field)
      await tx.customerPlant.create({
        data: {
          customerId: contract.customerId,
          plantTypeId: item.plantTypeId,
          quantity: item.quantity,
          status: "ACTIVE",
          installedAt: new Date(),
        },
      });

      // Update inventory
      await tx.inventory.update({
        where: { plantTypeId: item.plantTypeId },
        data: {
          availableStock: { decrement: item.quantity },
          rentedStock: { increment: item.quantity },
        },
      });
    }

    // Update customer status if lead
    if (contract.customer.status === "LEAD") {
      await tx.customer.update({
        where: { id: contract.customerId },
        data: { status: "ACTIVE" },
      });
    }

    return updatedContract;
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "ACTIVATE",
      entityType: "Contract",
      entityId: id,
    },
  });

  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath(`/customers/${contract.customerId}`);
  return updated;
});

/**
 * Cancel a contract
 * Requires ADMIN or MANAGER role
 */
export const cancelContract = createSimpleAction(
  async (data: { id: string; reason?: string }) => {
    uuidSchema.parse(data.id);
    const user = await requireRole("ADMIN", "MANAGER");

    const contract = await prisma.contract.findUnique({
      where: { id: data.id },
      include: { items: true },
    });
    if (!contract) throw new NotFoundError("Hợp đồng");

    if (contract.status === "CANCELLED") {
      throw new AppError("Hợp đồng đã bị hủy", "ALREADY_CANCELLED");
    }

    // If active, return inventory
    const wasActive = contract.status === "ACTIVE";

    const updated = await prisma.$transaction(async (tx) => {
      // Update contract
      const updatedContract = await tx.contract.update({
        where: { id: data.id },
        data: {
          status: "CANCELLED",
          termsNotes: data.reason
            ? `${contract.termsNotes || ""}\n[Lý do hủy: ${data.reason}]`
            : contract.termsNotes,
        },
      });

      // Return inventory if was active
      if (wasActive) {
        for (const item of contract.items) {
          // Update customer plants (remove contractId filter)
          await tx.customerPlant.updateMany({
            where: {
              customerId: contract.customerId,
              plantTypeId: item.plantTypeId,
              status: "ACTIVE",
            },
            data: { status: "REMOVED" }, // Use REMOVED instead of RETURNED
          });

          // Return to inventory
          await tx.inventory.update({
            where: { plantTypeId: item.plantTypeId },
            data: {
              availableStock: { increment: item.quantity },
              rentedStock: { decrement: item.quantity },
            },
          });
        }
      }

      return updatedContract;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CANCEL",
        entityType: "Contract",
        entityId: data.id,
        newValues: { reason: data.reason } as Prisma.JsonObject,
      },
    });

    revalidatePath(`/contracts/${data.id}`);
    revalidatePath("/contracts");
    return updated;
  }
);

/**
 * Renew a contract (creates new contract linked to old)
 * Requires ADMIN or MANAGER role
 */
export const renewContract = createSimpleAction(
  async (data: {
    id: string;
    startDate: Date;
    endDate: Date;
    adjustments?: { plantTypeId: string; quantity: number; unitPrice?: number }[];
  }) => {
    uuidSchema.parse(data.id);
    const user = await requireRole("ADMIN", "MANAGER");

    const oldContract = await prisma.contract.findUnique({
      where: { id: data.id },
      include: { items: true, customer: true },
    });
    if (!oldContract) throw new NotFoundError("Hợp đồng");

    if (!["ACTIVE", "EXPIRED"].includes(oldContract.status)) {
      throw new AppError("Chỉ có thể gia hạn hợp đồng đang hoạt động hoặc hết hạn", "INVALID_STATUS");
    }

    // Check if already renewed by checking if another contract has this as previousContractId
    const existingRenewal = await prisma.contract.findFirst({
      where: { previousContractId: oldContract.id },
    });
    if (existingRenewal) {
      throw new ConflictError("Hợp đồng đã được gia hạn trước đó");
    }

    // Validate dates
    if (data.endDate <= data.startDate) {
      throw new AppError("Ngày kết thúc phải sau ngày bắt đầu", "INVALID_DATES");
    }

    // Calculate new contract details
    const months = differenceInMonths(data.endDate, data.startDate) + 1;

    // Use adjustments or copy from old contract
    const itemsData = data.adjustments
      ? data.adjustments.map((adj) => {
          const oldItem = oldContract.items.find((i) => i.plantTypeId === adj.plantTypeId);
          const unitPrice = toDecimal(adj.unitPrice ?? toNumber(oldItem?.unitPrice ?? 0));
          const totalPrice = multiplyDecimal(unitPrice, adj.quantity);
          return {
            plantTypeId: adj.plantTypeId,
            quantity: adj.quantity,
            unitPrice: toNumber(unitPrice),
            totalPrice: toNumber(totalPrice),
          };
        })
      : oldContract.items.map((item) => ({
          plantTypeId: item.plantTypeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }));

    const monthlyAmount = itemsData.reduce(
      (sum, item) => addDecimal(sum, toDecimal(toNumber(item.totalPrice))),
      toDecimal(0)
    );
    const totalAmount = multiplyDecimal(monthlyAmount, months);

    // Generate new contract number
    const contractNumber = await generateContractNumber();

    // Create new contract and update old
    const newContract = await prisma.$transaction(async (tx) => {
      // Create new contract
      const created = await tx.contract.create({
        data: {
          contractNumber,
          customerId: oldContract.customerId,
          status: "DRAFT",
          startDate: data.startDate,
          endDate: data.endDate,
          monthlyFee: toNumber(monthlyAmount),
          totalContractValue: toNumber(totalAmount),
          depositAmount: oldContract.depositAmount,
          paymentTerms: oldContract.paymentTerms,
          termsNotes: `Gia hạn từ hợp đồng ${oldContract.contractNumber}`,
          previousContractId: oldContract.id, // Use previousContractId instead of renewedFromId
          items: {
            create: itemsData,
          },
        },
        include: {
          customer: { select: { id: true, companyName: true } },
          items: true,
        },
      });

      // Update old contract status (use TERMINATED instead of non-existent RENEWED)
      await tx.contract.update({
        where: { id: data.id },
        data: { status: "TERMINATED", terminationReason: "Renewed" },
      });

      return created;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "RENEW",
        entityType: "Contract",
        entityId: data.id,
        newValues: { newContractId: newContract.id } as Prisma.JsonObject,
      },
    });

    revalidatePath(`/contracts/${data.id}`);
    revalidatePath("/contracts");
    return newContract;
  }
);

/**
 * Get contract statistics
 */
export async function getContractStats() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  // Single query with FILTER instead of 4 separate queries
  const stats = await prisma.$queryRaw<[{
    total: bigint;
    active: bigint;
    expiring_soon: bigint;
    monthly_recurring: any;
  }]>`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
      COUNT(*) FILTER (WHERE status = 'ACTIVE' AND "endDate" <= ${thirtyDaysFromNow} AND "endDate" >= ${now}) as expiring_soon,
      COALESCE(SUM("monthlyFee") FILTER (WHERE status = 'ACTIVE'), 0) as monthly_recurring
    FROM contracts
  `;

  return {
    total: Number(stats[0].total),
    active: Number(stats[0].active),
    expiringSoon: Number(stats[0].expiring_soon),
    monthlyRecurring: Number(stats[0].monthly_recurring || 0),
  };
}

/**
 * Get expiring contracts for notifications
 */
export async function getExpiringContracts(days: number = 30) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);

  const contracts = await prisma.contract.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lte: futureDate, gte: now },
    },
    include: {
      customer: {
        select: { id: true, code: true, companyName: true, contactPhone: true },
      },
    },
    orderBy: { endDate: "asc" },
  });

  return contracts;
}
