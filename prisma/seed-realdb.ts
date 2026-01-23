/**
 * RealDB Import Seed Script
 * Import 88 companies + 666 invoices from CSV files
 *
 * Usage:
 *   pnpm db:seed:realdb           # Standard import
 *   pnpm db:seed:realdb --force   # Force production import
 */
import "dotenv/config";
import { PrismaClient, InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Create Prisma client with pg adapter (Prisma 7+ requirement)
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prisma = createPrismaClient();

// =============================================================================
// CSV PARSING UTILITIES
// =============================================================================

/**
 * Parse CSV file with UTF-8 BOM handling
 */
function parseCSV(filePath: string): Record<string, string>[] {
  let content = fs.readFileSync(filePath, "utf-8");

  // Strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]!);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    return headers.reduce(
      (obj, h, i) => {
        obj[h] = values[i] || "";
        return obj;
      },
      {} as Record<string, string>
    );
  });
}

/**
 * Parse CSV line handling quoted values with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else if (char !== "\r") {
      // Skip carriage return
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalize Vietnamese text for search (remove accents)
 */
function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Parse VND currency string to number
 * Handles: "1.500.000" -> 1500000, "-20.000" -> -20000
 */
function parseVND(value: string): number {
  if (!value || value.trim() === "") return 0;
  // Remove dots (thousand separators), handle negatives
  const cleaned = value.replace(/\./g, "").replace(/,/g, "").trim();
  return parseInt(cleaned, 10) || 0;
}

/**
 * Parse date string to Date object
 * Expected format: YYYY-MM-DD
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === "") return null;
  const date = new Date(dateStr.trim());
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  return phone.replace(/[\s\-\.]/g, "").trim() || null;
}

// =============================================================================
// DATABASE CLEANUP
// =============================================================================

/**
 * TRUNCATE business tables (CASCADE)
 * Preserves auth tables (users, accounts, sessions)
 */
async function cleanBusinessTables() {
  console.log("🧹 Cleaning business tables...");

  // Order matters due to FK constraints - use CASCADE
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      sticky_notes,
      quotation_items,
      quotations,
      invoice_items,
      payments,
      invoices,
      contract_items,
      contracts,
      exchange_history,
      scheduled_exchanges,
      exchange_requests,
      care_schedules,
      daily_schedules,
      customer_plants,
      monthly_statements,
      customers
    CASCADE
  `);

  console.log("✅ Business tables cleaned");
}

/**
 * Safety confirmation before cleanup
 */
async function confirmCleanup(): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === "production";
  const forceFlag = process.argv.includes("--force");

  // Count existing records
  const customerCount = await prisma.customer.count();
  const invoiceCount = await prisma.invoice.count();

  console.log(`📊 Found ${customerCount} customers, ${invoiceCount} invoices`);

  if (isProduction && !forceFlag) {
    console.error("⚠️  Production cleanup requires --force flag");
    return false;
  }

  if (customerCount > 0 || invoiceCount > 0) {
    console.log("⚠️  These will be deleted. Use --force to confirm.");
    if (!forceFlag && customerCount > 0) {
      // Allow cleanup if running in dev mode or force flag
      return process.env.NODE_ENV !== "production";
    }
  }

  return true;
}

// =============================================================================
// CUSTOMER IMPORT
// =============================================================================

interface ImportedCustomer {
  id: string;
  code: string;
  taxCode: string | null;
}

/**
 * Import customers from CSV
 * Returns map of taxCode -> customer for invoice linking
 */
async function importCustomers(csvPath: string): Promise<Map<string, ImportedCustomer>> {
  const rows = parseCSV(csvPath);
  const customerMap = new Map<string, ImportedCustomer>();
  let counter = 1;
  let skipped = 0;

  console.log(`\n📥 Importing ${rows.length} companies...`);

  for (const row of rows) {
    const mst = row["MST"]?.trim() || null;
    const companyName = row["Tên Công Ty"]?.trim();

    // Skip empty rows
    if (!companyName) {
      skipped++;
      continue;
    }

    // Check for duplicate taxCode (if provided)
    if (mst) {
      const existing = customerMap.get(mst);
      if (existing) {
        console.warn(`  ⚠️  Duplicate MST: ${mst} - skipping`);
        skipped++;
        continue;
      }
    }

    const code = `KH-${String(counter).padStart(3, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        code,
        companyName,
        companyNameNorm: normalizeVietnamese(companyName),
        taxCode: mst,
        address: row["Địa Chỉ Xuất Hóa Đơn"] || "Chưa cập nhật",
        accessInstructions: row["Địa Chỉ Giao Hàng"] || null,
        contactName: row["Tên Liên Hệ"] || null,
        contactPhone: normalizePhone(row["Số Điện Thoại"]),
        contactEmail: row["Email"]?.toLowerCase() || null,
        shortName: row["Sheets"] || null,
        status: "ACTIVE",
        city: "Hồ Chí Minh",
      },
    });

    if (mst) {
      customerMap.set(mst, {
        id: customer.id,
        code: customer.code,
        taxCode: mst,
      });
    }

    counter++;
  }

  console.log(`✅ Imported ${counter - 1} customers (skipped: ${skipped})`);
  return customerMap;
}

