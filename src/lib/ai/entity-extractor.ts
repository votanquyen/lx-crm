/**
 * AI Entity Extraction for Quick Notes
 * Extracts company names, dates, actions from free-text
 * Fuzzy matches companies to existing customers
 */

import { callAI, extractJson } from "./multi-provider-client";
import { prisma } from "@/lib/prisma";
import { normalizeVietnamese } from "@/lib/utils";
import { Prisma } from "@prisma/client";

// ============================================================================
// Constants
// ============================================================================

/** Maximum content length for AI extraction (prevents token limit issues) */
const MAX_CONTENT_LENGTH = 3000;

/** Maximum company names to match per query */
const MAX_COMPANIES_TO_MATCH = 10;

// ============================================================================
// Types
// ============================================================================

export interface ExtractedEntities {
  companies: string[];
  dates: string[];
  actions: string[];
  amounts: string[];
}

export interface MatchedCustomer {
  id: string;
  companyName: string;
  score: number;
  context?: CustomerContext;
}

export interface CustomerContext {
  activeContracts: number;
  overdueInvoices: number;
  totalDebt: number;
  recentNotes: number;
}

export interface EntityExtractionResult {
  entities: ExtractedEntities;
  matchedCustomers: MatchedCustomer[];
  noMatchCompanies: string[];
}

// ============================================================================
// AI Prompt
// ============================================================================

const EXTRACT_PROMPT = `Bạn là trợ lý AI cho hệ thống CRM cho thuê cây xanh. Phân tích ghi chú và trích xuất thông tin.

Nội dung:
"""
{content}
"""

Trả về JSON:
{
  "companies": ["tên công ty/khách hàng được đề cập"],
  "dates": ["ngày/thời gian được đề cập, giữ nguyên format"],
  "actions": ["hành động được yêu cầu/đề cập"],
  "amounts": ["số tiền nếu có"]
}

Quy tắc:
- companies: Tên công ty, tên khách hàng, hoặc tên viết tắt (VD: "Minh Việt", "ABC Corp", "chị Hương")
- Bỏ các tiền tố: "Công ty TNHH", "Công ty CP", "Co.,Ltd" - chỉ giữ tên chính
- dates: "ngày 10", "thứ 5", "tuần sau", "15/1", "cuối tháng"
- actions: "gửi hóa đơn", "nhắc thanh toán", "đổi cây", "kiểm tra"
- amounts: "5 triệu", "2.5tr", "1,000,000 VND"

CHỈ trả về JSON, không giải thích.`;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escape special ILIKE pattern characters
 */
function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

// ============================================================================
// Entity Extraction
// ============================================================================

/**
 * Extract entities from note content using AI
 */
export async function extractEntities(
  content: string
): Promise<ExtractedEntities | null> {
  if (!content.trim()) return null;

  // Limit content length to prevent token overflow
  const truncatedContent = content.slice(0, MAX_CONTENT_LENGTH);
  const prompt = EXTRACT_PROMPT.replace("{content}", truncatedContent);

  try {
    const response = await callAI(prompt, "vietnamese_nlp");
    const extracted = extractJson<ExtractedEntities>(response);

    // Validate structure
    return {
      companies: Array.isArray(extracted.companies) ? extracted.companies : [],
      dates: Array.isArray(extracted.dates) ? extracted.dates : [],
      actions: Array.isArray(extracted.actions) ? extracted.actions : [],
      amounts: Array.isArray(extracted.amounts) ? extracted.amounts : [],
    };
  } catch (error) {
    console.error("[EntityExtractor] AI extraction failed:", error);
    return null;
  }
}

// ============================================================================
// Fuzzy Matching
// ============================================================================

interface FuzzyMatchResult {
  id: string;
  company_name: string;
  score: number;
}

/**
 * Fuzzy match company names to existing customers using pg_trgm
 * Optimized: Batch query for all names at once
 */
