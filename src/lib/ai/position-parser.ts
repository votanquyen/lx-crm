/**
 * Plant Position Parser with Multi-Provider AI
 * Converts natural text like "5 KT T3" to structured data
 */
import { callAI, extractJson } from "./multi-provider-client";

export interface ParsedPlant {
  original: string;
  quantity: number;
  plantTypeCode: string | null;
  plantTypeName: string | null;
  floor: string | null;
  room: string | null;
  area: string | null;
  positionNote: string | null;
  confidence: number;
}

interface ParsePositionResponse {
  results: ParsedPlant[];
}

// Common plant type abbreviations
const PLANT_CODES: Record<string, string> = {
  KT: "Kim Tiền",
  PT: "Phát Tài",
  LH: "Lưỡi Hổ",
  TT: "Trầu Bà",
  KC: "Kim Ngân",
  TV: "Trúc Vàng",
  XL: "Xương Lá",
  HP: "Hồng Phát",
  MN: "Mai Nhật",
  NN: "Núi Nhật",
};

/**
 * Parse plant positions from natural text
 */
export async function parsePlantPositions(entries: string[]): Promise<ParsedPlant[]> {
  if (entries.length === 0) return [];

  const prompt = `Phân tích ${entries.length} ghi chú vị trí cây thuê.

MÃ CÂY THÔNG DỤNG:
${Object.entries(PLANT_CODES)
  .map(([code, name]) => `- ${code}: ${name}`)
  .join("\n")}

DANH SÁCH GHI CHÚ:
${entries.map((e, i) => `${i + 1}. "${e}"`).join("\n")}

QUY TẮC PHÂN TÍCH:
- Số đầu = số lượng (vd: "5 KT" → quantity: 5)
- Mã cây (KT, PT, LH...) = loại cây
- T1, T2, T3... = Tầng 1, Tầng 2, Tầng 3...
- "sảnh", "sanh" = area: "Sảnh"
- "phòng GĐ", "P.GD" = room: "Phòng Giám đốc"
- "lễ tân", "reception" = area: "Lễ tân"

VÍ DỤ:
- "5 KT T3" → { quantity: 5, plantTypeCode: "KT", plantTypeName: "Kim Tiền", floor: "Tầng 3" }
- "3 PT sảnh" → { quantity: 3, plantTypeCode: "PT", plantTypeName: "Phát Tài", area: "Sảnh" }
- "kim tiền lớn phòng họp" → { quantity: 1, plantTypeName: "Kim Tiền", room: "Phòng họp" }

TRẢ VỀ JSON:
{
  "results": [
    {
      "original": "5 KT T3",
      "quantity": 5,
      "plantTypeCode": "KT",
      "plantTypeName": "Kim Tiền",
      "floor": "Tầng 3",
      "room": null,
      "area": null,
      "positionNote": null,
      "confidence": 0.92
    }
  ]
}`;

  try {
    const response = await callAI(prompt);
    const json = extractJson<ParsePositionResponse>(response);
    return json.results || [];
  } catch (error) {
    console.error("Position parse error:", error);
    return entries.map((text) => ({
      original: text,
      quantity: 1,
      plantTypeCode: null,
      plantTypeName: null,
      floor: null,
      room: null,
      area: null,
      positionNote: text,
      confidence: 0.2,
    }));
  }
}