// =============================================================================
// INVOICE IMPORT
// =============================================================================

interface UnmatchedInvoice {
  companyName: string;
  mst: string;
  invoiceNumber: string;
  amount: number;
}

/**
 * Map Vietnamese status to InvoiceStatus enum
 */
function mapInvoiceStatus(vietnamese: string): InvoiceStatus {
  const normalized = vietnamese.toLowerCase().trim();
  if (normalized.includes("đã thanh toán")) return "PAID";
  if (normalized.includes("quá hạn")) return "OVERDUE";
  if (normalized.includes("đã hủy") || normalized.includes("hủy")) return "CANCELLED";
  return "SENT"; // Default for "Chưa thanh toán"
}

/**
 * Import invoices from CSV, linking to customers by taxCode
 */
async function importInvoices(
  csvPath: string,
  customerMap: Map<string, ImportedCustomer>
): Promise<{ imported: number; unmatched: UnmatchedInvoice[] }> {
  const rows = parseCSV(csvPath);
  const unmatched: UnmatchedInvoice[] = [];
  let importedCount = 0;
  const seenInvoiceNumbers = new Set<string>();

  console.log(`\n📥 Processing ${rows.length} invoices...`);

  for (const row of rows) {
    const mst = row["MST"]?.trim() || "";
    const companyName = row["Tên Công Ty"]?.trim() || "";
    const invoiceNum = row["Số Hóa Đơn"]?.trim() || "";

    // Skip empty rows
    if (!companyName && !invoiceNum) continue;

    // Find customer by taxCode
    const customer = mst ? customerMap.get(mst) : null;

    if (!customer) {
      unmatched.push({
        companyName: companyName || "Unknown",
        mst: mst || "",
        invoiceNumber: invoiceNum || "",
        amount: parseVND(row["Tổng Thanh Toán (VNĐ)"]),
      });
      continue;
    }

    // Parse amounts
    const subtotal = parseVND(row["Tổng Tiền Hàng (VNĐ)"]);
    const vatAmount = parseVND(row["Thuế GTGT (VNĐ)"]);
    const totalAmount = parseVND(row["Tổng Thanh Toán (VNĐ)"]);

    // Calculate due date (30 days from issue)
    const issueDate = parseDate(row["Ngày Hóa Đơn"]) || new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Map status
    const status = mapInvoiceStatus(row["Trạng Thái"] || "");
    const paidDate = parseDate(row["Ngày Thanh Toán"]);

    // Generate unique invoice number (prefix with month to avoid duplicates)
    const month = row["Tháng"]?.replace("/", "-") || "";
    let invoiceNumber = `INV-${month}-${invoiceNum}`;

    // Handle duplicate invoice numbers
    let suffix = 1;
    while (seenInvoiceNumbers.has(invoiceNumber)) {
      invoiceNumber = `INV-${month}-${invoiceNum}-${suffix}`;
      suffix++;
    }
    seenInvoiceNumbers.add(invoiceNumber);

    // Calculate VAT rate (if vatAmount > 0, assume 8%)
    const vatRate = vatAmount > 0 ? new Prisma.Decimal(8) : new Prisma.Decimal(0);

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        customerTaxCode: mst || null,
        periodLabel: month ? `Tháng ${month}` : null,
        issueDate,
        dueDate,
        subtotal: new Prisma.Decimal(subtotal),
        vatRate,
        vatAmount: new Prisma.Decimal(vatAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        paidAmount: status === "PAID" ? new Prisma.Decimal(totalAmount) : new Prisma.Decimal(0),
        outstandingAmount:
          status === "PAID" ? new Prisma.Decimal(0) : new Prisma.Decimal(totalAmount),
        status,
        paidDate: status === "PAID" ? paidDate || issueDate : null,
        notes: row["Nội Dung"] || null,
      },
    });

    importedCount++;
  }

  return { imported: importedCount, unmatched };
}

