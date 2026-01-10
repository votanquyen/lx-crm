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
    customerTier: "STANDARD",
    quantity: 1,
    reason: null,
    createdAt: new Date(),
  };

  describe("priority level scoring (0-40 points)", () => {
    it("assigns 40 points for URGENT priority", () => {
      const input = { ...baseInput, priority: "URGENT" as const };
      const score = calculatePriorityScore(input);
      // URGENT(40) + STANDARD(8) + quantity(3) = 51
      expect(score).toBeGreaterThanOrEqual(51);
    });

    it("assigns 30 points for HIGH priority", () => {
      const input = { ...baseInput, priority: "HIGH" as const };
      const score = calculatePriorityScore(input);
      // HIGH(30) + STANDARD(8) + quantity(3) = 41
      expect(score).toBeGreaterThanOrEqual(41);
    });

    it("assigns 15 points for MEDIUM priority", () => {
      const input = { ...baseInput, priority: "MEDIUM" as const };
      const score = calculatePriorityScore(input);
      // MEDIUM(15) + STANDARD(8) + quantity(3) = 26
      expect(score).toBe(26);
    });

    it("assigns 5 points for LOW priority", () => {
      const input = { ...baseInput, priority: "LOW" as const };
      const score = calculatePriorityScore(input);
      // LOW(5) + STANDARD(8) + quantity(3) = 16
      expect(score).toBe(16);
    });
  });

  describe("customer tier scoring (0-25 points)", () => {
    it("assigns 25 points for VIP tier", () => {
      const input = { ...baseInput, customerTier: "VIP" as const };
      const score = calculatePriorityScore(input);
      // MEDIUM(15) + VIP(25) + quantity(3) = 43
      expect(score).toBe(43);
    });

    it("assigns 15 points for PREMIUM tier", () => {
      const input = { ...baseInput, customerTier: "PREMIUM" as const };
      const score = calculatePriorityScore(input);
      // MEDIUM(15) + PREMIUM(15) + quantity(3) = 33
      expect(score).toBe(33);
    });

    it("assigns 8 points for STANDARD tier", () => {
      const input = { ...baseInput, customerTier: "STANDARD" as const };
      const score = calculatePriorityScore(input);
      // MEDIUM(15) + STANDARD(8) + quantity(3) = 26
      expect(score).toBe(26);
    });
  });

  describe("quantity scoring (0-15 points)", () => {
    it("assigns 3 points per plant up to 15 max", () => {
      const input1 = { ...baseInput, quantity: 1 };
      const input3 = { ...baseInput, quantity: 3 };
      const input5 = { ...baseInput, quantity: 5 };

      expect(calculatePriorityScore(input1)).toBe(26); // 15 + 8 + 3
      expect(calculatePriorityScore(input3)).toBe(32); // 15 + 8 + 9
      expect(calculatePriorityScore(input5)).toBe(38); // 15 + 8 + 15 (capped)
    });

    it("caps quantity score at 15 points", () => {
      const input10 = { ...baseInput, quantity: 10 };
      const input20 = { ...baseInput, quantity: 20 };

      // Both should have same score since quantity is capped at 15
      expect(calculatePriorityScore(input10)).toBe(38); // 15 + 8 + 15
      expect(calculatePriorityScore(input20)).toBe(38); // 15 + 8 + 15
    });
  });

  describe("request age scoring (0-10 points)", () => {
    it("adds 1 point per day old up to 10 max", () => {
      const now = Date.now();
      const input5Days = {
        ...baseInput,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
      };
      const input10Days = {
        ...baseInput,
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      };

      // MEDIUM(15) + STANDARD(8) + quantity(3) + age(5) = 31
      expect(calculatePriorityScore(input5Days)).toBe(31);
      // MEDIUM(15) + STANDARD(8) + quantity(3) + age(10) = 36
      expect(calculatePriorityScore(input10Days)).toBe(36);
    });

    it("caps age score at 10 points", () => {
      const now = Date.now();
      const input30Days = {
        ...baseInput,
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      };

      // MEDIUM(15) + STANDARD(8) + quantity(3) + age(10 capped) = 36
      expect(calculatePriorityScore(input30Days)).toBe(36);
    });
  });

  describe("urgent keywords scoring (0-10 points)", () => {
    it("adds 10 points for Vietnamese urgent keywords", () => {
      const urgentReasons = [
        "Cây chết rồi",
        "Lá vàng lá hết",
        "Bị sâu bệnh",
        "Cần đổi gấp",
        "Khẩn cấp",
        "Cây hư",
        "Lá héo",
        "Rễ thối",
        "Thân mục",
        "Cần ngay",
        "Lập tức",
      ];

      urgentReasons.forEach((reason) => {
        const input = { ...baseInput, reason };
        // MEDIUM(15) + STANDARD(8) + quantity(3) + keyword(10) = 36
        expect(calculatePriorityScore(input)).toBe(36);
      });
    });

    it("detects unaccented Vietnamese keywords", () => {
      const unaccentedReasons = ["vang la", "sau benh", "gap", "khan", "hu", "heo", "thoi", "muc"];

      unaccentedReasons.forEach((reason) => {
        const input = { ...baseInput, reason };
        expect(calculatePriorityScore(input)).toBe(36);
      });
    });

    it("does not add points for non-urgent reasons", () => {
      const input = { ...baseInput, reason: "Muốn đổi cây khác loại" };
      expect(calculatePriorityScore(input)).toBe(26);
    });

    it("handles null reason", () => {
      const input = { ...baseInput, reason: null };
      expect(calculatePriorityScore(input)).toBe(26);
    });
  });

  describe("total score capping", () => {
    it("caps total score at 100", () => {
      const maxInput: PriorityScoringInput = {
        priority: "URGENT", // 40
        customerTier: "VIP", // 25
        quantity: 10, // 15 (capped)
        reason: "Cây chết rồi", // 10
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 10 (capped)
      };

      const score = calculatePriorityScore(maxInput);
      expect(score).toBe(100);
    });
  });

  describe("real-world scenarios", () => {
    it("calculates high priority for VIP customer with dying plants", () => {
      const input: PriorityScoringInput = {
        priority: "HIGH",
        customerTier: "VIP",
        quantity: 3,
        reason: "Cây héo và vàng lá, cần đổi gấp",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      };

      const score = calculatePriorityScore(input);
      // HIGH(30) + VIP(25) + quantity(9) + age(2) + keyword(10) = 76
      expect(score).toBe(76);
    });

    it("calculates low priority for standard customer with simple request", () => {
      const input: PriorityScoringInput = {
        priority: "LOW",
        customerTier: "STANDARD",
        quantity: 1,
        reason: "Muốn thay đổi bố trí cây",
        createdAt: new Date(),
      };

      const score = calculatePriorityScore(input);
      // LOW(5) + STANDARD(8) + quantity(3) = 16
      expect(score).toBe(16);
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
