/**
 * One-time import script for December 2025 bang-ke (monthly statements)
 *
 * Usage:
 *   npx dotenv-cli -e .env -- npx tsx scripts/import-bangke-dec2025.ts --dry-run
 *   npx dotenv-cli -e .env -- npx tsx scripts/import-bangke-dec2025.ts
 *
 * Data source: plans/realdB/bang-ke-cay-xanh-2025.json
 */

import { PrismaClient, CustomerStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createId } from "@paralleldrive/cuid2";
import * as fs from "fs";
import * as path from "path";

// Create Prisma client with pg adapter (required for Prisma 7)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Use: npx dotenv-cli -e .env -- npx tsx ..."
  );
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

// VAT rate for calculations
const VAT_RATE = 8;

// Only import December 2025 data
const TARGET_YEAR = 2025;
const TARGET_MONTH = 12;

interface PlantItem {
  id: string;
  name: string;
  sizeSpec: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface JsonPlant {
  stt: number;
  ten_cay: string;
  quy_cach: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

interface JsonClient {
  sheet_name: string;
  client_name: string;
  address: string;
  period: string;
  contact: string;
  plants: JsonPlant[];
}

interface JsonData {
  version: string;
  export_date: string;
  source_file: string;
  total_clients: number;
  total_items: number;
  clients: JsonClient[];
}

// Helper to check if a plant row is a summary/total row (skip these)
function isSummaryRow(plantName: string): boolean {
  const summaryPatterns = [
    /^tổng\s*(cộng)?$/i,
    /^tổng$/i,
    /thuế\s*gtgt/i,
    /vat\s*\d+%/i,
    /tổng giá trị/i,
  ];
  return summaryPatterns.some((p) => p.test(plantName.trim()));
}

// Parse period string to extract month/year
function parsePeriod(
  periodStr: string
): { year: number; month: number; periodStart: Date; periodEnd: Date } | null {
  const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;
  const matches = [...periodStr.matchAll(datePattern)];

  if (matches.length >= 2) {
    const [, startDay, startMonth, startYear] = matches[0];
    const [, endDay, endMonth, endYear] = matches[1];
    return {
      year: parseInt(startYear),
      month: parseInt(startMonth),
      periodStart: new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay)),
      periodEnd: new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay)),
    };
  }

  // Fallback: try to find month/year pattern like "tháng 1/2026"
  const monthYearPattern = /tháng\s*(\d{1,2})\/(\d{4})/i;
  const monthMatch = periodStr.match(monthYearPattern);
  if (monthMatch) {
    const month = parseInt(monthMatch[1]);
    const year = parseInt(monthMatch[2]);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);
    return { year, month, periodStart, periodEnd };
  }

  return null;
}

// Check if a period overlaps with December 2025
function isDecember2025(period: { year: number; month: number } | null): boolean {
  if (!period) return true; // Default to include if can't parse
  // Include if the period's month is December 2025 OR spans into December 2025
  return (
    (period.year === 2025 && period.month >= 11 && period.month <= 12) ||
    (period.year === 2025 && period.month === 12)
  );
}

// Generate unique customer code
async function generateCustomerCode(): Promise<string> {
  const count = await prisma.customer.count();
  return `KH-${String(count + 1).padStart(3, "0")}`;
}

