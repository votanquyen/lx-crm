/**
 * Auth.js v5 Full Configuration
 * Includes Prisma adapter and database callbacks
 * Used by API routes (Node.js runtime)
 */
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    // Override jwt callback with database role refresh
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "STAFF";
      }

      // Skip database lookup for dev users (they don't exist in DB)
      const isDevUser = typeof token.id === "string" && token.id.startsWith("dev-");
      if (isDevUser) {
        return token;
      }

      // Check if role has changed since token was issued
      // This ensures users get updated permissions without re-login
      if (token.id && token.iat) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, roleChangedAt: true, isActive: true },
          });

          if (dbUser) {
            // If user is deactivated, invalidate token
            if (!dbUser.isActive) {
              return null as never; // Force sign out
            }

            // If role changed after token was issued, refresh it
            const tokenIssuedAt = new Date(token.iat * 1000);
            if (dbUser.roleChangedAt && dbUser.roleChangedAt > tokenIssuedAt) {
              token.role = dbUser.role;
            }
          }
        } catch (error) {
          // Database connection failed - continue with existing token
          console.warn("[Auth] Database lookup failed:", error);
        }
      }

      return token;
    },
  },
});

/**
 * Get current session user (server-side)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

// Re-export auth utilities from centralized location
export {
  requireAuth,
  requireRole,
  requireAdmin,
  requireManager,
  requireAccountant,
} from "./auth-utils";
