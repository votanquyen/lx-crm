/**
 * Verify Plant Types Data
 * Quick script to check plant types in database
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyPlantTypes() {
  console.log("📊 Verifying Plant Types Data...\n");

  // Get all plant types
  const plantTypes = await prisma.plantType.findMany({
    include: {
      inventory: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  console.log(`Total Plant Types: ${plantTypes.length}\n`);

  plantTypes.forEach((pt, index) => {
    console.log(`${index + 1}. ${pt.code} - ${pt.name}`);
    console.log(`   Category: ${pt.category || "N/A"}`);
    console.log(`   Rental Price: ${Number(pt.rentalPrice).toLocaleString()}đ/month`);
    console.log(`   Status: ${pt.isActive ? "✅ Active" : "❌ Inactive"}`);

    if (pt.inventory) {
      console.log(`   Inventory: ${pt.inventory.availableStock}/${pt.inventory.totalStock} available`);
    }
    console.log("");
  });

  // Get inventory stats
  const stats = await prisma.inventory.aggregate({
    _sum: {
      totalStock: true,
      availableStock: true,
      rentedStock: true,
      damagedStock: true,
    },
  });

  console.log("📈 Inventory Statistics:");
  console.log(`   Total Stock: ${stats._sum.totalStock || 0}`);
  console.log(`   Available: ${stats._sum.availableStock || 0}`);
  console.log(`   Rented: ${stats._sum.rentedStock || 0}`);
  console.log(`   Damaged: ${stats._sum.damagedStock || 0}`);
  console.log("");

  console.log("✅ Verification complete!");
}

verifyPlantTypes()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
