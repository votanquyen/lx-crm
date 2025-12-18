import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { canAccessRoute, getRoutePermissions, PUBLIC_ROUTES } from "@/config/routes";
import type { UserRole } from "@prisma/client";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as UserRole | undefined;

  // Check if public route
  const isPublicPath = PUBLIC_ROUTES.some((path) => nextUrl.pathname.startsWith(path));

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based permissions
  const hasPermission = canAccessRoute(nextUrl.pathname, userRole);

  if (!hasPermission) {
    const requiredRoles = getRoutePermissions(nextUrl.pathname);
    console.warn(
      `[RBAC] User ${req.auth?.user?.email} (${userRole}) attempted to access ${nextUrl.pathname}. Required roles: ${requiredRoles?.join(", ")}`
    );
    return NextResponse.redirect(new URL("/unauthorized", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all paths except static files and api routes that should be public
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
