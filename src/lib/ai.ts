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
  const prompt = `Phân tích câu tìm kiếm tự nhiên cho hệ thống CRM cho thuê cây xanh.

Câu tìm kiếm: "${query}"

Trả về JSON:
{
  "type": "CUSTOMER" | "CONTRACT" | "INVOICE" | "PLANT" | "GENERAL",
  "filters": {
    "status": ["ACTIVE", "INACTIVE", ...],
    "district": ["Quận 1", "Quận 2", ...],
    "hasDebt": true/false,
    "plantType": "tên loại cây"
  },
  "keywords": ["từ khóa tìm kiếm"],
  "sortBy": "field name",
  "sortOrder": "asc" | "desc"
}

Ví dụ:
- "khách quận 1 còn nợ" → type: CUSTOMER, filters: {district: ["Quận 1"], hasDebt: true}
- "hợp đồng sắp hết hạn" → type: CONTRACT, filters: {dateRange: {end: "soon"}}
- "cây kim tiền" → type: PLANT, filters: {plantType: "kim tiền"}

CHỈ trả về JSON.`;

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
