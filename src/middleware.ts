/**
 * Next.js Edge Middleware
 * Rate limiting for API routes with in-memory store
 *
 * Security Features:
 * - Route-specific rate limits (upload, analytics, etc.)
 * - IP-based client identification (X-Forwarded-For support)
 * - Automatic stale entry cleanup to prevent memory leaks
 * - Standard rate limit headers (X-RateLimit-*)
 * - 429 Too Many Requests with Retry-After header
 */
import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store (Edge-compatible)
// Map key format: "ip:route" -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configurations by route pattern
 * Matches routes using startsWith() - most specific routes first
 */
const RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/upload": { limit: 10, windowMs: 60000 },               // 10 uploads/min (DoS protection)
  "/api/analytics": { limit: 5, windowMs: 60000 },             // 5 exports/min (DB protection)
  "/api/quotations": { limit: 20, windowMs: 60000 },           // 20 PDF/min
  "/api/statements": { limit: 20, windowMs: 60000 },           // 20 PDF/min
  "/api/schedules": { limit: 30, windowMs: 60000 },            // 30 briefings/min
  "/api/customers/geojson": { limit: 30, windowMs: 60000 },    // 30 geojson/min (scraping protection)
  "/api/invoices": { limit: 30, windowMs: 60000 },             // 30 invoice ops/min
  "/api": { limit: 100, windowMs: 60000 },                     // Default: 100/min for other API routes
};

/**
 * Extract client identifier from request
 * Prioritizes X-Forwarded-For (Vercel, Cloudflare) over X-Real-IP
 */
function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ??
             req.headers.get("x-real-ip") ??
             "unknown";
  return ip;
}

/**
 * Get rate limit config for a pathname
 * Returns most specific matching route config
 */
function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  // Check specific routes first (order matters)
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  // Fallback to default API rate limit
  return RATE_LIMITS["/api"] ?? { limit: 100, windowMs: 60000 };
}

/**
 * Cleanup stale rate limit entries to prevent memory leak
 * Runs every 60 seconds (CLEANUP_INTERVAL)
 */
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of Array.from(rateLimitMap.entries())) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Middleware function - runs on Edge runtime
 * Applies rate limiting to all API routes except /api/auth
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes (exclude auth routes)
  if (!pathname.startsWith("/api/") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Run periodic cleanup
  cleanupStaleEntries();

  const clientId = getClientIdentifier(request);
  const config = getRateLimitConfig(pathname);

  // Create unique key per client + route prefix (e.g., "1.2.3.4:/api/upload")
  const routePrefix = pathname.split("/").slice(0, 3).join("/");
  const key = `${clientId}:${routePrefix}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    // New window or expired window - reset counter
    entry = { count: 0, resetTime: now + config.windowMs };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.limit) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: "Too many requests",
        retryAfter: retryAfterSeconds,
        message: "Rate limit exceeded. Please try again later."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(entry.resetTime),
        }
      }
    );
  }

  // Allow request and add rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(config.limit));
  response.headers.set("X-RateLimit-Remaining", String(config.limit - entry.count));
  response.headers.set("X-RateLimit-Reset", String(entry.resetTime));

  return response;
}

/**
 * Middleware configuration
 * Matcher pattern: apply to all API routes
 */
export const config = {
  matcher: "/api/:path*",
};
