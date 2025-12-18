/**
 * Care Schedule Server Actions
 * CRUD with check-in/out tracking
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import {
  createCareScheduleSchema,
  updateCareScheduleSchema,
  checkInSchema,
  completeCareSchema,
  careSearchSchema,
  type CareSearchParams,
} from "@/lib/validations/care";

/**
 * Get paginated list of care schedules
 */
export async function getCareSchedules(params: CareSearchParams) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const validated = careSearchSchema.parse(params);
  const { page, limit, status, staffId, customerId, dateFrom, dateTo } = validated;

  const skip = (page - 1) * limit;

  const where: Prisma.CareScheduleWhereInput = {};

  if (status) where.status = status;
  if (staffId) where.staffId = staffId;
  if (customerId) where.customerId = customerId;

  if (dateFrom || dateTo) {
    where.scheduledDate = {};
    if (dateFrom) where.scheduledDate.gte = dateFrom;
    if (dateTo) where.scheduledDate.lte = dateTo;
  }

  const [schedules, total] = await Promise.all([
    prisma.careSchedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
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
        staff: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
    prisma.careSchedule.count({ where }),
  ]);

  return {
    data: schedules,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get today's care schedule for a staff member
 */
export async function getTodaySchedule(staffId?: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const schedules = await prisma.careSchedule.findMany({
    where: {
      scheduledDate: { gte: today, lt: tomorrow },
      ...(staffId && { staffId }),
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
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
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
  });

  return schedules;
}

/**
 * Get care schedule by ID
 */
export async function getCareScheduleById(id: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.careSchedule.findUnique({
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
          latitude: true,
          longitude: true,
        },
      },
      staff: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  if (!schedule) throw new NotFoundError("Lịch chăm sóc");
  return schedule;
}

/**
 * Create a new care schedule
 */
export const createCareSchedule = createAction(createCareScheduleSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new NotFoundError("Khách hàng");

  // Verify staff if assigned
  if (input.staffId) {
    const staff = await prisma.user.findUnique({ where: { id: input.staffId } });
    if (!staff) throw new NotFoundError("Nhân viên");
  }

  const schedule = await prisma.careSchedule.create({
    data: {
      customerId: input.customerId,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      staffId: input.staffId,
      status: "SCHEDULED",
      notes: input.notes,
    },
    include: {
      customer: { select: { id: true, companyName: true } },
      staff: { select: { id: true, name: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "CareSchedule",
      entityId: schedule.id,
      newValues: schedule as unknown as Prisma.JsonObject,
    },
  });

  revalidatePath("/care");
  return schedule;
});

/**
 * Update care schedule
 */
export const updateCareSchedule = createAction(updateCareScheduleSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const { id, ...updateData } = input;

  const existing = await prisma.careSchedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Lịch chăm sóc");

  // Cannot update completed schedules
  if (existing.status === "COMPLETED") {
    throw new AppError("Không thể sửa lịch đã hoàn thành", "INVALID_STATUS");
  }

  const schedule = await prisma.careSchedule.update({
    where: { id },
    data: updateData,
    include: {
      customer: { select: { id: true, companyName: true } },
      staff: { select: { id: true, name: true } },
    },
  });

  revalidatePath("/care");
  return schedule;
});

/**
 * Check-in at customer location
 */
export const checkIn = createAction(checkInSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.careSchedule.findUnique({
    where: { id: input.id },
    include: { customer: true },
  });
  if (!schedule) throw new NotFoundError("Lịch chăm sóc");

  if (schedule.status !== "SCHEDULED") {
    throw new AppError("Lịch không ở trạng thái chờ", "INVALID_STATUS");
  }

  // Assign staff if not assigned
  const staffId = schedule.staffId || session.user.id;

  const updated = await prisma.careSchedule.update({
    where: { id: input.id },
    data: {
      status: "IN_PROGRESS",
      staffId,
      checkedInAt: new Date(),
      checkedInLat: input.latitude,
      checkedInLng: input.longitude,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CHECK_IN",
      entityType: "CareSchedule",
      entityId: input.id,
      newValues: {
        latitude: input.latitude,
        longitude: input.longitude,
      } as Prisma.JsonObject,
    },
  });

  revalidatePath("/care");
  return updated;
});

/**
 * Complete care schedule (check-out)
 */
export const completeCare = createAction(completeCareSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const schedule = await prisma.careSchedule.findUnique({
    where: { id: input.id },
    include: { customer: true },
  });
  if (!schedule) throw new NotFoundError("Lịch chăm sóc");

  if (schedule.status !== "IN_PROGRESS") {
    throw new AppError("Lịch chưa được check-in", "INVALID_STATUS");
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Update schedule
    const result = await tx.careSchedule.update({
      where: { id: input.id },
      data: {
        status: "COMPLETED",
        checkedOutAt: new Date(),
        workNotes: input.workReport,
        notes: input.notes ?? schedule.notes,
        photoUrls: input.photos ?? [],
      },
    });

    // Note: CustomerPlant doesn't have lastCareDate field
    // Care history is tracked through CareSchedule records

    return result;
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "COMPLETE",
      entityType: "CareSchedule",
      entityId: input.id,
      newValues: { workReport: input.workReport } as Prisma.JsonObject,
    },
  });

  revalidatePath("/care");
  revalidatePath(`/customers/${schedule.customerId}`);
  return updated;
});

/**
 * Skip care schedule
 */
export const skipCareSchedule = createSimpleAction(
  async (data: { id: string; reason: string }) => {
    const session = await auth();
    if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

    const schedule = await prisma.careSchedule.findUnique({ where: { id: data.id } });
    if (!schedule) throw new NotFoundError("Lịch chăm sóc");

    if (schedule.status === "COMPLETED") {
      throw new AppError("Không thể bỏ qua lịch đã hoàn thành", "INVALID_STATUS");
    }

    const updated = await prisma.careSchedule.update({
      where: { id: data.id },
      data: {
        status: "SKIPPED",
        notes: `${schedule.notes || ""}\n[Bỏ qua: ${data.reason}]`,
      },
    });

    revalidatePath("/care");
    return updated;
  }
);

/**
 * Get care statistics
 */
export async function getCareStats(dateFrom?: Date, dateTo?: Date) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateFilter = {
    scheduledDate: {
      ...(dateFrom && { gte: dateFrom }),
      ...(dateTo && { lte: dateTo }),
    },
  };

  const [total, scheduled, completed, todayCount, inProgress] = await Promise.all([
    prisma.careSchedule.count({ where: dateFilter }),
    prisma.careSchedule.count({ where: { ...dateFilter, status: "SCHEDULED" } }),
    prisma.careSchedule.count({ where: { ...dateFilter, status: "COMPLETED" } }),
    prisma.careSchedule.count({
      where: {
        scheduledDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    }),
    prisma.careSchedule.count({ where: { ...dateFilter, status: "IN_PROGRESS" } }),
  ]);

  return {
    total,
    scheduled,
    completed,
    todayCount,
    inProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/**
 * Get staff workload
 */
export async function getStaffWorkload() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const workload = await prisma.careSchedule.groupBy({
    by: ["staffId"],
    where: {
      scheduledDate: { gte: today, lt: endOfWeek },
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      staffId: { not: null },
    },
    _count: true,
  });

  // Get staff details
  const staffIds = workload.map((w) => w.staffId).filter((id): id is string => id !== null);
  const staff = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, name: true, email: true, image: true },
  });

  return workload.map((w) => ({
    staff: staff.find((s) => s.id === w.staffId),
    scheduledCount: w._count,
  }));
}