// Remove Vietnamese diacritics for comparison
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Extract key words from company name for matching
function extractKeywords(name: string): string[] {
  const normalized = removeDiacritics(name.toLowerCase())
    .replace(/cong ty (tnhh|co phan|cp|trach nhiem huu han)/gi, "")
    .replace(/van phong dai dien/gi, "")
    .replace(/chi nhanh/gi, "")
    .replace(/ngan hang/gi, "")
    .replace(/tai thanh pho ho chi minh/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.split(" ").filter((w) => w.length >= 3);
}

// Calculate similarity score between two company names
function calculateSimilarity(name1: string, name2: string): number {
  const words1 = extractKeywords(name1);
  const words2 = extractKeywords(name2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

// Find or create customer with stricter matching
async function findOrCreateCustomer(
  client: JsonClient
): Promise<{ id: string; code: string; companyName: string; isNew: boolean; confidence: string }> {
  const sheetName = client.sheet_name.trim();
  const companyName = client.client_name.trim() || sheetName;

  // First try exact match on shortName or companyName
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { shortName: { equals: sheetName, mode: "insensitive" } },
        { companyName: { equals: companyName, mode: "insensitive" } },
      ],
    },
    select: { id: true, code: true, companyName: true },
  });

  if (customer) {
    return { ...customer, isNew: false, confidence: "exact" };
  }

  // Try similarity-based match
  const allCustomers = await prisma.customer.findMany({
    select: { id: true, code: true, companyName: true, shortName: true },
  });

  let bestMatch: (typeof allCustomers)[0] | null = null;
  let bestScore = 0;

  for (const c of allCustomers) {
    // Check sheet name against shortName first
    const shortNameMatch =
      removeDiacritics(c.shortName || "").toLowerCase() ===
      removeDiacritics(sheetName).toLowerCase();
    if (shortNameMatch) {
      return { ...c, isNew: false, confidence: "shortName" };
    }

    // Calculate similarity
    const score1 = calculateSimilarity(companyName, c.companyName);
    const score2 = c.shortName ? calculateSimilarity(sheetName, c.shortName) : 0;
    const maxScore = Math.max(score1, score2);

    if (maxScore > bestScore && maxScore >= 0.6) {
      // Require at least 60% similarity
      bestScore = maxScore;
      bestMatch = c;
    }
  }

  if (bestMatch && bestScore >= 0.6) {
    return { ...bestMatch, isNew: false, confidence: `similar(${Math.round(bestScore * 100)}%)` };
  }

  // Create new customer if not found
  if (DRY_RUN) {
    return {
      id: `dry-run-${createId()}`,
      code: `KH-NEW`,
      companyName: companyName || sheetName,
      isNew: true,
      confidence: "new",
    };
  }

  const code = await generateCustomerCode();
  const newCustomer = await prisma.customer.create({
    data: {
      id: createId(),
      code,
      companyName: companyName || sheetName,
      shortName: sheetName,
      address: client.address || "Chưa cập nhật",
      contactName: client.contact || null,
      status: CustomerStatus.ACTIVE,
    },
    select: { id: true, code: true, companyName: true },
  });

  return { ...newCustomer, isNew: true, confidence: "new" };
}

// Convert JSON plants to PlantItem format, fixing data quality issues
function convertPlants(jsonPlants: JsonPlant[]): PlantItem[] {
  return jsonPlants
    .filter((p) => !isSummaryRow(p.ten_cay) && p.so_luong > 0 && p.so_luong < 1000) // Filter unrealistic quantities
    .map((p) => {
      const quantity = p.so_luong;
      // Handle cases where don_gia and so_luong might be swapped or incorrect
      const unitPrice = p.don_gia;

      // Sanity check: unit price should be between 50,000 and 10,000,000 VND for plants
      if (unitPrice > 10000000) {
        console.log(`  [WARN] Unusual unit price: ${unitPrice} for "${p.ten_cay}" - skipping`);
        return null;
      }

      const total = quantity * unitPrice;

      return {
        id: createId(),
        name: p.ten_cay.trim(),
        sizeSpec: p.quy_cach?.trim() || "",
        quantity,
        unitPrice,
        total,
      };
    })
    .filter((p): p is PlantItem => p !== null);
}

// Calculate amounts
function calculateAmounts(plants: PlantItem[]): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  const subtotal = plants.reduce((sum, p) => sum + p.total, 0);
  const vatAmount = Math.round((subtotal * VAT_RATE) / 100);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

