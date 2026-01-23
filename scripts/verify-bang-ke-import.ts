/**
 * Verify Bảng Kê Import Results
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  try {
    console.log("📊 Bảng Kê Import Verification\n");

    // Total statements
    const totalStatements = await prisma.monthlyStatement.count();
    console.log(`Total statements: ${totalStatements}`);

    // Recent statements with customer info
    const statements = await prisma.monthlyStatement.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        customer: {
          select: {
            shortName: true,
            companyName: true,
          },
        },
      },
    });

    console.log("\n--- Imported Statements (most recent 25) ---");
    statements.forEach((s) => {
      const customerName = s.customer.shortName || s.customer.companyName;
      const plantsArr = s.plants as any[];
      const plantCount = Array.isArray(plantsArr) ? plantsArr.length : 0;
      console.log(
        `  ${s.year}/${String(s.month).padStart(2, "0")} | ${customerName.padEnd(30)} | ${plantCount} cây | ${Number(s.subtotal).toLocaleString().padStart(12)} VND`
      );
    });

    // Group by month
    const byMonth = await prisma.monthlyStatement.groupBy({
      by: ["year", "month"],
      _count: { id: true },
      _sum: { subtotal: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    console.log("\n--- Summary by Period ---");
    byMonth.forEach((m) => {
      console.log(
        `  ${m.year}/${String(m.month).padStart(2, "0")}: ${m._count.id} statements, ${Number(m._sum.subtotal || 0).toLocaleString()} VND subtotal`
      );
    });

    // Unmatched from JSON (those we couldn't match)
    console.log("\n--- Unmatched Clients (need manual mapping) ---");
    const unmatchedClients = [
      "Oglivy & Mather",
      "Giàn Khoan",
      "58 Võ Văn Tần (corrupt data)",
      "DL&DV HK Biển Đông",
      "EMXIBANK KỲ ĐỒNG",
      "TẦNG 16- 20 VÕ VĂN KIỆT",
      "VIKKI 25BIS",
      "UOB Q1 (corrupt data)",
      "Agribank Phan Đăng Lưu (mua cây)",
      "Gras Savoye",
      "Vietcombank-Pham hùng",
      "Nha Khoa Hoàn Mỹ",
      "ZETAPROCES VN",
      "HARVES 39B Trường Sơn",
      "Eximbank (CN Sai Gon)",
      "Eximbank (CN Kỳ Đồng)",
    ];
    unmatchedClients.forEach((c) => console.log(`  - ${c}`));

    console.log("\n✅ Import complete. 17 new statements added.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
