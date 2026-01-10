/**
 * Churn Prediction Module
 * Identifies customers at risk of not renewing contracts using hybrid approach:
 * - Rule-based scoring for structured data (payment, exchange, satisfaction)
 * - LLM sentiment analysis for unstructured data (sticky notes)
 */

import { callAI, extractJson } from "./multi-provider-client";

// Scoring weight constants
const PAYMENT_WEIGHT = 25; // 0-25 points
const EXCHANGE_WEIGHT = 20; // 0-20 points
const SATISFACTION_WEIGHT = 15; // 0-15 points
const SENTIMENT_WEIGHT = 40; // 0-40 points (LLM)

/**
 * Payment behavior metrics from invoices
 */
export interface PaymentMetrics {
  /** Number of overdue invoices in last 6 months */
  overdueCount: number;
  /** Average days late for paid invoices */
  avgDaysLate: number;
  /** Ratio of partial payments (0-1) */
  partialPaymentRatio: number;
}

/**
 * Contract-related metrics
 */
export interface ContractMetrics {
  /** Contract age in months */
  contractAgeMonths: number;
  /** Number of times contract was renewed */
  renewalCount: number;
  /** Current monthly fee in VND */
  currentMonthlyFee: number;
}

/**
 * Operational metrics from care and exchange
 */
export interface OperationalMetrics {
  /** Number of exchange requests in last 30 days */
  exchangeCount30Days: number;
  /** Number of complaints from care visits */
  careComplaintCount: number;
  /** Last satisfaction rating (1-5 scale, null if none) */
  lastSatisfactionRating: number | null;
}

/**
 * Input for churn risk calculation
 */
export interface ChurnRiskInput {
  customerId: string;
  customerName: string;
  paymentMetrics: PaymentMetrics;
  contractMetrics: ContractMetrics;
  operationalMetrics: OperationalMetrics;
  /** Last 5 sticky notes for sentiment analysis */
  recentNotes: string[];
}

/**
 * Risk level classification
 */
export type ChurnRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Result of churn risk calculation
 */
export interface ChurnRiskResult {
  /** Overall risk score 0-100 */
  riskScore: number;
  /** Risk level classification */
  riskLevel: ChurnRiskLevel;
  /** Contributing factors in Vietnamese */
  factors: string[];
  /** Recommended retention actions in Vietnamese */
  recommendedActions: string[];
  /** Breakdown of score components */
  scoreBreakdown: {
    paymentScore: number;
    exchangeScore: number;
    satisfactionScore: number;
    sentimentScore: number;
  };
}

/**
 * Sentiment analysis result from LLM
 */
interface SentimentResult {
  /** Negative sentiment score 0-1 (1 = very negative) */
  negativeScore: number;
  /** Keywords indicating concern */
  concernKeywords: string[];
}

/**
 * Calculate payment-related risk score (0-25 points)
 */
function calculatePaymentScore(metrics: PaymentMetrics): {
  score: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Overdue invoices (0-20 points)
  if (metrics.overdueCount >= 3) {
    score += 20;
    factors.push(`${metrics.overdueCount} hóa đơn quá hạn trong 6 tháng`);
  } else if (metrics.overdueCount >= 1) {
    score += metrics.overdueCount * 7;
    factors.push(`${metrics.overdueCount} hóa đơn quá hạn`);
  }

  // Average days late (0-5 points)
  if (metrics.avgDaysLate > 30) {
    score += 5;
    factors.push(`Trung bình thanh toán trễ ${Math.round(metrics.avgDaysLate)} ngày`);
  } else if (metrics.avgDaysLate > 14) {
    score += 3;
  }

  return { score: Math.min(score, PAYMENT_WEIGHT), factors };
}

/**
 * Calculate exchange-related risk score (0-20 points)
 */
