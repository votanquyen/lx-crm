/**
 * Auth.js v5 Edge-Compatible Configuration
 * This file contains NO Node.js-only imports (no Prisma, no crypto)
 * Used by middleware (Edge Runtime)
 */
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// UserRole type defined inline to avoid Prisma import
type UserRole = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF";

// Domain restriction for Google OAuth (optional - set in .env)
const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",").map((d) => d.trim()) ?? [];

// Dev users with passwords from environment variables
const devUsers = [
  {
    id: "dev-admin",
    email: "admin@locxanh.vn",
    password: process.env.DEV_ADMIN_PASSWORD ?? "",
    name: "Admin Lộc Xanh",
    role: "ADMIN" as UserRole,
  },
  {
    id: "dev-manager",
    email: "manager@locxanh.vn",
    password: process.env.DEV_MANAGER_PASSWORD ?? "",
    name: "Manager",
    role: "MANAGER" as UserRole,
  },
  {
    id: "dev-staff",
    email: "staff@locxanh.vn",
    password: process.env.DEV_STAFF_PASSWORD ?? "",
    name: "Staff",
    role: "STAFF" as UserRole,
  },
];

/**
 * Edge-compatible auth configuration
 * Does NOT include Prisma adapter or database callbacks
 */
export const authConfig: NextAuthConfig = {
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

        // Development-only credentials (gated behind NODE_ENV)
        const DEV_MODE = process.env.NODE_ENV === "development";

        if (!DEV_MODE) {
          console.warn("[Auth] Credentials provider disabled in production - use OAuth");
          return null;
        }

        // Filter out users without configured passwords
        const configuredUsers = devUsers.filter((u) => u.password !== "");

        const user = configuredUsers.find(
          (u) => u.email === credentials.email && u.password === credentials.password
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
          return false;
        }
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role ?? "STAFF";
      }
      // Note: Database role refresh is done in auth.ts (Node.js runtime only)
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
    strategy: "jwt",
  },
  trustHost: true,
};
