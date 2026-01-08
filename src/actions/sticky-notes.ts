/**
 * Sticky Notes Server Actions
 * CRUD with AI analysis via Gemini
 */
"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/action-utils";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import { analyzeNote } from "@/lib/ai";
import { CACHE_TTL } from "@/lib/constants";
import type { NoteStatus, NoteCategory } from "@prisma/client";

/**
 * Schema for creating a sticky note
 */
const createNoteSchema = z.object({
  customerId: z.string().cuid(),
  content: z.string().min(1, "Nội dung không được để trống").max(2000),
  priority: z.number().int().min(1).max(10).optional(),
  category: z
    .enum(["GENERAL", "COMPLAINT", "REQUEST", "PAYMENT", "CARE", "OTHER"])
    .optional(),
});

/**
 * Schema for updating a sticky note
 */
const updateNoteSchema = z.object({
  id: z.string().cuid(),
  content: z.string().min(1).max(2000).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  category: z
    .enum(["GENERAL", "COMPLAINT", "REQUEST", "PAYMENT", "CARE", "OTHER"])
    .optional(),
});

/**
 * Get all sticky notes for a customer
 */
export async function getCustomerNotes(
  customerId: string,
  options?: {
    status?: NoteStatus;
    priority?: number;
    category?: NoteCategory;
    limit?: number;
  }
) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const notes = await prisma.stickyNote.findMany({
    where: {
      customerId,
      ...(options?.status && { status: options.status }),
      ...(options?.priority && { priority: options.priority }),
      ...(options?.category && { category: options.category }),
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { status: "asc" },
      { createdAt: "desc" },
    ],
    take: options?.limit,
  });

  return notes;
}

/**
 * Get a single note by ID
 */
export async function getNoteById(id: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const note = await prisma.stickyNote.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, code: true, companyName: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  if (!note) throw new NotFoundError("Ghi chú");
  return note;
}

/**
 * Create a new sticky note with AI analysis
 */
export const createStickyNote = createAction(createNoteSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { id: true, companyName: true, district: true },
  });
  if (!customer) throw new NotFoundError("Khách hàng");

  // Create note first (fast response)
  const note = await prisma.stickyNote.create({
    data: {
      customerId: input.customerId,
      content: input.content,
      status: "OPEN",
      priority: input.priority ?? 5,
      category: (input.category ?? "GENERAL") as NoteCategory,
      createdById: session.user.id,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Trigger async AI analysis (don't await)
  analyzeNoteAsync(note.id, input.content, customer).catch((err) =>
    console.error("AI analysis failed:", err)
  );

  revalidatePath(`/customers/${input.customerId}`);
  return note;
});

/**
 * Async AI analysis (called after note creation)
 */
async function analyzeNoteAsync(
  noteId: string,
  content: string,
  customer: { companyName: string; district: string | null }
) {
  try {
    const customerContext = `${customer.companyName}${
      customer.district ? `, ${customer.district}` : ""
    }`;

    const analysis = await analyzeNote(content, customerContext);

    if (analysis) {
      await prisma.stickyNote.update({
        where: { id: noteId },
        data: {
          category: analysis.category as NoteCategory,
          priority: typeof analysis.priority === 'number' ? analysis.priority : 5,
          aiAnalysis: analysis as unknown as Prisma.JsonObject,
          aiSuggestions: analysis.suggestions as unknown as Prisma.JsonArray,
        },
      });
    }
  } catch (error) {
    console.error("AI analysis error for note:", noteId, error);
  }
}

/**
 * Update a sticky note
 */
export const updateStickyNote = createAction(updateNoteSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const { id, ...updateData } = input;

  // Get existing note
  const existing = await prisma.stickyNote.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!existing) throw new NotFoundError("Ghi chú");

  // If resolving, set resolvedAt
  const data: Record<string, unknown> = { ...updateData };
  if (updateData.status === "RESOLVED" && existing.status !== "RESOLVED") {
    data.resolvedAt = new Date();
  }
  if (updateData.status === "OPEN" && existing.status === "RESOLVED") {
    data.resolvedAt = null;
  }

  const note = await prisma.stickyNote.update({
    where: { id },
    data,
  });

  // Re-analyze if content changed
  if (updateData.content && updateData.content !== existing.content) {
    analyzeNoteAsync(id, updateData.content, existing.customer).catch(
      (err) => console.error("Re-analysis failed:", err)
    );
  }

  revalidatePath(`/customers/${existing.customerId}`);
  return note;
});

/**
 * Delete a sticky note
 */
export const deleteStickyNote = createSimpleAction(async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const existing = await prisma.stickyNote.findUnique({
    where: { id },
  });
  if (!existing) throw new NotFoundError("Ghi chú");

  await prisma.stickyNote.delete({
    where: { id },
  });

  revalidatePath(`/customers/${existing.customerId}`);
  return { success: true };
});

/**
 * Get note statistics for dashboard
 */
/**
 * Get note statistics for dashboard
 * Optimized: Single raw SQL query with FILTER + cached for 1 minute
 */
const getCachedNoteStats = unstable_cache(
  async () => {
    // Single query with FILTER instead of separate queries
    const stats = await prisma.$queryRaw<[{
      total: bigint;
      open: bigint;
      urgent_priority: bigint;
      general: bigint;
      urgent: bigint;
      complaint: bigint;
      request: bigint;
      feedback: bigint;
      exchange: bigint;
      care: bigint;
      payment: bigint;
    }]>`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('OPEN', 'IN_PROGRESS')) as open,
        COUNT(*) FILTER (WHERE priority >= 8 AND status != 'RESOLVED') as urgent_priority,
        COUNT(*) FILTER (WHERE category = 'GENERAL' AND status != 'RESOLVED') as general,
        COUNT(*) FILTER (WHERE category = 'URGENT' AND status != 'RESOLVED') as urgent,
        COUNT(*) FILTER (WHERE category = 'COMPLAINT' AND status != 'RESOLVED') as complaint,
        COUNT(*) FILTER (WHERE category = 'REQUEST' AND status != 'RESOLVED') as request,
        COUNT(*) FILTER (WHERE category = 'FEEDBACK' AND status != 'RESOLVED') as feedback,
        COUNT(*) FILTER (WHERE category = 'EXCHANGE' AND status != 'RESOLVED') as exchange,
        COUNT(*) FILTER (WHERE category = 'CARE' AND status != 'RESOLVED') as care,
        COUNT(*) FILTER (WHERE category = 'PAYMENT' AND status != 'RESOLVED') as payment
      FROM sticky_notes
    `;

    return {
      total: Number(stats[0].total),
      open: Number(stats[0].open),
      urgent: Number(stats[0].urgent_priority),
      byCategory: {
        GENERAL: Number(stats[0].general),
        URGENT: Number(stats[0].urgent),
        COMPLAINT: Number(stats[0].complaint),
        REQUEST: Number(stats[0].request),
        FEEDBACK: Number(stats[0].feedback),
        EXCHANGE: Number(stats[0].exchange),
        CARE: Number(stats[0].care),
        PAYMENT: Number(stats[0].payment),
      } as Record<NoteCategory, number>,
    };
  },
  ["note-stats"],
  { revalidate: CACHE_TTL.STATS }
);

export async function getNoteStats() {
  await requireAuth();
  return getCachedNoteStats();
}

/**
 * Get recent notes across all customers (for dashboard)
 */
export async function getRecentNotes(limit: number = 10) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const notes = await prisma.stickyNote.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: {
      customer: {
        select: { id: true, code: true, companyName: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return notes;
}