function calculateExchangeScore(metrics: OperationalMetrics): {
  score: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Exchange frequency (0-15 points)
  if (metrics.exchangeCount30Days >= 3) {
    score += 15;
    factors.push(`Đổi cây thường xuyên (${metrics.exchangeCount30Days} lần/tháng)`);
  } else if (metrics.exchangeCount30Days >= 2) {
    score += 10;
    factors.push(`Đổi cây ${metrics.exchangeCount30Days} lần trong tháng`);
  }

  // Care complaints (0-5 points)
  if (metrics.careComplaintCount >= 2) {
    score += 5;
    factors.push(`${metrics.careComplaintCount} khiếu nại về chăm sóc`);
  } else if (metrics.careComplaintCount >= 1) {
    score += 3;
  }

  return { score: Math.min(score, EXCHANGE_WEIGHT), factors };
}

/**
 * Calculate satisfaction-related risk score (0-15 points)
 */
function calculateSatisfactionScore(metrics: OperationalMetrics): {
  score: number;
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  const rating = metrics.lastSatisfactionRating;
  if (rating === null) {
    // No rating - neutral
    return { score: 0, factors: [] };
  }

  if (rating <= 2) {
    score = 15;
    factors.push(`Đánh giá hài lòng rất thấp (${rating}/5)`);
  } else if (rating <= 3) {
    score = 8;
    factors.push(`Đánh giá hài lòng thấp (${rating}/5)`);
  }

  return { score: Math.min(score, SATISFACTION_WEIGHT), factors };
}

/**
 * Analyze sentiment of sticky notes using LLM
 * Uses vietnamese_nlp task type for best Vietnamese text analysis (Qwen3 first)
 */
async function analyzeSentiment(notes: string[]): Promise<SentimentResult> {
  if (notes.length === 0) {
    return { negativeScore: 0, concernKeywords: [] };
  }

  const prompt = `Phân tích sentiment của các ghi chú khách hàng sau.
Đánh giá mức độ tiêu cực và tìm các từ khóa thể hiện sự không hài lòng.

Ghi chú:
${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Trả lời ĐÚNG định dạng JSON (không có text khác):
{
  "negativeScore": <số từ 0-1, 0=tích cực, 1=rất tiêu cực>,
  "concernKeywords": ["từ khóa 1", "từ khóa 2"]
}`;

  try {
    const response = await callAI(prompt, "vietnamese_nlp");
    const result = extractJson<SentimentResult>(response);

    // Validate and clamp negativeScore
    const negativeScore = Math.max(0, Math.min(1, result.negativeScore || 0));
    const concernKeywords = Array.isArray(result.concernKeywords)
      ? result.concernKeywords.filter((k): k is string => typeof k === "string")
      : [];

    return { negativeScore, concernKeywords };
  } catch (error) {
    console.error("[ChurnPrediction] Sentiment analysis failed:", error);
    // Fallback: simple keyword-based analysis
    return fallbackSentimentAnalysis(notes);
  }
}

/**
 * Fallback sentiment analysis using keyword matching
 * Used when LLM is unavailable
 */
