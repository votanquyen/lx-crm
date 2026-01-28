/**
 * User Management Server Actions
 * Admin-only operations for managing users and roles
 */
"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { AppError } from "@/lib/errors";
import { z } from "zod";
import { createAction } from "@/lib/action-utils";

/**
 * User search parameters schema
 */
const userSearchSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
});

type UserSearchParams = z.infer<typeof userSearchSchema>;

/**
 * Update user role schema
 */
const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"]),
});

/**
 * Toggle user active schema
 */
const toggleUserActiveSchema = z.object({
  userId: z.string().cuid(),
  isActive: z.boolean(),
});

/**
 * Get paginated list of users with search and filters
 * Only accessible by ADMIN
 */
export async function getUsers(params: UserSearchParams) {
  await requireAdmin();

  const validated = userSearchSchema.parse(params);
  const { page, limit, search, role, isActive } = validated;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.UserWhereInput = {};

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;

  // Search by name or email
  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            activityLogs: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user by ID
 * Only accessible by ADMIN
 */
export async function getUserById(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        },
      },
      sessions: {
        select: {
          expires: true,
        },
        orderBy: {
          expires: "desc",
        },
        take: 1,
      },
      activityLogs: {
        select: {
          id: true,
          action: true,
          entityType: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          activityLogs: true,
          // customers relation doesn't exist on User model
        },
      },
    },
  });

  if (!user) {
    throw new AppError("Người dùng không tồn tại", "NOT_FOUND", 404);
  }

  return user;
}

/**
 * Update user role
 * Only accessible by ADMIN
 * Cannot change own role
 */
export const updateUserRole = createAction(updateUserRoleSchema, async (input) => {
  const session = await requireAdmin();

  const { userId, role } = input;

  // Prevent self-role change
  if (session.user.id === userId) {
    throw new AppError("Bạn không thể thay đổi vai trò của chính mình", "FORBIDDEN", 403);
  }

  // Get current user data
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError("Người dùng không tồn tại", "NOT_FOUND", 404);
  }

  // Update role and set roleChangedAt timestamp
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      roleChangedAt: new Date(), // Timestamp for JWT invalidation
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE_ROLE",
      entityType: "User",
      entityId: userId,
      oldValues: { role: existingUser.role } as Prisma.JsonObject,
      newValues: { role } as Prisma.JsonObject,
    },
  });

  // Note: Session deletion removed - JWT mode uses roleChangedAt timestamp instead
  // The jwt() callback in auth.ts checks roleChangedAt on each request

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return updatedUser;
});

/**
 * Toggle user active status
 * Only accessible by ADMIN
 * Cannot deactivate own account
 */
export const toggleUserActive = createAction(toggleUserActiveSchema, async (input) => {
  const session = await requireAdmin();

  const { userId, isActive } = input;

  // Prevent self-deactivation
  if (session.user.id === userId && !isActive) {
    throw new AppError("Bạn không thể vô hiệu hóa tài khoản của chính mình", "FORBIDDEN", 403);
  }

  // Get current user data
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError("Người dùng không tồn tại", "NOT_FOUND", 404);
  }

  // Update active status
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      entityType: "User",
      entityId: userId,
      oldValues: { isActive: existingUser.isActive } as Prisma.JsonObject,
      newValues: { isActive } as Prisma.JsonObject,
    },
  });

  // If deactivating, invalidate user sessions
  if (!isActive) {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return updatedUser;
});

/**
 * Get user statistics
 * Only accessible by ADMIN
 */
export async function getUserStats() {
  await requireAdmin();

  const [total, active, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count])) as Record<UserRole, number>,
  };
}
