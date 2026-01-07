/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for server actions
 * For production, consider Redis-based rate limiting
 */
import { headers } from "next/headers";
import { RATE_LIMITS } from "./constants";

// In-memory store for rate limiting
// Note: This resets on server restart. For production, use Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60000ms = 1 minute) */
  windowMs?: number;
  /** Max requests per window (default: 10) */
  max?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime?: number;
}

/**
 * Check rate limit for a specific action
 * @param key - Unique key for the action (e.g., "createCustomer")
 * @param options - Rate limit configuration
 * @returns Result with success status and remaining requests
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { windowMs = RATE_LIMITS.DEFAULT_WINDOW_MS, max = RATE_LIMITS.DEFAULT_MAX_REQUESTS } = options;

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const rateLimitKey = `${key}:${ip}`;

  const now = Date.now();
  const record = requestCounts.get(rateLimitKey);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    requestCounts.set(rateLimitKey, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  // Check if over limit
  if (record.count >= max) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return { success: true, remaining: max - record.count };
}

/**
 * Rate limit error for action handlers
 */
export class RateLimitError extends Error {
  constructor(message: string = "Quá nhiều yêu cầu, vui lòng thử lại sau") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Check rate limit and throw error if exceeded
 * @param key - Unique key for the action
 * @param options - Rate limit configuration
 * @throws RateLimitError if rate limit exceeded
 */
export async function requireRateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<void> {
  const result = await rateLimit(key, options);
  if (!result.success) {
    throw new RateLimitError();
  }
}
