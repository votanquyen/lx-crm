"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";

type Permission =
  | "customer:create"
  | "customer:update"
  | "customer:delete"
  | "invoice:create"
  | "invoice:update"
  | "invoice:delete"
  | "payment:record"
  | "care:schedule"
  | "care:complete"
  | "exchange:approve"
  | "admin:access";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "customer:create",
    "customer:update",
    "customer:delete",
    "invoice:create",
    "invoice:update",
    "invoice:delete",
    "payment:record",
    "care:schedule",
    "care:complete",
    "exchange:approve",
    "admin:access",
  ],
  MANAGER: [
    "customer:create",
    "customer:update",
    "customer:delete",
    "invoice:create",
    "invoice:update",
    "payment:record",
    "care:schedule",
    "care:complete",
    "exchange:approve",
  ],
  ACCOUNTANT: ["invoice:create", "invoice:update", "payment:record"],
  STAFF: ["customer:create", "customer:update", "care:schedule", "care:complete"],
  VIEWER: [],
};

export function usePermission() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    isAuthenticated: !!session,
  };
}

export type { Permission };
