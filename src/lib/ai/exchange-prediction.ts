/**
 * Exchange/Maintenance Prediction Module
 * Predicts when plants need exchange based on health scoring
 * Uses rule-based approach with historical learning
 */

import type { ExchangePriority } from "@prisma/client";

/**
 * Location condition affecting plant lifespan
 */
export type LocationCondition = "INDOOR" | "OUTDOOR" | "MIXED";

/**
 * Plant lifespan configuration by category (in days)
 */
const PLANT_LIFESPAN_DAYS: Record<string, number> = {
  // Indoor foliage plants
  indoor_foliage: 180, // 6 months
  kim_tien: 180,
  phat_tai: 180,
  van_nien_thanh: 180,
  trau_ba: 150,

  // Outdoor plants
  outdoor_palm: 365, // 1 year
  cau_hawaii: 365,
  cau_vua: 300,

  // Flowering plants (shorter life)
  flowering: 90, // 3 months
  hoa_lan: 90,
  hoa_hong: 60,

  // Succulents (long life)
  succulent: 365,
  sen_da: 365,
  xuong_rong: 400,

  // Default for unknown types
  default: 180,
};

/**
 * Condition multipliers for plant lifespan
 * Outdoor conditions reduce lifespan
 */
const CONDITION_MULTIPLIERS: Record<LocationCondition, number> = {
  INDOOR: 1.0, // Normal lifespan
  OUTDOOR: 0.8, // 20% shorter
  MIXED: 0.9, // 10% shorter
};

/**
 * Vietnamese keywords indicating plant health issues
 */
const HEALTH_WARNING_KEYWORDS = [
  "vàng lá",
  "héo",
  "sâu bệnh",
  "thối rễ",
  "khô",
  "chết",
  "rụng lá",
  "nấm",
  "côn trùng",
  "yếu",
  "không phát triển",
];

/**
 * Input for plant health prediction
 */
export interface PlantHealthInput {
  /** Plant type ID */
  plantTypeId: string;
  /** Plant type name (for display) */
  plantTypeName: string;
  /** Plant type code/slug (for lifespan lookup) */
  plantTypeCode?: string;
  /** When plant was installed at customer location */
  installedAt: Date;
  /** When plant was last exchanged (null if never) */
  lastExchangeAt: Date | null;
  /** Location condition */
  locationCondition: LocationCondition;
  /** Recent care notes for early warning detection */
  recentCareNotes: string[];
  /** Historical average exchange interval in days (null if no history) */
  avgExchangeIntervalDays: number | null;
}

/**
 * Urgency level for exchange recommendation
 */
export type ExchangeUrgency = "NONE" | "UPCOMING" | "RECOMMENDED" | "URGENT";

/**
 * Result of exchange prediction
 */
export interface ExchangeRecommendation {
  /** Health score 0-100 (100 = healthy, 0 = needs immediate exchange) */
  healthScore: number;
  /** Urgency level */
  urgency: ExchangeUrgency;
  /** Estimated days remaining before exchange needed */
  estimatedDaysRemaining: number;
  /** Reason in Vietnamese */
  reason: string;
  /** Early warning detected from care notes */
  hasEarlyWarning: boolean;
  /** Warning keywords found */
  warningKeywords: string[];
}

/**
 * Get base lifespan for a plant type
 */
function getPlantLifespan(plantTypeCode?: string): number {
  const defaultLifespan = PLANT_LIFESPAN_DAYS.default ?? 180;
  if (!plantTypeCode) return defaultLifespan;

  const code = plantTypeCode.toLowerCase().replace(/[\s-]/g, "_");

  // Try exact match first
  const exactMatch = PLANT_LIFESPAN_DAYS[code];
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  // Try partial match
  for (const key of Object.keys(PLANT_LIFESPAN_DAYS)) {
    if (code.includes(key) || key.includes(code)) {
      const partialMatch = PLANT_LIFESPAN_DAYS[key];
      if (partialMatch !== undefined) {
        return partialMatch;
      }
    }
  }

  return defaultLifespan;
}

/**
 * Check care notes for health warning keywords
 */
