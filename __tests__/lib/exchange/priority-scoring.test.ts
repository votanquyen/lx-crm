/**
 * Unit Tests for Priority Scoring
 * Tests exchange request priority calculation logic
 */
import { describe, it, expect } from "vitest";
import {
  calculatePriorityScore,
  getPriorityLabel,
  type PriorityScoringInput,
} from "@/lib/exchange/priority-scoring";

describe("priority-scoring: calculatePriorityScore", () => {
  const baseInput: PriorityScoringInput = {
    priority: "MEDIUM",
    quantity: 1,
    reason: null,
    createdAt: new Date(),
  };

  describe("priority level scoring (0-40 points)", () => {
    it("assigns 40 points for URGENT priority", () => {
      const input = { ...baseInput, priority: "URGENT" as const };
      const score = calculatePriorityScore(input);
      // URGENT(40) + quantity(4) = 44
      expect(score).toBeGreaterThanOrEqual(44);
    });

    it("assigns 30 points for HIGH priority", () => {
      const input = { ...baseInput, priority: "HIGH" as const };
      const score = calculatePriorityScore(input);
      // HIGH(30) + quantity(4) = 34
      expect(score).toBeGreaterThanOrEqual(34);
    });

    it("assigns 15 points for MEDIUM priority", () => {
      const input = { ...baseInput, priority: "MEDIUM" as const };
      const score = calculatePriorityScore(input);
      // MEDIUM(15) + quantity(4) = 19
      expect(score).toBe(19);
    });

    it("assigns 5 points for LOW priority", () => {
      const input = { ...baseInput, priority: "LOW" as const };
      const score = calculatePriorityScore(input);
      // LOW(5) + quantity(4) = 9
      expect(score).toBe(9);
    });
  });

  describe("quantity scoring (0-20 points)", () => {
    it("assigns 4 points per plant up to 20 max", () => {
      const input1 = { ...baseInput, quantity: 1 };
      const input3 = { ...baseInput, quantity: 3 };
      const input5 = { ...baseInput, quantity: 5 };

      expect(calculatePriorityScore(input1)).toBe(19); // 15 + 4
      expect(calculatePriorityScore(input3)).toBe(27); // 15 + 12
      expect(calculatePriorityScore(input5)).toBe(35); // 15 + 20 (capped)
    });

    it("caps quantity score at 20 points", () => {
      const input10 = { ...baseInput, quantity: 10 };
      const input20 = { ...baseInput, quantity: 20 };

      // Both should have same score since quantity is capped at 20
      expect(calculatePriorityScore(input10)).toBe(35); // 15 + 20
      expect(calculatePriorityScore(input20)).toBe(35); // 15 + 20
    });
  });

  describe("request age scoring (0-20 points)", () => {
    it("adds 2 points per day old up to 20 max", () => {
      const now = Date.now();
      const input5Days = {
        ...baseInput,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      };
      const input10Days = {
        ...baseInput,
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      };

      // MEDIUM(15) + quantity(4) + age(10) = 29
      expect(calculatePriorityScore(input5Days)).toBe(29);
      // MEDIUM(15) + quantity(4) + age(20) = 39
      expect(calculatePriorityScore(input10Days)).toBe(39);
    });

    it("caps age score at 20 points", () => {
      const now = Date.now();
      const input30Days = {
        ...baseInput,
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      };

      // MEDIUM(15) + quantity(4) + age(20 capped) = 39
      expect(calculatePriorityScore(input30Days)).toBe(39);
    });
  });

  describe("urgent keywords scoring (0-10 points)", () => {
    it("adds 10 points for Vietnamese urgent keywords", () => {
      const urgentReasons = [
        "Cay chet roi",
        "La vang la het",
        "Bi sau benh",
        "Can doi gap",
        "Khan cap",
        "Cay hu",
        "La heo",
        "Re thoi",
        "Than muc",
        "Can ngay",
        "Lap tuc",
      ];

      urgentReasons.forEach((reason) => {
        const input = { ...baseInput, reason };
        // MEDIUM(15) + quantity(4) + keyword(10) = 29
        expect(calculatePriorityScore(input)).toBe(29);
      });
    });

    it("detects unaccented Vietnamese keywords", () => {
      const unaccentedReasons = ["vang la", "sau benh", "gap", "khan", "hu", "heo", "thoi", "muc"];

      unaccentedReasons.forEach((reason) => {
        const input = { ...baseInput, reason };
        expect(calculatePriorityScore(input)).toBe(29);
      });
    });

    it("does not add points for non-urgent reasons", () => {
      const input = { ...baseInput, reason: "Muon doi cay khac loai" };
      expect(calculatePriorityScore(input)).toBe(19);
    });

    it("handles null reason", () => {
      const input = { ...baseInput, reason: null };
      expect(calculatePriorityScore(input)).toBe(19);
    });
  });

  describe("total score capping", () => {
    it("caps total score at 100", () => {
      const maxInput: PriorityScoringInput = {
        priority: "URGENT", // 40
        quantity: 10, // 20 (capped)
        reason: "Cay chet roi", // 10
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 20 (capped)
      };

      const score = calculatePriorityScore(maxInput);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("real-world scenarios", () => {
    it("calculates high priority for customer with dying plants", () => {
      const input: PriorityScoringInput = {
        priority: "HIGH",
        quantity: 3,
        reason: "Cay heo va vang la, can doi gap",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      };

      const score = calculatePriorityScore(input);
      // HIGH(30) + quantity(12) + age(4) + keyword(10) = 56
      expect(score).toBe(56);
    });

    it("calculates low priority for standard customer with simple request", () => {
      const input: PriorityScoringInput = {
        priority: "LOW",
        quantity: 1,
        reason: "Muon thay doi bo tri cay",
        createdAt: new Date(),
      };

      const score = calculatePriorityScore(input);
      // LOW(5) + quantity(4) = 9
      expect(score).toBe(9);
    });
  });
});

describe("priority-scoring: getPriorityLabel", () => {
  it('returns "Khẩn cấp" with destructive color for score >= 80', () => {
    expect(getPriorityLabel(80)).toEqual({ label: "Khẩn cấp", color: "destructive" });
    expect(getPriorityLabel(100)).toEqual({ label: "Khẩn cấp", color: "destructive" });
  });

  it('returns "Cao" with warning color for score 60-79', () => {
    expect(getPriorityLabel(60)).toEqual({ label: "Cao", color: "warning" });
    expect(getPriorityLabel(79)).toEqual({ label: "Cao", color: "warning" });
  });

  it('returns "Trung bình" with default color for score 40-59', () => {
    expect(getPriorityLabel(40)).toEqual({ label: "Trung bình", color: "default" });
    expect(getPriorityLabel(59)).toEqual({ label: "Trung bình", color: "default" });
  });

  it('returns "Thấp" with secondary color for score < 40', () => {
    expect(getPriorityLabel(0)).toEqual({ label: "Thấp", color: "secondary" });
    expect(getPriorityLabel(39)).toEqual({ label: "Thấp", color: "secondary" });
  });
});
