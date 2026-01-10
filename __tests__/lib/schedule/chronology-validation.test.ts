/**
 * Unit Tests for Schedule Chronology Validation
 * Tests time sequence validation: arrivedAt < startedAt < completedAt
 */
import { describe, it, expect } from "vitest";
import { validateChronology } from "@/lib/validations/schedule";

describe("schedule: validateChronology", () => {
  describe("valid chronological order", () => {
    it("passes when all timestamps in correct order", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T08:00:00"),
        startedAt: new Date("2024-01-01T08:15:00"),
        completedAt: new Date("2024-01-01T09:00:00"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes when only arrivedAt provided", () => {
      const data = { arrivedAt: new Date("2024-01-01T08:00:00") };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes when only startedAt provided", () => {
      const data = { startedAt: new Date("2024-01-01T08:15:00") };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes when only completedAt provided", () => {
      const data = { completedAt: new Date("2024-01-01T09:00:00") };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes with null values", () => {
      const data = { arrivedAt: null, startedAt: null, completedAt: null };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes with undefined values", () => {
      const data = {};
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes when arrivedAt < startedAt (no completedAt)", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T08:00:00"),
        startedAt: new Date("2024-01-01T08:15:00"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("passes when startedAt < completedAt (no arrivedAt)", () => {
      const data = {
        startedAt: new Date("2024-01-01T08:15:00"),
        completedAt: new Date("2024-01-01T09:00:00"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });
  });

  describe("invalid: arrivedAt >= startedAt", () => {
    it("throws when arrivedAt equals startedAt", () => {
      const sameTime = new Date("2024-01-01T08:00:00");
      const data = { arrivedAt: sameTime, startedAt: sameTime };
      expect(() => validateChronology(data)).toThrow(/Thời gian đến.*phải trước.*bắt đầu/i);
    });

    it("throws when arrivedAt is after startedAt", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T08:30:00"),
        startedAt: new Date("2024-01-01T08:15:00"),
      };
      expect(() => validateChronology(data)).toThrow(/Thời gian đến.*phải trước.*bắt đầu/i);
    });
  });

  describe("invalid: startedAt >= completedAt", () => {
    it("throws when startedAt equals completedAt", () => {
      const sameTime = new Date("2024-01-01T09:00:00");
      const data = { startedAt: sameTime, completedAt: sameTime };
      expect(() => validateChronology(data)).toThrow(/bắt đầu.*phải trước.*hoàn thành/i);
    });

    it("throws when startedAt is after completedAt", () => {
      const data = {
        startedAt: new Date("2024-01-01T10:00:00"),
        completedAt: new Date("2024-01-01T09:00:00"),
      };
      expect(() => validateChronology(data)).toThrow(/bắt đầu.*phải trước.*hoàn thành/i);
    });
  });

  describe("invalid: arrivedAt >= completedAt", () => {
    it("throws when arrivedAt equals completedAt", () => {
      const sameTime = new Date("2024-01-01T09:00:00");
      const data = { arrivedAt: sameTime, completedAt: sameTime };
      expect(() => validateChronology(data)).toThrow(/đến.*phải trước.*hoàn thành/i);
    });

    it("throws when arrivedAt is after completedAt", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T10:00:00"),
        completedAt: new Date("2024-01-01T09:00:00"),
      };
      expect(() => validateChronology(data)).toThrow(/đến.*phải trước.*hoàn thành/i);
    });
  });

  describe("edge cases", () => {
    it("handles timestamps 1ms apart", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T08:00:00.000"),
        startedAt: new Date("2024-01-01T08:00:00.001"),
        completedAt: new Date("2024-01-01T08:00:00.002"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("handles dates across midnight", () => {
      const data = {
        arrivedAt: new Date("2024-01-01T23:55:00"),
        startedAt: new Date("2024-01-02T00:05:00"),
        completedAt: new Date("2024-01-02T01:00:00"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });

    it("handles dates across year boundary", () => {
      const data = {
        arrivedAt: new Date("2023-12-31T23:55:00"),
        startedAt: new Date("2024-01-01T00:05:00"),
        completedAt: new Date("2024-01-01T01:00:00"),
      };
      expect(() => validateChronology(data)).not.toThrow();
    });
  });
});
