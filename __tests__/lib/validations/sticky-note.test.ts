/**
 * Unit tests for Sticky Note Schema validation
 */
import { describe, it, expect } from "vitest";
import { createStickyNoteSchema, updateStickyNoteSchema } from "@/lib/validations/sticky-note";

describe("Sticky Note Validation Schemas", () => {
  describe("createStickyNoteSchema", () => {
    it("should require a customerId (current validation status)", () => {
      const result = createStickyNoteSchema.safeParse({
        content: "Test note without customerId",
      });

      // In Phase 1, we updated the Prisma model but createStickyNoteSchema might still require it
      // Let's verify current behavior
      expect(result.success).toBe(false);
    });

    it("should successfully parse with all required fields", () => {
      const result = createStickyNoteSchema.safeParse({
        customerId: "clux1234567890abcdefg",
        content: "Test note content",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("updateStickyNoteSchema", () => {
    it("should allow partial updates", () => {
      const result = updateStickyNoteSchema.safeParse({
        content: "Updated content",
      });

      expect(result.success).toBe(true);
    });

    it("should allow updating priority", () => {
      const result = updateStickyNoteSchema.safeParse({
        priority: 8,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(8);
      }
    });
  });
});
