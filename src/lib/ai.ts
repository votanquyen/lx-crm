/**
 * AI Service - Multi-Provider Integration (OpenRouter + Groq + Gemini)
 * For note analysis, suggestions, and natural language search
 *
 * Primary: DeepSeek V3 (OpenRouter) - Best Vietnamese, FREE
 * Fallback: Groq Llama 3.3 → Qwen 2.5 → Gemini 2.0 Flash
 */

import { callAI, extractJson } from "./ai/multi-provider-client";

export interface NoteAnalysis {
  category: "GENERAL" | "COMPLAINT" | "REQUEST" | "PAYMENT" | "CARE" | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  entities: {
    plants?: string[];
    actions?: string[];
    dates?: string[];
    amounts?: string[];
  };
  summary: string;
  suggestions: Array<{
    action: string;
    actionType: "EXCHANGE" | "CARE" | "PAYMENT" | "CONTACT" | "OTHER";
    priority: number;
  }>;
}

/**
 * Analyze a customer note using multi-provider AI
 * Primary: DeepSeek V3 (excellent Vietnamese), Fallback: Groq → Qwen → Gemini
 */
export async function analyzeNote(
  content: string,
  customerContext: string
): Promise<NoteAnalysis | null> {
  const prompt = `Bạn là trợ lý AI cho hệ thống CRM cho thuê cây xanh. Phân tích ghi chú khách hàng sau và trả về JSON.

Ngữ cảnh khách hàng: ${customerContext}

Nội dung ghi chú:
"""
${content}
"""

Phân tích và trả về JSON với cấu trúc sau:
{
  "category": "GENERAL" | "COMPLAINT" | "REQUEST" | "PAYMENT" | "CARE" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "entities": {
    "plants": ["tên cây nếu có đề cập"],
    "actions": ["hành động cần thực hiện"],
    "dates": ["ngày tháng nếu có đề cập"],
    "amounts": ["số tiền nếu có đề cập"]
  },
  "summary": "tóm tắt ngắn gọn nội dung ghi chú (1-2 câu)",
  "suggestions": [
    {
      "action": "mô tả hành động đề xuất",
      "actionType": "EXCHANGE" | "CARE" | "PAYMENT" | "CONTACT" | "OTHER",
      "priority": 1-5
    }
  ]
}

Quy tắc:
- COMPLAINT: khách phàn nàn, không hài lòng
- REQUEST: khách yêu cầu đổi cây, thêm cây, thay đổi dịch vụ
- PAYMENT: liên quan đến thanh toán, nợ, hóa đơn
- CARE: liên quan đến chăm sóc, tưới nước, sức khỏe cây
- priority URGENT: cần xử lý trong 24h
- priority HIGH: cần xử lý trong 3 ngày
- priority MEDIUM: cần xử lý trong 1 tuần
- priority LOW: không gấp

CHỈ trả về JSON, không có text khác.`;

  try {
    const response = await callAI(prompt);
    return extractJson<NoteAnalysis>(response);
  } catch (error) {
    console.error("AI analysis error:", error);
    return null;
  }
}

/**
 * Natural language search query understanding
 */