function fallbackSentimentAnalysis(notes: string[]): SentimentResult {
  const negativeKeywords = [
    "không hài lòng",
    "thất vọng",
    "tệ",
    "kém",
    "chậm",
    "trễ",
    "hủy",
    "dừng",
    "ngưng",
    "khiếu nại",
    "phàn nàn",
    "vấn đề",
    "lỗi",
    "sai",
    "chết",
    "héo",
    "xấu",
  ];

  const combinedText = notes.join(" ").toLowerCase();
  const matchedKeywords: string[] = [];

  for (const keyword of negativeKeywords) {
    if (combinedText.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }

  const negativeScore = Math.min(matchedKeywords.length * 0.15, 1);

  return {
    negativeScore,
    concernKeywords: matchedKeywords.slice(0, 5),
  };
}

/**
 * Generate retention actions based on risk factors
 */
function generateRetentionActions(
  factors: string[],
  riskLevel: ChurnRiskLevel
): string[] {
  const actions: string[] = [];

  // Payment-related actions
  if (factors.some((f) => f.includes("quá hạn") || f.includes("thanh toán"))) {
    actions.push("Liên hệ nhắc thanh toán và tìm hiểu khó khăn");
    actions.push("Đề xuất kế hoạch thanh toán linh hoạt");
  }

  // Exchange-related actions
  if (factors.some((f) => f.includes("đổi cây") || f.includes("Đổi cây"))) {
    actions.push("Kiểm tra chất lượng cây tại địa điểm khách hàng");
    actions.push("Đề xuất loại cây phù hợp hơn với điều kiện môi trường");
  }

  // Satisfaction-related actions
  if (factors.some((f) => f.includes("hài lòng"))) {
    actions.push("Gọi điện khảo sát chi tiết nguyên nhân không hài lòng");
    actions.push("Cử nhân viên quản lý đến thăm trực tiếp");
  }

  // Complaint-related actions
  if (factors.some((f) => f.includes("khiếu nại"))) {
    actions.push("Xem lại lịch sử khiếu nại và giải quyết triệt để");
  }

  // Critical level actions
  if (riskLevel === "CRITICAL") {
    actions.push("Gọi điện trực tiếp từ quản lý cấp cao");
    actions.push("Đề xuất ưu đãi đặc biệt để giữ chân khách hàng");
    actions.push("Ưu tiên xử lý mọi yêu cầu của khách hàng");
  }

  // High level actions
  if (riskLevel === "HIGH" && actions.length < 3) {
    actions.push("Lên lịch gặp mặt trực tiếp trong tuần");
  }

  // Ensure at least one action
  if (actions.length === 0) {
    actions.push("Theo dõi và duy trì liên lạc định kỳ");
  }

  return actions;
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): ChurnRiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate churn risk for a customer
 * Uses hybrid approach: rule-based + LLM sentiment analysis
 */
export async function calculateChurnRisk(
  input: ChurnRiskInput
): Promise<ChurnRiskResult> {
  const allFactors: string[] = [];

  // Step 1: Calculate rule-based scores
  const paymentResult = calculatePaymentScore(input.paymentMetrics);
  allFactors.push(...paymentResult.factors);

  const exchangeResult = calculateExchangeScore(input.operationalMetrics);
  allFactors.push(...exchangeResult.factors);

  const satisfactionResult = calculateSatisfactionScore(input.operationalMetrics);
  allFactors.push(...satisfactionResult.factors);

  // Step 2: Calculate sentiment score (LLM)
  let sentimentScore = 0;
  if (input.recentNotes.length > 0) {
    const sentimentResult = await analyzeSentiment(input.recentNotes);
    sentimentScore = Math.round(sentimentResult.negativeScore * SENTIMENT_WEIGHT);

    // Add concern keywords as factors
    if (sentimentResult.concernKeywords.length > 0) {
      allFactors.push(
        `Ghi chú có từ khóa tiêu cực: ${sentimentResult.concernKeywords.join(", ")}`
      );
    }
  }

  // Step 3: Calculate total score
  const totalScore = Math.min(
    paymentResult.score +
      exchangeResult.score +
      satisfactionResult.score +
      sentimentScore,
    100
  );

  // Step 4: Determine risk level and actions
  const riskLevel = getRiskLevel(totalScore);
  const recommendedActions = generateRetentionActions(allFactors, riskLevel);

  return {
    riskScore: totalScore,
    riskLevel,
    factors: allFactors,
    recommendedActions,
    scoreBreakdown: {
      paymentScore: paymentResult.score,
      exchangeScore: exchangeResult.score,
      satisfactionScore: satisfactionResult.score,
      sentimentScore,
    },
  };
}

/**
 * Get Vietnamese label for risk level
 */
export function getChurnRiskLabel(level: ChurnRiskLevel): string {
  const labels: Record<ChurnRiskLevel, string> = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    CRITICAL: "Rất cao",
  };
  return labels[level];
}

/**
 * Get color class for risk level (Tailwind)
 */
export function getChurnRiskColor(level: ChurnRiskLevel): string {
  const colors: Record<ChurnRiskLevel, string> = {
    LOW: "text-green-600 bg-green-50",
    MEDIUM: "text-yellow-600 bg-yellow-50",
    HIGH: "text-orange-600 bg-orange-50",
    CRITICAL: "text-red-600 bg-red-50",
  };
  return colors[level];
}
