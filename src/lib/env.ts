/**
 * Environment Variable Validation
 * Validates all required environment variables at startup using Zod
 * Fails fast if required variables are missing
 */
import { z } from "zod";

/**
 * Server-side environment schema
 * These variables are only available on the server
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database (REQUIRED)
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),

  // Authentication (REQUIRED in production)
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Google OAuth (optional - can use credentials in dev)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),

  // Development credentials (optional - only used in dev mode)
  DEV_ADMIN_PASSWORD: z.string().optional(),
  DEV_MANAGER_PASSWORD: z.string().optional(),
  DEV_STAFF_PASSWORD: z.string().optional(),

  // AI Services (optional - features degrade gracefully)
  GOOGLE_AI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  // Google Maps (optional - route optimization disabled if missing)
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // MinIO S3 Storage (with safe defaults for local dev)
  MINIO_ENDPOINT: z.string().url().default("http://localhost:9000"),
  MINIO_USE_SSL: z.enum(["true", "false"]).default("false"),
  MINIO_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  MINIO_SECRET_KEY: z.string().min(1).default("minioadmin"),
  MINIO_BUCKET: z.string().min(1).default("locxanh-photos"),
  MINIO_REGION: z.string().default("us-east-1"),
  MINIO_PUBLIC_URL: z.string().url().optional(),
});

/**
 * Client-side environment schema
 * These variables are exposed to the browser (prefixed with NEXT_PUBLIC_)
 */
const clientEnvSchema = z.object({
  // Add NEXT_PUBLIC_ variables here if needed
  // NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Merged environment type
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validate and parse environment variables
 * Call this at application startup to fail fast on missing config
 */
function validateEnv() {
  // Skip validation during build time
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return {
      server: process.env as unknown as ServerEnv,
      client: {} as ClientEnv,
    };
  }

  // Validate server environment
  const serverResult = serverEnvSchema.safeParse(process.env);

  if (!serverResult.success) {
    const errors = serverResult.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("❌ Invalid environment variables:\n" + errorMessages);

    // In production, fail immediately
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing or invalid environment variables:\n${errorMessages}\n\nPlease check your .env file or environment configuration.`
      );
    }

    // In development, warn but continue (allows partial functionality)
    console.warn("⚠️  Continuing with invalid environment in development mode");
  }

  // Validate client environment
  const clientResult = clientEnvSchema.safeParse({
    // Extract NEXT_PUBLIC_ variables
  });

  return {
    server: serverResult.success ? serverResult.data : (process.env as unknown as ServerEnv),
    client: clientResult.success ? clientResult.data : ({} as ClientEnv),
  };
}

/**
 * Validated environment variables
 * Use this instead of process.env for type-safe access
 */
export const env = validateEnv();

/**
 * Check if a feature is available based on env configuration
 */
export const featureFlags = {
  /** AI features available (Google AI key configured) */
  hasAI: !!env.server.GOOGLE_AI_API_KEY,
  /** Google OAuth configured */
  hasGoogleOAuth: !!(env.server.GOOGLE_CLIENT_ID && env.server.GOOGLE_CLIENT_SECRET),
  /** Route optimization available (Google Maps key configured) */
  hasRouteOptimization: !!env.server.GOOGLE_MAPS_API_KEY,
  /** External storage configured (not using local defaults) */
  hasExternalStorage: env.server.MINIO_ENDPOINT !== "http://localhost:9000",
  /** Public storage URL configured */
  hasPublicStorageUrl: !!env.server.MINIO_PUBLIC_URL,
} as const;

/**
 * Get environment variable with type safety
 * Throws if accessing undefined required variable
 */
export function getEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  return env.server[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return env.server.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return env.server.NODE_ENV === "development";
}
