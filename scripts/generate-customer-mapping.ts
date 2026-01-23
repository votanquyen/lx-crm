/**
 * Generate Manual Customer Mapping SQL
 * Run this to get customer IDs for manual mapping
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const unmatchedClients = [
  { sheet: "Oglivy & Mather", suggest: "OGILVY" },
  { sheet: "Giàn Khoan", suggest: "KHOAN" },
  { sheet: "DL&DV HK Biển Đông", suggest: "" },
  { sheet: "EMXIBANK KỲ ĐỒNG", suggest: "EXIMBANK" },
  { sheet: "TẦNG 16- 20 VÕ VĂN KIỆT", suggest: "" },
  { sheet: "VIKKI 25BIS", suggest: "VIKKI" },
  { sheet: "Gras Savoye", suggest: "WILLIS" },
  { sheet: "Vietcombank-Pham hùng", suggest: "VIETCOMBANK" },
  { sheet: "Nha Khoa Hoàn Mỹ", suggest: "HOÀN MỸ" },
  { sheet: "ZETAPROCES VN", suggest: "" },
  { sheet: "HARVES 39B Trường Sơn", suggest: "HARVEST" },
  { sheet: "Eximbank ( CN Sai Gon)", suggest: "EXIMBANK SÀI GÒN" },
  { sheet: "Eximbank ( CN Kỳ Đồng)", suggest: "EXIMBAK KỲ ĐỒNG" },
  { sheet: "Agribank Phan Đăng Lưu", suggest: "AGRIBANK" },
  { sheet: "Agribank Phan Đăng Lưu（mua cây)", suggest: "AGRIBANK" },
  { sheet: "PVI VN", suggest: "PVI" },
  { sheet: "Agribank sài gòn", suggest: "AGRIBANK SÀI GÒN" },
  { sheet: "FUJIFILM MỚI'", suggest: "FUJIFILM" },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ["error"] });

  try {
    console.log("🔍 Manual Customer Mapping Helper\n");

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: { id: true, companyName: true, shortName: true },
      orderBy: { shortName: "asc" },
    });

    console.log("--- Suggested Mappings ---\n");

    for (const client of unmatchedClients) {
      // Find matching customer
      const match = customers.find(
        (c) =>
          c.shortName?.toUpperCase().includes(client.suggest.toUpperCase()) ||
          c.companyName?.toUpperCase().includes(client.suggest.toUpperCase())
      );

      if (match) {
        console.log(`-- ${client.sheet} → ${match.shortName}`);
        console.log(
          `UPDATE temp_bang_ke_import SET customer_id = '${match.id}' WHERE sheet_name = '${client.sheet}';`
        );
        console.log();
      } else {
        console.log(`-- ${client.sheet} → NO MATCH FOUND (need to create customer)`);
        console.log(`-- Suggestion: Create customer with shortName = '${client.sheet}'`);
        console.log();
      }
    }

    console.log("\n--- All Available Customers ---\n");
    customers.forEach((c) => {
      console.log(`  ${c.id} | ${c.shortName} | ${c.companyName?.substring(0, 50)}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
