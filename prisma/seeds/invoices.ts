/**
 * Invoice Seed Data
 * Creates sample invoices for testing payment recording
 */
import { PrismaClient, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedInvoices() {
  console.log("📄 Seeding invoices...");

  // Get existing data
  const customers = await prisma.customer.findMany({ take: 3 });
  const contracts = await prisma.contract.findMany({ take: 3 });

  if (customers.length === 0) {
    console.log("  ⏭️  No customers found. Run main seed first.");
    return;
  }

  // Get admin user for createdById
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Invoice data with varying amounts and statuses
  const invoicesData = [
    {
      invoiceNumber: "INV-202512-0001",
      customerId: customers[0]?.id,
      contractId: contracts[0]?.id || null,
      issueDate: twoMonthsAgo,
      dueDate: new Date(twoMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "SENT" as InvoiceStatus,
      subtotal: 10000000, // 10M
      vatRate: 10,
      vatAmount: 1000000,
      totalAmount: 11000000, // 11M total
      paidAmount: 0,
      outstandingAmount: 11000000,
      notes: "Hóa đơn tháng 10/2025 - Thuê cây xanh văn phòng",
    },
    {
      invoiceNumber: "INV-202512-0002",
      customerId: customers[1]?.id || customers[0]?.id,
      contractId: contracts[0]?.id || null,
      issueDate: lastMonth,
      dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "SENT" as InvoiceStatus,
      subtotal: 5000000, // 5M
      vatRate: 10,
      vatAmount: 500000,
      totalAmount: 5500000, // 5.5M total
      paidAmount: 0,
      outstandingAmount: 5500000,
      notes: "Hóa đơn tháng 11/2025 - Dịch vụ chăm sóc cây",
    },
    {
      invoiceNumber: "INV-202512-0003",
      customerId: customers[2]?.id || customers[0]?.id,
      contractId: null,
      issueDate: today,
      dueDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      status: "SENT" as InvoiceStatus,
      subtotal: 3000000, // 3M
      vatRate: 10,
      vatAmount: 300000,
      totalAmount: 3300000, // 3.3M total
      paidAmount: 0,
      outstandingAmount: 3300000,
      notes: "Hóa đơn tháng 12/2025 - Thuê cây sự kiện",
    },
    {
      invoiceNumber: "INV-202512-0004",
      customerId: customers[0]?.id,
      contractId: contracts[0]?.id || null,
      issueDate: lastMonth,
      dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "SENT" as InvoiceStatus,
      subtotal: 8000000, // 8M
      vatRate: 10,
      vatAmount: 800000,
      totalAmount: 8800000, // 8.8M total
      paidAmount: 0,
      outstandingAmount: 8800000,
      notes: "Hóa đơn bổ sung - Cây cảnh văn phòng",
    },
    {
      invoiceNumber: "INV-202512-0005",
      customerId: customers[1]?.id || customers[0]?.id,
      contractId: null,
      issueDate: twoMonthsAgo,
      dueDate: new Date(twoMonthsAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: "SENT" as InvoiceStatus,
      subtotal: 15000000, // 15M
      vatRate: 10,
      vatAmount: 1500000,
      totalAmount: 16500000, // 16.5M total
      paidAmount: 0,
      outstandingAmount: 16500000,
      notes: "Hóa đơn tổng hợp quý 4/2025",
    },
  ];

  let createdCount = 0;

  for (const data of invoicesData) {
    try {
      // Check if invoice already exists
      const existing = await prisma.invoice.findUnique({
        where: { invoiceNumber: data.invoiceNumber },
      });

      if (existing) {
        console.log(`  ⏭️  Invoice ${data.invoiceNumber} already exists, skipping`);
        continue;
      }

      const invoice = await prisma.invoice.create({
        data: {
          ...data,
          createdById: adminUser?.id,
        },
      });

      console.log(
        `  ✅ Created invoice: ${invoice.invoiceNumber} - ${(Number(invoice.totalAmount) / 1000000).toFixed(1)}M VND`
      );
      createdCount++;
    } catch (error) {
      console.error(`  ❌ Error creating invoice ${data.invoiceNumber}:`, error);
    }
  }

  console.log(`✨ Invoices seeded successfully! (${createdCount} invoices)`);
}

// Run if called directly
if (require.main === module) {
  seedInvoices()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
