/**
 * Import Bảng Kê from SQL Script
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    console.log("📊 Import Bảng Kê 2026\n");

    const sqlPath = join(__dirname, "import-bang-ke-2026.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    console.log("SQL file length:", sql.length, "characters");

    // First, let's just count existing statements
    const existingCount = await prisma.monthlyStatement.count();
    console.log("Existing statements:", existingCount);

    // Check customers
    const customerCount = await prisma.customer.count();
    console.log("Total customers:", customerCount);

    // List all customer names to help with matching
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
        shortName: true,
      },
      orderBy: { companyName: "asc" },
    });

    console.log("\n--- All Customers ---");
    customers.forEach((c) => {
      console.log(`  - "${c.shortName}" | "${c.companyName}"`);
    });

    console.log(`\n✅ SQL script is ready at: scripts/import-bang-ke-2026.sql`);
    console.log(`\n⚠️  To execute the SQL import, please run directly in your database:`);
    console.log(`    1. Open Neon Console: https://console.neon.tech`);
    console.log(`    2. Go to your database > SQL Editor`);
    console.log(`    3. Paste and run: scripts/import-bang-ke-2026.sql`);
    console.log(`    4. Or use psql locally if available`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
