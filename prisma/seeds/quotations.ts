/**
 * Quotation Seed Data
 * Generate sample quotations for testing
 */
import { PrismaClient, QuotationStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedQuotations() {
  console.log("🌱 Seeding quotations...");

  // Get existing data
  const customers = await prisma.customer.findMany({ take: 5 });
  const plantTypes = await prisma.plantType.findMany({ take: 10 });
  const users = await prisma.user.findMany({ take: 1 });

  if (customers.length === 0 || plantTypes.length === 0 || users.length === 0) {
    console.warn("⚠️  No customers, plant types, or users found. Skipping quotation seeding.");
    return;
  }

  const user = users[0];

  // Helper to calculate totals
  function calculateTotals(items: any[], discountRate: number, vatRate: number) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountRate || 0) / 100);
      return sum + itemTotal;
    }, 0);

    const discountAmount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = subtotalAfterDiscount * (vatRate / 100);
    const totalAmount = subtotalAfterDiscount + vatAmount;

    return {
      subtotal,
      discountAmount,
      vatAmount,
      totalAmount,
    };
  }

  // Sample quotations (using only available customers)
  const quotationsData = [
    {
      customerId: customers[0]!.id,
      title: "Báo giá cây xanh văn phòng - Gói cơ bản",
      description: "Gói cây xanh cho văn phòng diện tích 50m², bao gồm 10 cây cảnh đa dạng",
      status: "DRAFT" as QuotationStatus,
      validDays: 30,
      items: [
        { plantTypeId: plantTypes[0]!.id, quantity: 3, discountRate: 0 },
        { plantTypeId: plantTypes[1]!.id, quantity: 5, discountRate: 0 },
        { plantTypeId: plantTypes[2]!.id, quantity: 2, discountRate: 0 },
      ],
      discountRate: 5,
      vatRate: 10,
    },
    {
      customerId: customers[1]!.id,
      title: "Báo giá cây xanh sảnh chung cư",
      description: "Trang trí sảnh chung cư cao cấp với cây cảnh lớn",
      status: "SENT" as QuotationStatus,
      validDays: 30,
      items: [
        { plantTypeId: plantTypes[3]!.id, quantity: 2, discountRate: 0 },
        { plantTypeId: plantTypes[4]!.id, quantity: 4, discountRate: 5 },
      ],
      discountRate: 0,
      vatRate: 10,
    },
    {
      customerId: customers[2]!.id,
      title: "Báo giá cây xanh phòng họp",
      description: "Cây xanh trang trí phòng họp và khu vực tiếp khách",
      status: "ACCEPTED" as QuotationStatus,
      validDays: 30,
      items: [
        { plantTypeId: plantTypes[5] ? plantTypes[5].id : plantTypes[0]!.id, quantity: 6, discountRate: 0 },
        { plantTypeId: plantTypes[6] ? plantTypes[6].id : plantTypes[1]!.id, quantity: 3, discountRate: 0 },
      ],
      discountRate: 10,
      vatRate: 10,
      proposedDuration: 12,
    },
    {
      customerId: customers[0]!.id, // Reuse customer 0
      title: "Báo giá cây xanh khu vực làm việc",
      description: "Cây xanh cho khu vực làm việc chung và bàn cá nhân",
      status: "REJECTED" as QuotationStatus,
      validDays: 15,
      items: [
        { plantTypeId: plantTypes[7] ? plantTypes[7].id : plantTypes[2]!.id, quantity: 10, discountRate: 0 },
      ],
      discountRate: 0,
      vatRate: 10,
      rejectionReason: "Khách hàng chọn nhà cung cấp khác với giá tốt hơn",
    },
    {
      customerId: customers[1]!.id, // Reuse customer 1
      title: "Báo giá cây xanh toàn văn phòng",
      description: "Gói cây xanh toàn diện cho văn phòng 200m²",
      status: "EXPIRED" as QuotationStatus,
      validDays: 7,
      items: [
        { plantTypeId: plantTypes[0]!.id, quantity: 15, discountRate: 0 },
        { plantTypeId: plantTypes[2]!.id, quantity: 10, discountRate: 0 },
        { plantTypeId: plantTypes[4]!.id, quantity: 5, discountRate: 5 },
      ],
      discountRate: 15,
      vatRate: 10,
    },
  ];

  let createdCount = 0;

  for (const quotationData of quotationsData) {
    try {
      const now = new Date();
      const validFrom = new Date(now);
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + quotationData.validDays);

      // Prepare items with prices
      const itemsWithPrices = quotationData.items.map((item) => {
        const plantType = plantTypes.find((p) => p.id === item.plantTypeId);
        if (!plantType) throw new Error(`Plant type not found: ${item.plantTypeId}`);

        const unitPrice = Number(plantType.rentalPrice);
        const totalPrice = item.quantity * unitPrice * (1 - (item.discountRate || 0) / 100);

        return {
          ...item,
          unitPrice,
          totalPrice,
        };
      });

      // Calculate totals
      const totals = calculateTotals(
        itemsWithPrices,
        quotationData.discountRate,
        quotationData.vatRate
      );

      // Generate quote number
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const count = createdCount + 1;
      const quoteNumber = `QT-${year}${month}-${String(count).padStart(4, "0")}`;

      // Create quotation with items
      await prisma.quotation.create({
        data: {
          quoteNumber,
          customerId: quotationData.customerId,
          createdById: user.id,
          title: quotationData.title,
          description: quotationData.description,
          validFrom,
          validUntil: quotationData.status === "EXPIRED" ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : validUntil,
          status: quotationData.status,
          subtotal: totals.subtotal,
          discountRate: quotationData.discountRate,
          discountAmount: totals.discountAmount,
          vatRate: quotationData.vatRate,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          proposedDuration: quotationData.proposedDuration || null,
          proposedMonthlyFee: quotationData.proposedDuration ? totals.totalAmount / quotationData.proposedDuration : null,
          proposedDeposit: quotationData.proposedDuration ? totals.totalAmount : null,
          rejectionReason: quotationData.rejectionReason || null,
          responseDate: ["ACCEPTED", "REJECTED"].includes(quotationData.status) ? now : null,
          termsConditions: "- Giá đã bao gồm VAT 10%\n- Thanh toán theo tháng\n- Miễn phí bảo trì và thay thế cây trong thời gian hợp đồng\n- Hợp đồng có hiệu lực khi đã thanh toán tiền cọc",
          items: {
            create: itemsWithPrices.map((item) => ({
              plantTypeId: item.plantTypeId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountRate: item.discountRate || 0,
              totalPrice: item.totalPrice,
            })),
          },
        },
      });

      createdCount++;
    } catch (error) {
      console.error(`Failed to create quotation: ${quotationData.title}`, error);
    }
  }

  console.log(`✅ Created ${createdCount} quotations`);
}

// Run if executed directly
if (require.main === module) {
  seedQuotations()
    .then(() => {
      console.log("✅ Quotation seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Quotation seeding failed:", error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
