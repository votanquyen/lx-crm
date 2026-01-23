"use client";

import { usePermission, type Permission } from "@/hooks/use-permission";
import type { ReactNode } from "react";

interface PermissionGateProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
  mode?: "any" | "all";
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
  mode = "any",
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermission();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = mode === "all" ? hasAllPermissions(permissions) : hasAnyPermission(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
