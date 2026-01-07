/**
 * Seed Monthly Statements (Bảng Kê)
 * Creates sample monthly statements for active customers
 */
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PlantItem {
  id: string;
  name: string;
  sizeSpec: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Sample plant data for statements
const samplePlants: PlantItem[] = [
  { id: "1", name: "Phát Tài Núi", sizeSpec: "140-150", quantity: 2, unitPrice: 350000, total: 700000 },
  { id: "2", name: "Kim Tiền", sizeSpec: "120-130", quantity: 3, unitPrice: 280000, total: 840000 },
  { id: "3", name: "Trầu Bà Cột", sizeSpec: "100-110", quantity: 1, unitPrice: 220000, total: 220000 },
  { id: "4", name: "Lưỡi Hổ", sizeSpec: "80-90", quantity: 4, unitPrice: 150000, total: 600000 },
  { id: "5", name: "Bạch Mã Hoàng Tử", sizeSpec: "130-140", quantity: 2, unitPrice: 400000, total: 800000 },
];

// Calculate period dates (24th previous month to 23rd current month)
function calculatePeriod(year: number, month: number) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return {
    periodStart: new Date(prevYear, prevMonth - 1, 24), // JS months are 0-indexed
    periodEnd: new Date(year, month - 1, 23),
  };
}

// Calculate amounts
function calculateAmounts(plants: PlantItem[]) {
  const subtotal = plants.reduce((sum, p) => sum + p.total, 0);
  const vatAmount = Math.round(subtotal * 0.08);
  const total = subtotal + vatAmount;
  return { subtotal, vatAmount, total };
}

export async function seedMonthlyStatements() {
  console.warn("[seed] 📋 Seeding MonthlyStatements...");

  // Get active customers
  const customers = await prisma.customer.findMany({
    where: { status: "ACTIVE" },
    take: 10, // Limit to 10 customers
  });

  if (customers.length === 0) {
    console.warn("[seed] ⚠️ No active customers found. Skipping MonthlyStatements seed.");
    return;
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  let created = 0;
  let skipped = 0;

  for (const customer of customers) {
    // Create statements for last 3 months
    for (let i = 0; i < 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      // Check if already exists
      const existing = await prisma.monthlyStatement.findUnique({
        where: {
          customerId_year_month: {
            customerId: customer.id,
            year,
            month,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Randomly select 2-5 plants
      const numPlants = 2 + Math.floor(Math.random() * 4);
      const shuffled = [...samplePlants].sort(() => 0.5 - Math.random());
      const selectedPlants = shuffled.slice(0, numPlants).map((p, idx) => ({
        ...p,
        id: `${customer.id}-${month}-${idx + 1}`,
        quantity: 1 + Math.floor(Math.random() * 3),
      })).map(p => ({
        ...p,
        total: p.unitPrice * p.quantity,
      }));

      const { periodStart, periodEnd } = calculatePeriod(year, month);
      const { subtotal, vatAmount, total } = calculateAmounts(selectedPlants);

      await prisma.monthlyStatement.create({
        data: {
          customerId: customer.id,
          year,
          month,
          periodStart,
          periodEnd,
          contactName: customer.contactName,
          plants: selectedPlants as unknown as Prisma.InputJsonValue,
          subtotal,
          vatRate: 8,
          vatAmount,
          total,
          needsConfirmation: i === 0, // Current month needs confirmation
        },
      });

      created++;
    }
  }

  console.warn(`[seed] ✅ MonthlyStatements: ${created} created, ${skipped} skipped`);
}

// Run standalone
if (require.main === module) {
  seedMonthlyStatements()
    .then(() => {
      console.warn("[seed] ✅ Done!");
      process.exit(0);
    })
    .catch((e) => {
      console.error("[seed] ❌ Error:", e);
      process.exit(1);
    });
}
