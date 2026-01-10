/**
 * Exchange Request Priority Scoring
 * Calculates priority score (0-100) based on multiple factors
 */

import type { ExchangePriority, CustomerTier } from "@prisma/client";

export interface PriorityScoringInput {
  priority: ExchangePriority;
  customerTier: CustomerTier;
  quantity: number;
  reason?: string | null;
  createdAt: Date;
}

/**
 * Vietnamese keywords that indicate urgency
 */
const URGENT_KEYWORDS = [
  "chết",
  "vàng lá",
  "vang la",
  "sâu bệnh",
  "sau benh",
  "gấp",
  "gap",
  "khẩn",
  "khan",
  "hư",
  "hu",
  "héo",
  "heo",
  "thối",
  "thoi",
  "mục",
  "muc",
  "ngay",
  "lập tức",
  "lap tuc",
];

/**
 * Calculate priority score (0-100) for exchange request
 * Higher score = more urgent, should be processed first
 *
 * Scoring breakdown:
 * - Priority level: 0-40 points
 * - Customer tier: 0-25 points
 * - Plant quantity: 0-15 points
 * - Request age: 0-10 points
 * - Urgent keywords: 0-10 points
 */
export function calculatePriorityScore(input: PriorityScoringInput): number {
  let score = 0;

  // Priority level weight (0-40)
  const priorityScores: Record<ExchangePriority, number> = {
    URGENT: 40,
    HIGH: 30,
    MEDIUM: 15,
    LOW: 5,
  };
  score += priorityScores[input.priority] ?? 15;

  // Customer tier weight (0-25)
  const tierScores: Record<CustomerTier, number> = {
    VIP: 25,
    PREMIUM: 15,
    STANDARD: 8,
  };
  score += tierScores[input.customerTier] ?? 8;

  // Plant quantity weight (0-15) - more plants = higher priority
  score += Math.min(input.quantity * 3, 15);

  // Request age weight (0-10) - older requests get higher priority
  const ageInDays = Math.floor(
    (Date.now() - input.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  score += Math.min(ageInDays, 10);

  // Urgent keywords weight (0-10)
  if (input.reason) {
    const reasonLower = input.reason.toLowerCase();
    const hasUrgentKeyword = URGENT_KEYWORDS.some((kw) =>
      reasonLower.includes(kw)
    );
    if (hasUrgentKeyword) {
      score += 10;
    }
  }

  return Math.min(score, 100);
}

/**
 * Get priority label with color for UI display
 */
export function getPriorityLabel(score: number): {
  label: string;
  color: "destructive" | "warning" | "default" | "secondary";
} {
  if (score >= 80) {
    return { label: "Khẩn cấp", color: "destructive" };
  }
  if (score >= 60) {
    return { label: "Cao", color: "warning" };
  }
  if (score >= 40) {
    return { label: "Trung bình", color: "default" };
  }
  return { label: "Thấp", color: "secondary" };
}