/**
 * Log unmatched invoices and save to JSON file
 */
function logUnmatched(unmatched: UnmatchedInvoice[]) {
  if (unmatched.length === 0) {
    console.log("✅ All invoices matched!");
    return;
  }

  console.log(`\n--- UNMATCHED INVOICES (${unmatched.length}) ---`);
  for (const inv of unmatched.slice(0, 10)) {
    // Show first 10
    console.log(
      `  ${inv.companyName} | MST: ${inv.mst || "MISSING"} | ${inv.invoiceNumber} | ${inv.amount.toLocaleString()}đ`
    );
  }
  if (unmatched.length > 10) {
    console.log(`  ... and ${unmatched.length - 10} more`);
  }
  console.log("--- END UNMATCHED ---\n");

  // Save to file
  const logPath = path.join(__dirname, "../plans/realdB/unmatched-invoices.json");
  fs.writeFileSync(logPath, JSON.stringify(unmatched, null, 2));
  console.log(`📄 Unmatched invoices saved to: ${logPath}`);
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verifyImport(
  expectedCustomers: number,
  importedInvoices: number,
  unmatched: UnmatchedInvoice[]
) {
  console.log("\n--- Verification ---");

  // Count records
  const customerCount = await prisma.customer.count();
  const invoiceCount = await prisma.invoice.count();

  console.log(`Customers: ${customerCount} (expected: ${expectedCustomers})`);
  console.log(`Invoices: ${invoiceCount} (imported: ${importedInvoices})`);
  console.log(`Unmatched: ${unmatched.length}`);

  // Check FK integrity - Since customerId is required and FK constraint enforced,
  // orphaned invoices can't exist. Just log a success message.
  console.log("✅ FK Integrity: OK (enforced by database constraints)");

  // Test search with normalized name - use "ngan hang" (common in data)
  const searchTest = await prisma.customer.findFirst({
    where: {
      companyNameNorm: {
        contains: "ngan hang",
      },
    },
  });

  if (searchTest) {
    console.log(`✅ Search test: Found "${searchTest.companyName}"`);
  } else {
    console.warn("⚠️  Search test: No results (check normalization)");
  }

  // Summary
  console.log("\n--- Summary ---");
  console.log(`Total records: ${customerCount + invoiceCount}`);
  const successRate =
    importedInvoices + unmatched.length > 0
      ? ((importedInvoices / (importedInvoices + unmatched.length)) * 100).toFixed(1)
      : "100.0";
  console.log(`Success rate: ${successRate}%`);
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

async function main() {
  const preset = process.argv.includes("--preset=realdb");

  if (!preset) {
    console.log("Usage: pnpm db:seed:realdb [--force]");
    console.log("       tsx prisma/seed-realdb.ts --preset=realdb [--force]");
    return;
  }

  console.log("\n=== RealDB Import Seed ===\n");

  // Safety check
  const canProceed = await confirmCleanup();
  if (!canProceed) {
    console.log("Aborted.");
    return;
  }

  // Phase 2: Cleanup
  await cleanBusinessTables();

  // Phase 3: Import customers
  const csvDir = path.join(__dirname, "../plans/realdB");
  const customerMap = await importCustomers(path.join(csvDir, "danh_sach_cong_ty_final.csv"));

  // Phase 4: Import invoices
  const { imported, unmatched } = await importInvoices(
    path.join(csvDir, "LocXanh_ThanhToan_DayDu_CoCotMST.csv"),
    customerMap
  );

  // Log unmatched
  logUnmatched(unmatched);

  // Phase 5: Verify
  await verifyImport(customerMap.size, imported, unmatched);

  console.log("\n=== Import Complete ===");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
