/**
 * Auth.js v5 Configuration
 * Google OAuth with Prisma adapter
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

// Domain restriction for Google OAuth (optional - set in .env)
const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",").map((d) => d.trim()) ?? [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn: async ({ user }) => {
      // Domain restriction check (if configured)
      if (allowedDomains.length > 0 && user.email) {
        const emailDomain = user.email.split("@")[1] ?? "";
        if (!allowedDomains.includes(emailDomain)) {
          return false; // Reject sign-in
        }
      }
      return true;
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: ((user as { role?: UserRole }).role ?? "STAFF") as UserRole,
      },
    }),
    authorized: ({ auth: authSession }) => {
      return !!authSession?.user;
    },
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
});

/**
 * Get current session user (server-side)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Require authentication (server-side)
 * Throws redirect to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require specific roles (server-side)
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const userRole = (session.user.role ?? "STAFF") as UserRole;

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }

  return session;
}
