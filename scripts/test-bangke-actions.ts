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
  console.log("\n=== Testing Bang-Ke Actions Logic ===\n");

  // Test 1: getCustomersForStatements logic
  console.log("1. Testing getCustomersForStatements filter...");
  const customers = await prisma.customer.findMany({
    where: {
      status: { in: ["ACTIVE", "LEAD"] },
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      shortName: true,
      district: true,
      contactName: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });
  console.log(`   Found ${customers.length} customers (ACTIVE or LEAD)`);
  if (customers.length > 0) {
    console.log("   First 5 customers:");
    customers.slice(0, 5).forEach((c) => {
      console.log(`     - ${c.code}: ${c.companyName}`);
    });
  }

  // Test 2: getMonthlyStatements logic for 2026
  console.log("\n2. Testing getMonthlyStatements for year 2026...");
  const statements = await prisma.monthlyStatement.findMany({
    where: {
      year: 2026,
    },
    select: {
      id: true,
      customerId: true,
      year: true,
      month: true,
      needsConfirmation: true,
      total: true,
      customer: {
        select: {
          code: true,
          companyName: true,
          district: true,
        },
      },
    },
    orderBy: [{ month: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  console.log(`   Found ${statements.length} statements for 2026`);
  if (statements.length > 0) {
    console.log("   First 10 statements:");
    statements.slice(0, 10).forEach((s) => {
      console.log(
        `     - ${s.year}/${s.month}: ${s.customer?.companyName || "Unknown"} - ${Number(s.grandTotal).toLocaleString()} VND`
      );
    });
  }

  // Test 3: Check January 2026 specifically
  console.log("\n3. Testing getMonthlyStatements for January 2026...");
  const janStatements = await prisma.monthlyStatement.findMany({
    where: {
      year: 2026,
      month: 1,
    },
  });
  console.log(`   Found ${janStatements.length} statements for Jan 2026`);

  // Test 4: Check if there's a mapping between customers and statements
  console.log("\n4. Checking customer-statement mapping...");
  const customerIds = new Set(customers.map((c) => c.id));
  const statementsWithValidCustomer = statements.filter((s) => customerIds.has(s.customerId));
  console.log(
    `   Statements with valid customer: ${statementsWithValidCustomer.length}/${statements.length}`
  );

  // Test 5: Check if any customers in statements are not in ACTIVE/LEAD filter
  const orphanStatements = statements.filter((s) => !customerIds.has(s.customerId));
  if (orphanStatements.length > 0) {
    console.log(
      `\n   ⚠️ Found ${orphanStatements.length} statements with customers not in ACTIVE/LEAD status!`
    );
    // Check what status these customers have
    const orphanCustomerIds = [...new Set(orphanStatements.map((s) => s.customerId))];
    const orphanCustomers = await prisma.customer.findMany({
      where: { id: { in: orphanCustomerIds } },
      select: { id: true, code: true, companyName: true, status: true },
    });
    console.log("   Orphan customers:");
    orphanCustomers.forEach((c) => {
      console.log(`     - ${c.code}: ${c.companyName} (status: ${c.status})`);
    });
  }

  console.log("\n=== Test Complete ===\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
