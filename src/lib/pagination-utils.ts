/**
 * Pagination Utilities
 * Reusable pagination helpers for list actions
 */
import { z } from "zod";
import { PAGINATION } from "./constants";

/**
 * Standard pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  limit: z.number().int().positive().max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Build Prisma pagination options
 */
export function buildPagination(params: PaginationParams) {
  const { page, limit, sortBy, sortOrder } = params;
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: sortOrder as "asc" | "desc" },
  };
}

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Create paginated result from items and total count
 */
export function paginateResult<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = params;
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

/**
 * Calculate offset for SQL queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Parse and validate pagination from search params
 */
export function parsePaginationParams(searchParams: Record<string, string | undefined>): PaginationParams {
  const result = paginationSchema.safeParse({
    page: searchParams.page ? parseInt(searchParams.page, 10) : PAGINATION.DEFAULT_PAGE,
    limit: searchParams.limit ? parseInt(searchParams.limit, 10) : PAGINATION.DEFAULT_LIMIT,
    sortBy: searchParams.sortBy,
    sortOrder: searchParams.sortOrder,
  });

  if (!result.success) {
    return {
      page: PAGINATION.DEFAULT_PAGE,
      limit: PAGINATION.DEFAULT_LIMIT,
      sortOrder: "desc",
    };
  }

  return result.data;
}
