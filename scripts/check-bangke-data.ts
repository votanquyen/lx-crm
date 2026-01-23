import { config } from "dotenv";
config(); // Load .env file

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n=== Bang-Ke Debug Check ===\n");

  // List all tables in the database
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `;
  console.log("Tables in database:");
  tables.forEach((t) => console.log(`  - ${t.tablename}`));

  // Check if monthly_statements table exists (snake_case)
  const hasMonthlyStatement = tables.some((t) => t.tablename === "monthly_statements");
  console.log(`\nmonthly_statements table exists: ${hasMonthlyStatement}`);

  if (hasMonthlyStatement) {
    // Check data in monthly_statements using raw SQL
    const count = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM monthly_statements;
    `;
    console.log(`Total statements in DB: ${Number(count[0]?.count || 0)}`);

    // Check by year/month
    const byYearMonth = await prisma.$queryRaw<{ year: number; month: number; count: bigint }[]>`
      SELECT year, month, COUNT(*) as count
      FROM monthly_statements
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 10;
    `;
    console.log("\nStatements by year/month:");
    if (byYearMonth.length === 0) {
      console.log("  ❌ No statements exist in database!");
    } else {
      byYearMonth.forEach((s) => console.log(`  ${s.year}/${s.month}: ${Number(s.count)}`));
    }
  }

  // Check customer statuses
  const customerStats = await prisma.customer.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("Customer statuses:");
  customerStats.forEach((s) => console.log(`  ${s.status}: ${s._count}`));

  // Check monthly statements by year/month
  const statementStats = await prisma.$queryRaw<
    { year: number; month: number; count: bigint }[]
  >`SELECT year, month, COUNT(*) as count FROM "MonthlyStatement" GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 10`;
  console.log("\nMonthly statements by year/month:");
  statementStats.forEach((s) => console.log(`  ${s.year}/${s.month}: ${Number(s.count)}`));

  // Check total counts
  const totalCustomers = await prisma.customer.count();
  const activeCustomers = await prisma.customer.count({
    where: { status: "ACTIVE" },
  });
  const totalStatements = await prisma.monthlyStatement.count();

  console.log("\n=== Summary ===");
  console.log(`Total customers: ${totalCustomers}`);
  console.log(`ACTIVE customers: ${activeCustomers}`);
  console.log(`Total statements: ${totalStatements}`);

  // Check if bang-ke page would show customers
  const customersForStatements = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    take: 5,
    select: { id: true, code: true, companyName: true, status: true },
  });
  console.log("\nCustomers visible in bang-ke sidebar:");
  if (customersForStatements.length === 0) {
    console.log("  ❌ NONE - This is why you see nothing!");
    console.log("  → The filter requires status='ACTIVE' but no customers have this status");
  } else {
    customersForStatements.forEach((c) => console.log(`  ✓ ${c.code}: ${c.companyName}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
