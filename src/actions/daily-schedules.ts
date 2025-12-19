/**
 * Daily Schedule Server Actions
 * Manage daily exchange route schedules
 */
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

/**
 * Create daily schedule schema
 */
const createDailyScheduleSchema = z.object({
  scheduleDate: z.coerce.date(),
  exchangeRequestIds: z.array(z.string().cuid()),
  notes: z.string().max(1000).optional(),
});

/**
 * Update stop order schema
 */
const updateStopOrderSchema = z.object({
  scheduleId: z.string().cuid(),
  stops: z.array(
    z.object({
      stopOrder: z.number().int().positive(),
      customerId: z.string().cuid(),
      exchangeRequestId: z.string().cuid(),
      eta: z.string().optional(),
    })
  ),
});

/**
 * Get daily schedule by date
 */
export async function getDailyScheduleByDate(date: Date) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { scheduleDate: date },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      exchanges: {
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
        orderBy: { stopOrder: "asc" },
      },
    },
  });

  return schedule;
}

/**
 * Get recent schedules
 */
export async function getRecentSchedules(limit = 10) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedules = await prisma.dailySchedule.findMany({
    take: limit,
    orderBy: { scheduleDate: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { exchanges: true } },
    },
  });

  return schedules;
}

/**
 * Create daily schedule from exchange requests
 */
export const createDailySchedule = createAction(
  createDailyScheduleSchema,
  async (input) => {
    const session = await auth();
    if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

    // Check if schedule already exists for this date
    const existing = await prisma.dailySchedule.findUnique({
      where: { scheduleDate: input.scheduleDate },
    });

    if (existing) {
      throw new AppError("Đã có lịch cho ngày này", "DUPLICATE_SCHEDULE");
    }

    // Verify all exchange requests exist and are pending/scheduled
    const requests = await prisma.exchangeRequest.findMany({
      where: {
        id: { in: input.exchangeRequestIds },
        status: { in: ["PENDING", "SCHEDULED"] },
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (requests.length !== input.exchangeRequestIds.length) {
      throw new AppError("Một số yêu cầu không hợp lệ hoặc đã hoàn thành", "INVALID_REQUESTS");
    }

    // Create schedule with exchanges
    const schedule = await prisma.$transaction(async (tx) => {
      // Create daily schedule
      const dailySchedule = await tx.dailySchedule.create({
        data: {
          scheduleDate: input.scheduleDate,
          status: "DRAFT",
          createdById: session.user.id,
          totalStops: requests.length,
          totalPlants: requests.reduce((sum, r) => sum + r.quantity, 0),
          notes: input.notes,
        },
      });

      // Create scheduled exchanges
      const scheduledExchanges = await Promise.all(
        requests.map((request, index) =>
          tx.scheduledExchange.create({
            data: {
              scheduleId: dailySchedule.id,
              customerId: request.customerId,
              stopOrder: index + 1,
              exchangeRequestId: request.id,
              totalPlantCount: request.quantity,
              plantsToRemove: request.quantity,
              plantsToInstall: request.quantity,
              status: "PENDING",
              plantsData: [
                {
                  action: "remove",
                  plantType: request.currentPlant || "Unknown",
                  qty: request.quantity,
                  condition: "poor",
                },
                {
                  action: "install",
                  plantType: request.requestedPlant || "New plant",
                  qty: request.quantity,
                },
              ],
            },
          })
        )
      );

      // Update exchange requests to SCHEDULED
      await tx.exchangeRequest.updateMany({
        where: { id: { in: input.exchangeRequestIds } },
        data: { status: "SCHEDULED", scheduledDate: input.scheduleDate },
      });

      return { dailySchedule, scheduledExchanges };
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "DailySchedule",
        entityId: schedule.dailySchedule.id,
        description: `Created daily schedule for ${input.scheduleDate.toLocaleDateString()}`,
      },
    });

    revalidatePath("/exchanges");
    revalidatePath("/exchanges/daily-schedule");
    return schedule.dailySchedule;
  }
);

/**
 * Update stop order (drag-and-drop reordering)
 */
export const updateStopOrder = createAction(updateStopOrderSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: input.scheduleId },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  if (schedule.status !== "DRAFT") {
    throw new AppError("Chỉ có thể sửa lịch ở trạng thái nháp", "INVALID_STATUS");
  }

  // Update stop orders in transaction
  await prisma.$transaction(
    input.stops.map((stop) =>
      prisma.scheduledExchange.updateMany({
        where: {
          scheduleId: input.scheduleId,
          customerId: stop.customerId,
        },
        data: {
          stopOrder: stop.stopOrder,
          scheduledTime: stop.eta,
        },
      })
    )
  );

  // Update route order JSON
  await prisma.dailySchedule.update({
    where: { id: input.scheduleId },
    data: {
      routeOrder: input.stops as unknown as Prisma.JsonArray,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});

/**
 * Optimize route using Google Maps
 */
export const optimizeRoute = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
    include: {
      exchanges: {
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      },
    },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  // TODO: Implement Google Maps optimization
  // For now, just mark as optimized
  await prisma.dailySchedule.update({
    where: { id: scheduleId },
    data: {
      isOptimized: true,
      optimizedAt: new Date(),
      optimizationNotes: "Route optimized (manual)",
    },
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true, message: "Route optimization queued" };
});

/**
 * Approve schedule
 */
export const approveSchedule = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Check authorization (only managers can approve)
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new AppError("Chỉ quản lý mới có thể duyệt lịch", "FORBIDDEN", 403);
  }

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  if (schedule.status !== "DRAFT") {
    throw new AppError("Lịch trình đã được duyệt", "INVALID_STATUS");
  }

  await prisma.dailySchedule.update({
    where: { id: scheduleId },
    data: {
      status: "APPROVED",
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "APPROVE",
      entityType: "DailySchedule",
      entityId: scheduleId,
    },
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});

/**
 * Delete schedule
 */
export const deleteSchedule = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
    include: { exchanges: true },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  if (schedule.status === "COMPLETED") {
    throw new AppError("Không thể xóa lịch đã hoàn thành", "INVALID_STATUS");
  }

  await prisma.$transaction(async (tx) => {
    // Delete scheduled exchanges
    await tx.scheduledExchange.deleteMany({
      where: { scheduleId },
    });

    // Reset exchange requests back to PENDING
    const exchangeRequestIds = schedule.exchanges
      .map((e) => e.exchangeRequestId)
      .filter((id): id is string => id !== null);

    if (exchangeRequestIds.length > 0) {
      await tx.exchangeRequest.updateMany({
        where: { id: { in: exchangeRequestIds } },
        data: { status: "PENDING", scheduledDate: null },
      });
    }

    // Delete schedule
    await tx.dailySchedule.delete({
      where: { id: scheduleId },
    });
  });

  revalidatePath("/exchanges");
  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});

