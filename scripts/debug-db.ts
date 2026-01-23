import "dotenv/config";
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
  // Check recent statements
  const statements = await prisma.monthlyStatement.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      customerId: true,
      year: true,
      month: true,
      total: true,
      needsConfirmation: true,
      createdAt: true,
      customer: {
        select: {
          code: true,
          companyName: true,
        },
      },
    },
  });
  console.log("Recent monthly statements:");
  console.log(JSON.stringify(statements, null, 2));

  // Simulate what getMonthlyStatements returns for year 2026
  const statements2026 = await prisma.monthlyStatement.findMany({
    where: { year: 2026 },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          shortName: true,
          district: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 1000,
    skip: 0,
  });
  console.log("\n=== Simulating getMonthlyStatements({ year: 2026 }) ===");
  console.log(`Total statements for 2026: ${statements2026.length}`);
  statements2026.forEach((s) => {
    console.log(
      `  - ${s.customer.code}: Month ${s.month}, Total: ${s.total}, NeedsConfirmation: ${s.needsConfirmation}`
    );
  });

  // Check customers for statements
  const activeCustomers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      code: true,
      companyName: true,
      shortName: true,
    },
    take: 5,
  });
  console.log("\n=== Active Customers (first 5) ===");
  console.log(JSON.stringify(activeCustomers, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
