/**
 * Authentication Types
 * Centralized auth-related type definitions
 */
import type { UserRole } from "@prisma/client";

/**
 * Authenticated user type
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
}

/**
 * Session type for authenticated users
 */
export interface AuthSession {
  user: AuthUser;
  expires: string;
}

/**
 * Action context for server actions
 * Contains authenticated user info
 */
export interface ActionContext {
  user: AuthUser;
}
