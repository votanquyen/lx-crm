/**
 * Auth.js v5 Configuration
 * Google OAuth + Credentials (email/password) with Prisma adapter
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
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
    Credentials({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For development: hardcoded admin credentials
        // In production, you should hash passwords and store in DB
        const devUsers = [
          {
            id: "dev-admin",
            email: "admin@locxanh.vn",
            password: "admin123",
            name: "Admin Lộc Xanh",
            role: "ADMIN" as UserRole,
          },
          {
            id: "dev-manager",
            email: "manager@locxanh.vn",
            password: "manager123",
            name: "Manager",
            role: "MANAGER" as UserRole,
          },
          {
            id: "dev-staff",
            email: "staff@locxanh.vn",
            password: "staff123",
            name: "Staff",
            role: "STAFF" as UserRole,
          },
        ];

        const user = devUsers.find(
          (u) =>
            u.email === credentials.email &&
            u.password === credentials.password
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn: async ({ user, account }) => {
      // Skip domain check for credentials provider
      if (account?.provider === "credentials") {
        return true;
      }

      // Domain restriction check for OAuth (if configured)
      if (allowedDomains.length > 0 && user.email) {
        const emailDomain = user.email.split("@")[1] ?? "";
        if (!allowedDomains.includes(emailDomain)) {
          return false; // Reject sign-in
        }
      }
      return true;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "STAFF";
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: (token.role as UserRole) ?? "STAFF",
      },
    }),
    authorized: ({ auth: authSession }) => {
      return !!authSession?.user;
    },
  },
  session: {
    strategy: "jwt", // Changed from database to support Credentials provider
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