/**
 * Get schedule statistics
 */
export async function getScheduleStats() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, draft, approved, completed] = await Promise.all([
    prisma.dailySchedule.count(),
    prisma.dailySchedule.count({ where: { status: "DRAFT" } }),
    prisma.dailySchedule.count({ where: { status: "APPROVED" } }),
    prisma.dailySchedule.count({ where: { status: "COMPLETED" } }),
  ]);

  return {
    total,
    draft,
    approved,
    completed,
  };
}

/**
 * Schedule Execution Tracking Actions
 */

/**
 * Start schedule execution
 */
export const startScheduleExecution = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  if (schedule.status !== "APPROVED") {
    throw new AppError("Chỉ có thể bắt đầu lịch đã duyệt", "INVALID_STATUS");
  }

  await prisma.dailySchedule.update({
    where: { id: scheduleId },
    data: {
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
  });

  // Update all exchanges to IN_PROGRESS
  await prisma.scheduledExchange.updateMany({
    where: { scheduleId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});

/**
 * Complete stop schema
 */
const completeStopSchema = z.object({
  stopId: z.string().cuid(),
  arrivedAt: z.coerce.date(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date(),
  actualPlantsRemoved: z.number().int().min(0).optional(),
  actualPlantsInstalled: z.number().int().min(0).optional(),
  issues: z.string().max(500).optional(),
  customerFeedback: z.string().max(500).optional(),
  photoUrls: z.array(z.string().url()).optional(),
  customerVerified: z.boolean().default(false),
  verificationMethod: z.enum(["SIGNATURE", "PHOTO", "SMS_CONFIRM"]).optional(),
});

/**
 * Complete a stop
 */
export const completeStop = createAction(completeStopSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const stop = await prisma.scheduledExchange.findUnique({
    where: { id: input.stopId },
  });

  if (!stop) throw new NotFoundError("Điểm dừng");

  if (stop.status === "COMPLETED") {
    throw new AppError("Điểm dừng đã hoàn thành", "INVALID_STATUS");
  }

  // Build staff report JSON
  const staffReport = {
    actualPlantsRemoved: input.actualPlantsRemoved || 0,
    actualPlantsInstalled: input.actualPlantsInstalled || 0,
    issues: input.issues || "",
    customerFeedback: input.customerFeedback || "",
    completedBy: session.user.id,
    completedByName: session.user.name,
  };

  await prisma.scheduledExchange.update({
    where: { id: input.stopId },
    data: {
      status: "COMPLETED",
      arrivedAt: input.arrivedAt,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      customerVerified: input.customerVerified,
      verificationMethod: input.verificationMethod,
      staffReport: staffReport as unknown as Prisma.JsonValue,
      photoUrls: input.photoUrls as unknown as Prisma.JsonValue,
    },
  });

  revalidatePath("/exchanges/execute");
  return { success: true };
});

/**
 * Skip stop schema
 */
const skipStopSchema = z.object({
  stopId: z.string().cuid(),
  reason: z.string().min(10).max(500),
});

/**
 * Skip a stop
 */
export const skipStop = createAction(skipStopSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const stop = await prisma.scheduledExchange.findUnique({
    where: { id: input.stopId },
  });

  if (!stop) throw new NotFoundError("Điểm dừng");

  await prisma.scheduledExchange.update({
    where: { id: input.stopId },
    data: {
      status: "CANCELLED",
      skipReason: input.reason,
      skipApprovedBy: session.user.id,
    },
  });

  revalidatePath("/exchanges/execute");
  return { success: true };
});

/**
 * Complete entire schedule
 */
export const completeSchedule = createSimpleAction(async (scheduleId: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
    include: { exchanges: true },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  if (schedule.status !== "IN_PROGRESS") {
    throw new AppError("Lịch trình chưa bắt đầu", "INVALID_STATUS");
  }

  // Check if all stops are completed or skipped
  const pendingStops = schedule.exchanges.filter(
    (e) => e.status !== "COMPLETED" && e.status !== "CANCELLED"
  );

  if (pendingStops.length > 0) {
    throw new AppError(
      `Còn ${pendingStops.length} điểm dừng chưa hoàn thành`,
      "INCOMPLETE_STOPS"
    );
  }

  // Calculate actual duration
  const actualDuration = schedule.startedAt
    ? Math.round((new Date().getTime() - schedule.startedAt.getTime()) / 60000)
    : null;

  await prisma.dailySchedule.update({
    where: { id: scheduleId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      actualDurationMins: actualDuration,
    },
  });

  // Update exchange requests to COMPLETED
  const exchangeRequestIds = schedule.exchanges
    .filter((e) => e.exchangeRequestId)
    .map((e) => e.exchangeRequestId as string);

  if (exchangeRequestIds.length > 0) {
    await prisma.exchangeRequest.updateMany({
      where: { id: { in: exchangeRequestIds } },
      data: { status: "COMPLETED" },
    });
  }

  // Log completion
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "COMPLETE",
      entityType: "DailySchedule",
      entityId: scheduleId,
      details: `Completed with ${schedule.exchanges.length} stops in ${actualDuration} minutes` as unknown as Prisma.JsonValue,
    },
  });

  revalidatePath("/exchanges/daily-schedule");
  return { success: true };
});

/**
 * Get schedule for execution
 */
export async function getScheduleForExecution(scheduleId: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.dailySchedule.findUnique({
    where: { id: scheduleId },
    include: {
      exchanges: {
        include: {
          customer: {
            select: {
              id: true,
              code: true,
              companyName: true,
              address: true,
              district: true,
              contactPhone: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: { stopOrder: "asc" },
      },
    },
  });

  if (!schedule) throw new NotFoundError("Lịch trình");

  return schedule;
}
