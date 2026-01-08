/**
 * AI Service - Gemini API Integration
 * For note analysis, suggestions, and natural language search
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

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
 * Analyze a customer note using Gemini
 */
export async function analyzeNote(
  content: string,
  customerContext: string
): Promise<NoteAnalysis | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY not configured");
    return null;
  }

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
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Empty response from Gemini");
      return null;
    }

    // Extract JSON from response (may be wrapped in ```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", text);
      return null;
    }

    return JSON.parse(jsonMatch[0]) as NoteAnalysis;
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
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

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
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as SearchIntent;
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
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;

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
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (error) {
    console.error("Summary generation error:", error);
    return null;
  }
}
