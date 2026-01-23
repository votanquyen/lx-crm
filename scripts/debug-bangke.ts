import { prisma } from "../src/lib/prisma";

async function main() {
  const stmt = await prisma.monthlyStatement.findFirst({
    where: { needsConfirmation: true },
    select: { id: true, needsConfirmation: true, confirmedAt: true, month: true, year: true },
  });
  console.log("Statement with needsConfirmation=true:", stmt);

  const allStatements = await prisma.monthlyStatement.findMany({
    where: { year: 2026 },
    select: { id: true, needsConfirmation: true, month: true },
    take: 5,
  });
  console.log("\nFirst 5 statements for 2026:");
  allStatements.forEach((s) => {
    console.log("  -", s.month, "needsConfirmation:", s.needsConfirmation);
  });
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
