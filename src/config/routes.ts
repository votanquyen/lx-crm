/**
 * Route Permissions Configuration
 * Maps routes to allowed user roles for RBAC enforcement
 */

import type { UserRole } from "@prisma/client";

/**
 * Route permission mappings
 * Key: route path (prefix matching)
 * Value: array of allowed roles
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin-only routes
  "/admin/users": ["ADMIN"],
  "/admin/settings": ["ADMIN"],
  "/admin": ["ADMIN"],

  // Management routes (ADMIN + MANAGER)
  "/users": ["ADMIN", "MANAGER"],
  "/customers": ["ADMIN", "MANAGER", "STAFF"],
  "/contracts": ["ADMIN", "MANAGER"],
  "/quotations": ["ADMIN", "MANAGER"],
  "/plant-types": ["ADMIN", "MANAGER"],

  // Financial routes (ADMIN + MANAGER + ACCOUNTANT)
  "/invoices": ["ADMIN", "MANAGER", "ACCOUNTANT"],
  "/payments": ["ADMIN", "MANAGER", "ACCOUNTANT"],

  // Operations routes (ADMIN + MANAGER + STAFF)
  "/care-schedules": ["ADMIN", "MANAGER", "STAFF"],
  "/exchanges": ["ADMIN", "MANAGER", "STAFF"],
  "/sticky-notes": ["ADMIN", "MANAGER", "STAFF"],

  // Dashboard (all authenticated users)
  "/": ["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"],
  "/dashboard": ["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"],
} as const;

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/api/health",
  "/unauthorized",
] as const;

/**
 * Check if a route requires specific roles
 * @param pathname - The route path to check
 * @returns Array of allowed roles, or null if route is public or unrestricted
 */
export function getRoutePermissions(pathname: string): UserRole[] | null {
  // Check if public route
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  // Find matching route permission (longest prefix match)
  let matchedRoles: UserRole[] | null = null;
  let longestMatch = 0;

  for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route) && route.length > longestMatch) {
      matchedRoles = roles;
      longestMatch = route.length;
    }
  }

  return matchedRoles;
}

/**
 * Check if user has permission to access a route
 * @param pathname - The route path to check
 * @param userRole - The user's role
 * @returns true if user can access the route
 */
export function canAccessRoute(
  pathname: string,
  userRole: UserRole | undefined
): boolean {
  const requiredRoles = getRoutePermissions(pathname);

  // Public route or unrestricted
  if (!requiredRoles) {
    return true;
  }

  // No user role (not authenticated)
  if (!userRole) {
    return false;
  }

  // Check if user role is allowed
  return requiredRoles.includes(userRole);
}