export interface SearchIntent {
  type: "CUSTOMER" | "CONTRACT" | "INVOICE" | "PLANT" | "GENERAL";
  filters: {
    status?: string[];
    district?: string[];
    dateRange?: { start?: string; end?: string };
    hasDebt?: boolean;
    plantType?: string;
  };
  keywords: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function parseSearchQuery(query: string): Promise<SearchIntent | null> {
  const prompt = `Phan tich cau tim kiem tu nhien cho he thong CRM cho thue cay xanh.

Cau tim kiem: "${query}"

Tra ve JSON:
{
  "type": "CUSTOMER" | "CONTRACT" | "INVOICE" | "PLANT" | "GENERAL",
  "filters": {
    "status": ["ACTIVE", "INACTIVE", ...],
    "district": ["Quan 1", "Quan 2", ...],
    "hasDebt": true/false,
    "plantType": "ten loai cay"
  },
  "keywords": ["tu khoa tim kiem"],
  "sortBy": "field name",
  "sortOrder": "asc" | "desc"
}

Vi du:
- "khach quan 1 con no" -> type: CUSTOMER, filters: {district: ["Quan 1"], hasDebt: true}
- "hop dong sap het han" -> type: CONTRACT, filters: {dateRange: {end: "soon"}}
- "cay kim tien" -> type: PLANT, filters: {plantType: "kim tien"}

CHI tra ve JSON.`;

  try {
    const response = await callAI(prompt);
    return extractJson<SearchIntent>(response);
  } catch (error) {
    console.error("Search parse error:", error);
    return null;
  }
}

/**
 * Generate customer summary from notes and activities
 */
export async function generateCustomerSummary(
  customerName: string,
  notes: string[],
  recentActivities: string[]
): Promise<string | null> {
  const prompt = `Tóm tắt ngắn gọn về khách hàng cho thuê cây xanh.

Khách hàng: ${customerName}

Các ghi chú gần đây:
${notes
  .slice(0, 10)
  .map((n, i) => `${i + 1}. ${n}`)
  .join("\n")}

Hoạt động gần đây:
${recentActivities
  .slice(0, 5)
  .map((a, i) => `${i + 1}. ${a}`)
  .join("\n")}

Viết tóm tắt 2-3 câu về tình trạng khách hàng, các vấn đề cần lưu ý, và đề xuất hành động.`;

  try {
    return await callAI(prompt);
  } catch (error) {
    console.error("Summary generation error:", error);
    return null;
  }
}

// Entity extraction for quick notes
export {
  extractEntitiesAndMatch,
  extractEntitiesAndMatchWithContext,
  type EntityExtractionResult,
  type MatchedCustomer,
  type ExtractedEntities,
  type CustomerContext,
} from "./ai/entity-extractor";

// ============================================================================
// Suggestion Generation for Quick Notes
// ============================================================================

export interface Suggestion {
  action: string;
  actionType: "CALL" | "INVOICE" | "EXCHANGE" | "PAYMENT" | "REMINDER" | "OTHER";
  link?: string;
  priority: number;
}

/**
 * Generate suggestions based on extracted entities and customer context
 */
export function generateNoteSuggestions(
  entities: { actions: string[]; dates: string[]; amounts: string[] },
  context: { overdueInvoices: number; totalDebt: number; activeContracts: number } | null,
  customerId?: string
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Action-based suggestions
  for (const action of entities.actions) {
    const actionLower = action.toLowerCase();

    if (actionLower.includes("hóa đơn") || actionLower.includes("hđ")) {
      suggestions.push({
        action: "Xem hóa đơn",
        actionType: "INVOICE",
        link: customerId ? `/invoices?customerId=${customerId}` : "/invoices",
        priority: 3,
      });
    }

    if (
      actionLower.includes("nhắc") ||
      actionLower.includes("gọi") ||
      actionLower.includes("liên hệ")
    ) {
      suggestions.push({
        action: "Liên hệ khách hàng",
        actionType: "CALL",
        link: customerId ? `/customers/${customerId}` : undefined,
        priority: 2,
      });
    }

    if (actionLower.includes("đổi cây") || actionLower.includes("thay cây")) {
      suggestions.push({
        action: "Tạo yêu cầu đổi cây",
        actionType: "EXCHANGE",
        link: customerId ? `/exchanges/new?customerId=${customerId}` : undefined,
        priority: 2,
      });
    }

    if (actionLower.includes("thanh toán") || actionLower.includes("thu tiền")) {
      suggestions.push({
        action: "Nhắc thanh toán",
        actionType: "PAYMENT",
        link: customerId ? `/customers/${customerId}?tab=invoices` : undefined,
        priority: 1,
      });
    }
  }

  // Context-based suggestions
  if (context) {
    if (context.overdueInvoices > 0) {
      suggestions.push({
        action: `Có ${context.overdueInvoices} hóa đơn quá hạn`,
        actionType: "PAYMENT",
        link: customerId ? `/customers/${customerId}?tab=invoices` : undefined,
        priority: 1,
      });
    }

    if (context.totalDebt > 0) {
      const debtFormatted = new Intl.NumberFormat("vi-VN").format(context.totalDebt);
      suggestions.push({
        action: `Công nợ: ${debtFormatted} VND`,
        actionType: "PAYMENT",
        link: customerId ? `/customers/${customerId}?tab=invoices` : undefined,
        priority: 2,
      });
    }
  }

  // Dedupe by action text and sort by priority
  const unique = Array.from(new Map(suggestions.map((s) => [s.action, s])).values());
  return unique.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
