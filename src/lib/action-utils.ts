/**
 * Server Action Utilities
 * Wrapper for type-safe server actions with Zod validation
 */
import { z } from "zod";
import { auth } from "./auth";
import { AppError } from "./errors";

/** User roles for authorization */
export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

/**
 * Check if user has required role(s)
 * Throws AppError if unauthorized or missing role
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<{ id: string; role: UserRole }> {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401);
  }

  const userRole = (session.user as { role?: string }).role as UserRole | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AppError("Không có quyền thực hiện thao tác này", "FORBIDDEN", 403);
  }

  return { id: session.user.id as string, role: userRole };
}

/**
 * Check if user is authenticated (any role)
 * Alias: requireUser for backward compatibility
 */
export async function requireAuth(): Promise<{ id: string; role?: UserRole }> {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("Vui lòng đăng nhập", "UNAUTHORIZED", 401);
  }
  return {
    id: session.user.id as string,
    role: (session.user as { role?: string }).role as UserRole | undefined
  };
}

/**
 * Alias for requireAuth (backward compatibility)
 */
export const requireUser = requireAuth;

/**
 * Validate UUID format
 */
export const uuidSchema = z.string().cuid("ID không hợp lệ");

/**
 * Standard action response type
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Create a validated server action
 * Uses z.output for the handler type (after transforms/defaults applied)
 */
export function createAction<TSchema extends z.ZodTypeAny, TOutput>(
  schema: TSchema,
  handler: (input: z.output<TSchema>) => Promise<TOutput>
) {
  return async (input: unknown): Promise<ActionResponse<TOutput>> => {
    try {
      // Validate input
      const validatedInput = schema.parse(input);

      // Execute handler
      const result = await handler(validatedInput);

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: (error as any).errors[0]?.message ?? "Dữ liệu không hợp lệ",
          code: "VALIDATION_ERROR",
        };
      }

      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }

      console.error("Action error:", error);
      return {
        success: false,
        error: "Đã xảy ra lỗi. Vui lòng thử lại.",
        code: "INTERNAL_ERROR",
      };
    }
  };
}

/**
 * Create a server action without validation schema
 * For actions that don't need input validation
 */
export function createServerAction<TOutput>(
  handler: () => Promise<TOutput>
) {
  return async (): Promise<TOutput> => {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Server action error:", error);
      throw new AppError("Đã xảy ra lỗi. Vui lòng thử lại.", "INTERNAL_ERROR");
    }
  };
}

/**
 * Create a server action without schema validation
 */
export function createSimpleAction<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      const result = await handler(input);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }

      console.error("Action error:", error);
      return {
        success: false,
        error: "Đã xảy ra lỗi. Vui lòng thử lại.",
        code: "INTERNAL_ERROR",
      };
    }
  };
}