export async function matchCompaniesToCustomers(
  companyNames: string[]
): Promise<MatchedCustomer[]> {
  // Filter and limit company names
  const validNames = companyNames
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
    .slice(0, MAX_COMPANIES_TO_MATCH);

  if (validNames.length === 0) return [];

  // Build batch query with OR conditions
  const conditions: Prisma.Sql[] = [];
  const normalizedNames: string[] = [];

  for (const name of validNames) {
    const normalized = normalizeVietnamese(name);
    const escapedPattern = `%${escapeLikePattern(name)}%`;
    normalizedNames.push(normalized);

    conditions.push(
      Prisma.sql`(COALESCE(company_name_norm, '') % ${normalized} OR company_name ILIKE ${escapedPattern})`
    );
  }

  try {
    // Single batch query for all company names
    const combinedCondition = Prisma.join(conditions, " OR ");

    // Build similarity calculation for each name
    const similarityExpressions = normalizedNames.map(
      (norm) => Prisma.sql`similarity(COALESCE(company_name_norm, ''), ${norm})`
    );
    const maxSimilarity = Prisma.sql`GREATEST(${Prisma.join(similarityExpressions, ", ")})`;

    const matches = await prisma.$queryRaw<FuzzyMatchResult[]>`
      SELECT id, company_name, ${maxSimilarity} as score
      FROM customers
      WHERE status != 'TERMINATED'
        AND (${combinedCondition})
      ORDER BY score DESC
      LIMIT 10
    `;

    // Dedupe by id, keep highest score
    const deduped = new Map<string, MatchedCustomer>();
    for (const m of matches) {
      const existing = deduped.get(m.id);
      const score = Number(m.score) || 0.5;
      if (!existing || existing.score < score) {
        deduped.set(m.id, {
          id: m.id,
          companyName: m.company_name,
          score,
        });
      }
    }

    return Array.from(deduped.values()).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("[EntityExtractor] Fuzzy match failed:", error);
    return [];
  }
}

/**
 * Fetch customer context (contracts, invoices, debt)
 */
export async function fetchCustomerContext(
  customerId: string
): Promise<CustomerContext> {
  const [contractCount, invoiceData, noteCount] = await Promise.all([
    prisma.contract.count({
      where: { customerId, status: "ACTIVE" },
    }),
    prisma.invoice.aggregate({
      where: {
        customerId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      },
      _count: { id: true },
      _sum: { outstandingAmount: true },
    }),
    prisma.stickyNote.count({
      where: { customerId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return {
    activeContracts: contractCount,
    overdueInvoices: invoiceData._count.id,
    totalDebt: Number(invoiceData._sum.outstandingAmount ?? 0),
    recentNotes: noteCount,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Extract entities from note content and match to customers
 */
export async function extractEntitiesAndMatch(
  content: string
): Promise<EntityExtractionResult> {
  // Extract entities using AI
  const entities = await extractEntities(content);

  if (!entities) {
    return {
      entities: { companies: [], dates: [], actions: [], amounts: [] },
      matchedCustomers: [],
      noMatchCompanies: [],
    };
  }

  // Fuzzy match companies to customers
  const matchedCustomers = await matchCompaniesToCustomers(entities.companies);

  // Find companies that didn't match
  const matchedCompanyNames = new Set(
    matchedCustomers.map((c) => c.companyName.toLowerCase())
  );
  const noMatchCompanies = entities.companies.filter(
    (name) => !matchedCompanyNames.has(name.toLowerCase())
  );

  return { entities, matchedCustomers, noMatchCompanies };
}

/**
 * Extract and match with full customer context
 */
export async function extractEntitiesAndMatchWithContext(
  content: string
): Promise<EntityExtractionResult> {
  const result = await extractEntitiesAndMatch(content);

  // Fetch context for matched customers (in parallel)
  const customersWithContext = await Promise.all(
    result.matchedCustomers.map(async (customer) => ({
      ...customer,
      context: await fetchCustomerContext(customer.id),
    }))
  );

  return {
    ...result,
    matchedCustomers: customersWithContext,
  };
}
