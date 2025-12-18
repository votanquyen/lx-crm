/**
 * Authorization Utilities
 * Role-based access control helpers
 */

import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@prisma/client";

/**
 * Check if user is authenticated
 * @throws AppError if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401);
  }
  return session;
}

/**
 * Check if user has required role
 * @throws AppError if user doesn't have required role
 */
export async function requireRole(roles: UserRole | UserRole[]) {
  const session = await requireAuth();

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new AppError(
      "Bạn không có quyền thực hiện thao tác này",
      "FORBIDDEN",
      403
    );
  }

  return session;
}

/**
 * Check if user is admin
 * @throws AppError if user is not admin
 */
export async function requireAdmin() {
  return requireRole("ADMIN");
}

/**
 * Check if user is admin or manager
 * @throws AppError if user is not admin or manager
 */
export async function requireManager() {
  return requireRole(["ADMIN", "MANAGER"]);
}

/**
 * Check if user is admin, manager, or accountant
 * @throws AppError if user is not admin, manager, or accountant
 */
export async function requireAccountant() {
  return requireRole(["ADMIN", "MANAGER", "ACCOUNTANT"]);
}