function checkHealthWarnings(notes: string[]): {
  hasWarning: boolean;
  keywords: string[];
} {
  const combinedText = notes.join(" ").toLowerCase();
  const foundKeywords: string[] = [];

  for (const keyword of HEALTH_WARNING_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  return {
    hasWarning: foundKeywords.length > 0,
    keywords: foundKeywords,
  };
}

/**
 * Calculate days since a date
 */
function daysSince(date: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Predict exchange need for a single plant
 * Returns health score and urgency recommendation
 */
export function predictExchangeNeed(input: PlantHealthInput): ExchangeRecommendation {
  // Get base lifespan for plant type
  const baseLifespan = getPlantLifespan(input.plantTypeCode);

  // Apply condition multiplier
  const conditionMultiplier = CONDITION_MULTIPLIERS[input.locationCondition];

  // Calculate expected lifespan
  // If historical data available, blend with base (70% historical, 30% base)
  let expectedLifespan: number;
  if (input.avgExchangeIntervalDays && input.avgExchangeIntervalDays > 0) {
    expectedLifespan =
      input.avgExchangeIntervalDays * 0.7 + baseLifespan * conditionMultiplier * 0.3;
  } else {
    expectedLifespan = baseLifespan * conditionMultiplier;
  }

  // Calculate age since last exchange or installation
  const referenceDate = input.lastExchangeAt || input.installedAt;
  const ageInDays = daysSince(referenceDate);

  // Calculate lifespan ratio and health score
  const lifespanRatio = ageInDays / expectedLifespan;
  const healthScore = Math.max(0, Math.round((1 - lifespanRatio) * 100));
  const daysRemaining = Math.max(0, Math.round(expectedLifespan - ageInDays));

  // Check for early warnings in care notes
  const warningCheck = checkHealthWarnings(input.recentCareNotes);

  // Determine urgency level
  let urgency: ExchangeUrgency;
  let reason: string;

  if (lifespanRatio >= 1.0) {
    urgency = "URGENT";
    reason = `Đã quá hạn đổi cây ${Math.abs(daysRemaining)} ngày`;
  } else if (lifespanRatio >= 0.85) {
    urgency = "RECOMMENDED";
    reason = `Còn khoảng ${daysRemaining} ngày, nên lên lịch đổi cây`;
  } else if (lifespanRatio >= 0.7) {
    urgency = "UPCOMING";
    reason = `Còn khoảng ${daysRemaining} ngày trước khi cần đổi`;
  } else {
    urgency = "NONE";
    reason = `Cây còn khỏe, còn khoảng ${daysRemaining} ngày`;
  }

  // Escalate urgency if early warning detected
  if (warningCheck.hasWarning) {
    if (urgency === "NONE") {
      urgency = "UPCOMING";
      reason = "Phát hiện dấu hiệu bất thường từ báo cáo chăm sóc";
    } else if (urgency === "UPCOMING") {
      urgency = "RECOMMENDED";
      reason += " + có dấu hiệu bất thường";
    } else if (urgency === "RECOMMENDED") {
      reason += " + có dấu hiệu bất thường nghiêm trọng";
    }
  }

  return {
    healthScore,
    urgency,
    estimatedDaysRemaining: daysRemaining,
    reason,
    hasEarlyWarning: warningCheck.hasWarning,
    warningKeywords: warningCheck.keywords,
  };
}

/**
 * Get Vietnamese label for urgency level
 */
export function getExchangeUrgencyLabel(urgency: ExchangeUrgency): string {
  const labels: Record<ExchangeUrgency, string> = {
    NONE: "Bình thường",
    UPCOMING: "Sắp đến hạn",
    RECOMMENDED: "Nên đổi",
    URGENT: "Cần đổi ngay",
  };
  return labels[urgency];
}

/**
 * Get color class for urgency level (Tailwind)
 */
export function getExchangeUrgencyColor(urgency: ExchangeUrgency): string {
  const colors: Record<ExchangeUrgency, string> = {
    NONE: "text-green-600 bg-green-50",
    UPCOMING: "text-blue-600 bg-blue-50",
    RECOMMENDED: "text-orange-600 bg-orange-50",
    URGENT: "text-red-600 bg-red-50",
  };
  return colors[urgency];
}

/**
 * Map exchange priority to urgency (for comparison)
 */
export function priorityToUrgency(priority: ExchangePriority): ExchangeUrgency {
  const mapping: Record<ExchangePriority, ExchangeUrgency> = {
    URGENT: "URGENT",
    HIGH: "RECOMMENDED",
    MEDIUM: "UPCOMING",
    LOW: "NONE",
  };
  return mapping[priority];
}

/**
 * Map urgency to exchange priority (for creating requests)
 */
export function urgencyToPriority(urgency: ExchangeUrgency): ExchangePriority {
  const mapping: Record<ExchangeUrgency, ExchangePriority> = {
    URGENT: "URGENT",
    RECOMMENDED: "HIGH",
    UPCOMING: "MEDIUM",
    NONE: "LOW",
  };
  return mapping[urgency];
}

/**
 * Batch prediction result for a customer
 */
export interface CustomerPlantHealth {
  plantId: string;
  plantTypeId: string;
  plantTypeName: string;
  quantity: number;
  recommendation: ExchangeRecommendation;
}

/**
 * Summary of customer plant health
 */
export interface CustomerHealthSummary {
  customerId: string;
  customerName: string;
  totalPlants: number;
  plantsNeedingAttention: number;
  worstHealthScore: number;
  worstUrgency: ExchangeUrgency;
  plants: CustomerPlantHealth[];
}

/**
 * Get urgency priority for sorting (higher = more urgent)
 */
export function getUrgencyPriority(urgency: ExchangeUrgency): number {
  const priorities: Record<ExchangeUrgency, number> = {
    URGENT: 4,
    RECOMMENDED: 3,
    UPCOMING: 2,
    NONE: 1,
  };
  return priorities[urgency];
}
