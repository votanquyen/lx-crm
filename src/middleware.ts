/**
 * Edge Middleware for Authentication
 * Runs at edge before pages are rendered, providing faster auth checks
 */
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isPublicRoute = ["/login", "/api/auth", "/unauthorized"].some(
    (path) => req.nextUrl.pathname.startsWith(path)
  );

  // Allow public routes
  if (isPublicRoute) {
    // Redirect to dashboard if already logged in and on login page
    if (isAuthenticated && isLoginPage) {
      return Response.redirect(new URL("/", req.nextUrl));
    }
    return;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
