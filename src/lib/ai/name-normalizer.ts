/**
 * Vietnamese Company Name Normalization with Multi-Provider AI
 * Normalizes various company name formats
 */
import { callAI, extractJson } from "./multi-provider-client";

export interface NormalizedName {
  original: string;
  normalized: string;
  shortName: string | null;
  businessType: string | null;
  confidence: number;
}

interface NormalizeResponse {
  results: Array<{
    index: number;
    original: string;
    normalized: string;
    shortName: string | null;
    businessType: string | null;
    confidence: number;
  }>;
}

/**
 * Normalize Vietnamese company names
 * Handles: Cty, TNHH, CP, Công ty, Co., Ltd, etc.
 */
export async function normalizeCompanyNames(names: string[]): Promise<NormalizedName[]> {
  if (names.length === 0) return [];

  const prompt = `Chuẩn hóa ${names.length} tên công ty Việt Nam.

DANH SÁCH:
${names.map((n, i) => `${i + 1}. "${n}"`).join("\n")}

QUY TẮC CHUẨN HÓA:
- "Cty" → "Công ty"
- "TNHH" → "TNHH" (giữ nguyên)
- "CP" → "Cổ phần"
- "Co., Ltd" → "TNHH"
- Viết hoa chữ cái đầu mỗi từ
- Bỏ dấu cách thừa
- Giữ nguyên tên riêng (ABC, XYZ, v.v.)

VÍ DỤ:
- "cty abc tnhh" → "Công ty TNHH ABC"
- "Cty CP XYZ" → "Công ty Cổ phần XYZ"
- "abc company ltd" → "Công ty TNHH ABC"

TRẢ VỀ JSON (chỉ JSON, không text khác):
{
  "results": [
    {
      "index": 1,
      "original": "cty abc tnhh",
      "normalized": "Công ty TNHH ABC",
      "shortName": "ABC",
      "businessType": "TNHH",
      "confidence": 0.95
    }
  ]
}`;

  try {
    const response = await callAI(prompt);
    const json = extractJson<NormalizeResponse>(response);
    return (
      json.results?.map((r) => ({
        original: r.original,
        normalized: r.normalized,
        shortName: r.shortName,
        businessType: r.businessType,
        confidence: r.confidence,
      })) || []
    );
  } catch (error) {
    console.error("Name normalization error:", error);
    // Fallback: return original names with low confidence
    return names.map((name) => ({
      original: name,
      normalized: name,
      shortName: null,
      businessType: null,
      confidence: 0.3,
    }));
  }
}
