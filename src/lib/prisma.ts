/**
 * Prisma Client Singleton
 * Prevents multiple instances during development hot reload
 * Uses @prisma/adapter-pg for Prisma 7 compatibility
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { CONNECTION_POOL } from "./constants";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a pg Pool with connection limits and timeouts
  const pool = new Pool({
    connectionString,
    min: CONNECTION_POOL.MIN_CONNECTIONS,
    max: CONNECTION_POOL.MAX_CONNECTIONS,
    idleTimeoutMillis: CONNECTION_POOL.IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECTION_POOL.CONNECTION_TIMEOUT_MS,
  });

  // Handle pool errors to prevent unhandled rejections
  pool.on("error", (err) => {
    console.error("[Prisma] Pool error:", err);
  });

  // Create adapter
  const adapter = new PrismaPg(pool);

  // Create Prisma client with adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