async function importBangke() {
  console.log("=".repeat(60));
  console.log("BANG-KE DECEMBER 2025 IMPORT");
  console.log(DRY_RUN ? "** DRY RUN MODE - No changes will be made **" : "** LIVE MODE **");
  console.log("=".repeat(60));

  // Read JSON file
  const jsonPath = path.resolve(__dirname, "../plans/realdB/bang-ke-cay-xanh-2025.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const jsonData: JsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`\nSource: ${jsonData.source_file}`);
  console.log(`Export date: ${jsonData.export_date}`);
  console.log(`Total clients: ${jsonData.total_clients}`);
  console.log(`Total items: ${jsonData.total_items}`);

  let created = 0;
  let skipped = 0;
  let skippedNotDec2025 = 0;
  let errors = 0;
  let newCustomers = 0;

  for (const client of jsonData.clients) {
    try {
      // Skip clients with invalid/empty data
      if (!client.sheet_name || client.plants.length === 0) {
        console.log(`\n[SKIP] Empty data: ${client.sheet_name}`);
        skipped++;
        continue;
      }

      // Parse period to get year/month
      const period = parsePeriod(client.period || "");

      // Filter: Only import December 2025 data
      if (period && !isDecember2025(period)) {
        console.log(
          `\n[SKIP-PERIOD] Not Dec 2025: ${client.sheet_name} (${period.month}/${period.year})`
        );
        skippedNotDec2025++;
        continue;
      }

      const year = period?.year || TARGET_YEAR;
      const month = period?.month || TARGET_MONTH;
      const periodStart = period?.periodStart || new Date(2025, 11, 1);
      const periodEnd = period?.periodEnd || new Date(2025, 11, 31);

      // Find or create customer
      const customer = await findOrCreateCustomer(client);
      if (customer.isNew) {
        newCustomers++;
        console.log(`\n[NEW CUSTOMER] ${customer.code}: ${customer.companyName}`);
      }

      // Check if statement already exists
      if (!DRY_RUN) {
        const existing = await prisma.monthlyStatement.findFirst({
          where: {
            customerId: customer.id,
            year,
            month,
          },
        });

        if (existing) {
          console.log(`\n[SKIP] Statement exists: ${customer.code} - ${year}/${month}`);
          skipped++;
          continue;
        }
      }

      // Convert plants and calculate amounts
      const plants = convertPlants(client.plants);
      if (plants.length === 0) {
        console.log(`\n[SKIP] No valid plants: ${client.sheet_name}`);
        skipped++;
        continue;
      }

      const { subtotal, vatAmount, total } = calculateAmounts(plants);

      // Sanity check: total should be reasonable (< 100M VND)
      if (total > 100000000) {
        console.log(
          `\n[SKIP-DATA] Unrealistic total (${total.toLocaleString()} VND): ${client.sheet_name}`
        );
        skipped++;
        continue;
      }

      console.log(
        `\n[${DRY_RUN ? "WOULD CREATE" : "CREATE"}] ${customer.code}: ${customer.companyName}`
      );
      console.log(`   Match: ${customer.confidence}`);
      console.log(
        `   Period: ${year}/${month} (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()})`
      );
      console.log(`   Plants: ${plants.length} items`);
      console.log(`   Subtotal: ${subtotal.toLocaleString()} VND`);
      console.log(`   VAT (${VAT_RATE}%): ${vatAmount.toLocaleString()} VND`);
      console.log(`   Total: ${total.toLocaleString()} VND`);

      if (!DRY_RUN) {
        await prisma.monthlyStatement.create({
          data: {
            id: createId(),
            customerId: customer.id,
            year,
            month,
            periodStart,
            periodEnd,
            contactName: client.contact || null,
            plants: plants as unknown as any,
            subtotal,
            vatRate: VAT_RATE,
            vatAmount,
            total,
            needsConfirmation: false,
            notes: `Imported from ${jsonData.source_file}`,
          },
        });
      }

      created++;
    } catch (error) {
      console.error(`\n[ERROR] ${client.sheet_name}:`, error);
      errors++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Created: ${created}`);
  console.log(`Skipped (not Dec 2025): ${skippedNotDec2025}`);
  console.log(`Skipped (other): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`New customers: ${newCustomers}`);

  if (DRY_RUN) {
    console.log("\n** This was a dry run. Run without --dry-run to apply changes. **");
  }
}

// Run
importBangke()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
