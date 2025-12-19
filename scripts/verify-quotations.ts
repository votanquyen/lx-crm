/**
 * Verify quotations in database
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying quotations...\n");

  const quotations = await prisma.quotation.findMany({
    include: {
      customer: {
        select: {
          companyName: true,
        },
      },
      items: {
        include: {
          plantType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`📊 Total quotations: ${quotations.length}\n`);

  quotations.forEach((q) => {
    console.log(`✅ ${q.quoteNumber} - ${q.status}`);
    console.log(`   Customer: ${q.customer.companyName}`);
    console.log(`   Title: ${q.title || "N/A"}`);
    console.log(`   Items: ${q.items.length}`);
    console.log(`   Total: ${Number(q.totalAmount).toLocaleString("vi-VN")}đ`);
    console.log(`   Valid until: ${q.validUntil.toLocaleDateString("vi-VN")}`);
    console.log("");
  });

  // Status breakdown
  const statuses = await prisma.quotation.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("📈 Status breakdown:");
  statuses.forEach((s) => {
    console.log(`   ${s.status}: ${s._count}`);
  });
}

main()
  .then(() => {
    console.log("\n✅ Verification complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
