/**
 * Next.js Middleware
 * Handles request-level concerns like rate limiting, auth checks
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * In-memory rate limiting store for middleware (Edge-compatible)
 * Note: This resets on server restart and is per-instance.
 * For production with multiple instances, use Redis or similar.
 */
const authRateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Rate limit configuration for auth endpoints
 */
const AUTH_RATE_LIMIT = {
  max: 5,
  windowMs: 60_000, // 1 minute
} as const;

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Check rate limit for auth endpoints
 */
function checkAuthRateLimit(ip: string): {
  success: boolean;
  remaining: number;
} {
  const now = Date.now();
  const key = `auth:${ip}`;
  const record = authRateLimitStore.get(key);

  // Reset if window expired or no record
  if (!record || now > record.resetTime) {
    authRateLimitStore.set(key, {
      count: 1,
      resetTime: now + AUTH_RATE_LIMIT.windowMs,
    });
    return { success: true, remaining: AUTH_RATE_LIMIT.max - 1 };
  }

  // Over limit
  if (record.count >= AUTH_RATE_LIMIT.max) {
    return { success: false, remaining: 0 };
  }

  // Increment
  record.count++;
  return { success: true, remaining: AUTH_RATE_LIMIT.max - record.count };
}

/**
 * Cleanup old entries periodically (prevent memory leak)
 */
function cleanupOldEntries() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  authRateLimitStore.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => authRateLimitStore.delete(key));
}

// Cleanup every 5 minutes
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

export function middleware(request: NextRequest) {
  // Periodic cleanup
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    cleanupOldEntries();
  }

  // Rate limit auth endpoints
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    const ip = getClientIp(request);
    const result = checkAuthRateLimit(ip);

    if (!result.success) {
      return NextResponse.json(
        { error: "Qua nhieu yeu cau. Vui long thu lai sau." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const response = NextResponse.next();
    response.headers.set(
      "X-RateLimit-Remaining",
      result.remaining.toString()
    );
    return response;
  }

  return NextResponse.next();
}

/**
 * Middleware config - specify which paths to run on
 */
export const config = {
  matcher: [
    // Apply to auth API routes
    "/api/auth/:path*",
  ],
};
