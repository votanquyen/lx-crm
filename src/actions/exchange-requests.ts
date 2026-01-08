/**
 * Exchange Request Server Actions
 * CRUD with priority scoring
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import {
  createExchangeRequestSchema,
  updateExchangeRequestSchema,
  exchangeSearchSchema,
  type ExchangeSearchParams,
} from "@/lib/validations/exchange";

/**
 * Calculate priority score based on priority and plant count
 */
function calculatePriorityScore(priority: string, plantCount: number): number {
  let score = 0;

  // Priority weight (0-40)
  switch (priority) {
    case "URGENT":
      score += 40;
      break;
    case "HIGH":
      score += 30;
      break;
    case "MEDIUM":
      score += 15;
      break;
    case "LOW":
      score += 5;
      break;
  }

  // Plant count weight (0-30)
  score += Math.min(plantCount * 3, 30);

  // Base customer score (0-30) - all customers equal
  score += 15;

  return score;
}

/**
 * Get paginated list of exchange requests
 */
export async function getExchangeRequests(params: ExchangeSearchParams) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const validated = exchangeSearchSchema.parse(params);
  const { page, limit, status, priority, customerId } = validated;

  const skip = (page - 1) * limit;

  const where: Prisma.ExchangeRequestWhereInput = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (customerId) where.customerId = customerId;

  const [requests, total] = await Promise.all([
    prisma.exchangeRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      include: {
        customer: {
          select: {
            id: true,
            code: true,
            companyName: true,
            address: true,
            district: true,
          },
        },
      },
    }),
    prisma.exchangeRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get pending exchange requests for scheduling
 */
export async function getPendingExchanges() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const requests = await prisma.exchangeRequest.findMany({
    where: {
      status: { in: ["PENDING", "SCHEDULED"] }, // Use SCHEDULED instead of APPROVED
    },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          address: true,
          district: true,
          latitude: true,
          longitude: true,
        },
      },
    },
    orderBy: { priorityScore: "desc" },
  });

  return requests;
}

/**
 * Get exchange request by ID
 */
export async function getExchangeRequestById(id: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const request = await prisma.exchangeRequest.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          address: true,
          district: true,
          contactName: true,
          contactPhone: true,
        },
      },
    },
  });

  if (!request) throw new NotFoundError("Yêu cầu đổi cây");
  return request;
}

/**
 * Create exchange request
 */
export const createExchangeRequest = createAction(createExchangeRequestSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Verify customer
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new NotFoundError("Khách hàng");

  // Calculate priority score
  const priorityScore = calculatePriorityScore(input.priority, input.quantity);

  const request = await prisma.exchangeRequest.create({
    data: {
      customerId: input.customerId,
      priority: input.priority,
      priorityScore,
      quantity: input.quantity,
      reason: input.reason,
      preferredDate: input.preferredDate,
      currentPlant: input.currentPlant,
      requestedPlant: input.requestedPlant,
      plantLocation: input.plantLocation,
      status: "PENDING",
    },
    include: {
      customer: { select: { id: true, companyName: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "ExchangeRequest",
      entityId: request.id,
      newValues: request as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath("/exchanges");
  revalidatePath(`/customers/${input.customerId}`);
  return request;
});

/**
 * Update exchange request
 */
export const updateExchangeRequest = createAction(updateExchangeRequestSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const { id, ...updateData } = input;

  const existing = await prisma.exchangeRequest.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!existing) throw new NotFoundError("Yêu cầu đổi cây");

  // Cannot update completed/cancelled
  if (["COMPLETED", "CANCELLED"].includes(existing.status)) {
    throw new AppError("Không thể sửa yêu cầu đã hoàn thành hoặc hủy", "INVALID_STATUS");
  }

  // Recalculate priority if priority or quantity changed
  let priorityScore = existing.priorityScore;
  if (updateData.priority || updateData.quantity) {
    const quantity = updateData.quantity || existing.quantity;
    priorityScore = calculatePriorityScore(
      updateData.priority || existing.priority,
      quantity
    );
  }

  const request = await prisma.exchangeRequest.update({
    where: { id },
    data: {
      ...updateData,
      priorityScore,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
    },
  });

  revalidatePath("/exchanges");
  return request;
});

/**
 * Approve exchange request
 */
export const approveExchangeRequest = createSimpleAction(async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const request = await prisma.exchangeRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError("Yêu cầu đổi cây");

  if (request.status !== "PENDING") {
    throw new AppError("Yêu cầu không ở trạng thái chờ duyệt", "INVALID_STATUS");
  }

  const updated = await prisma.exchangeRequest.update({
    where: { id },
    data: { status: "SCHEDULED" }, // Use SCHEDULED instead of APPROVED
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "APPROVE",
      entityType: "ExchangeRequest",
      entityId: id,
    },
  });

  revalidatePath("/exchanges");
  return updated;
});

/**
 * Cancel exchange request
 */
export const cancelExchangeRequest = createSimpleAction(
  async (data: { id: string; reason?: string }) => {
    const session = await auth();
    if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

    const request = await prisma.exchangeRequest.findUnique({ where: { id: data.id } });
    if (!request) throw new NotFoundError("Yêu cầu đổi cây");

    if (request.status === "COMPLETED") {
      throw new AppError("Không thể hủy yêu cầu đã hoàn thành", "INVALID_STATUS");
    }

    const updated = await prisma.exchangeRequest.update({
      where: { id: data.id },
      data: {
        status: "CANCELLED",
        reason: data.reason
          ? `${request.reason || ""}\n[Lý do hủy: ${data.reason}]`
          : request.reason,
      },
    });

    revalidatePath("/exchanges");
    return updated;
  }
);

/**
 * Complete exchange (mark as done)
 */
export const completeExchangeRequest = createSimpleAction(async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const request = await prisma.exchangeRequest.findUnique({ where: { id } });
  if (!request) throw new NotFoundError("Yêu cầu đổi cây");

  if (!["APPROVED", "SCHEDULED"].includes(request.status)) {
    throw new AppError("Yêu cầu chưa được duyệt hoặc lên lịch", "INVALID_STATUS");
  }

  const updated = await prisma.exchangeRequest.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "COMPLETE",
      entityType: "ExchangeRequest",
      entityId: id,
    },
  });

  revalidatePath("/exchanges");
  return updated;
});

/**
 * Get exchange statistics
 */
export async function getExchangeStats() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const [total, pending, scheduled, urgent] = await Promise.all([
    prisma.exchangeRequest.count(),
    prisma.exchangeRequest.count({ where: { status: "PENDING" } }),
    prisma.exchangeRequest.count({ where: { status: "SCHEDULED" } }),
    prisma.exchangeRequest.count({
      where: {
        status: { in: ["PENDING", "SCHEDULED"] },
        priority: { in: ["URGENT", "HIGH"] },
      },
    }),
  ]);

  return {
    total,
    pending,
    scheduled,
    urgent,
    waitingSchedule: pending + scheduled,
  };
}
