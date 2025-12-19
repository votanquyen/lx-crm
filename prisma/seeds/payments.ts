/**
 * Payment Seed Data
 * Sample payments for development and testing
 */
import { PrismaClient, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPayments() {
  console.log("💰 Seeding payments...");

  // Get existing invoices to create payments for
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "PARTIAL", "PAID"] },
    },
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      paidAmount: true,
    },
    take: 10,
  });

  if (invoices.length === 0) {
    console.log("  ⏭️  No invoices found. Create invoices first.");
    return;
  }

  // Get admin user for recordedBy
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const paymentData = [
    {
      paymentMethod: "BANK_TRANSFER" as PaymentMethod,
      bankRef: "FT20251218001",
      bankName: "Vietcombank",
      accountNumber: "0123456789",
      accountName: "CONG TY LOC XANH",
    },
    {
      paymentMethod: "CASH" as PaymentMethod,
      receivedBy: "Nguyễn Văn A",
      receiptNumber: "BN-001",
    },
    {
      paymentMethod: "BANK_TRANSFER" as PaymentMethod,
      bankRef: "FT20251218002",
      bankName: "BIDV",
      accountNumber: "9876543210",
      accountName: "LOC XANH COMPANY",
    },
    {
      paymentMethod: "MOMO" as PaymentMethod,
      bankRef: "MOMO123456",
      receivedBy: "Trần Thị B",
    },
    {
      paymentMethod: "BANK_TRANSFER" as PaymentMethod,
      bankRef: "FT20251218003",
      bankName: "Techcombank",
    },
  ];

  let createdCount = 0;

  for (let i = 0; i < Math.min(invoices.length, 5); i++) {
    const invoice = invoices[i];
    const data = paymentData[i];

    // Calculate payment amount (random: 30-100% of remaining)
    const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (remaining <= 0) continue;

    const paymentPercentage = Math.random() * 0.7 + 0.3; // 30-100%
    const paymentAmount = Math.floor(remaining * paymentPercentage);

    // Create payment date (random in last 30 days)
    const daysAgo = Math.floor(Math.random() * 30);
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() - daysAgo);

    try {
      const _payment = await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentDate,
          paymentMethod: data.paymentMethod,
          bankRef: data.bankRef,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          receivedBy: data.receivedBy,
          receiptNumber: data.receiptNumber,
          notes: `Thanh toán cho hóa đơn ${invoice.invoiceNumber}`,
          isVerified: Math.random() > 0.3, // 70% verified
          verifiedAt: Math.random() > 0.3 ? new Date() : null,
          verifiedById: Math.random() > 0.3 && adminUser ? adminUser.id : null,
          recordedById: adminUser?.id,
        },
      });

      // Update invoice paidAmount and status
      const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
      const newRemaining = Number(invoice.totalAmount) - newPaidAmount;

      let newStatus: "SENT" | "PARTIAL" | "PAID" = "SENT";
      if (newRemaining === 0) {
        newStatus = "PAID";
      } else if (newPaidAmount > 0) {
        newStatus = "PARTIAL";
      }

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          outstandingAmount: newRemaining,
          status: newStatus,
        },
      });

      console.log(`  ✅ Created payment: ${paymentAmount.toLocaleString()}đ for ${invoice.invoiceNumber} (${data.paymentMethod})`);
      createdCount++;
    } catch (error) {
      console.error(`  ❌ Error creating payment for ${invoice.invoiceNumber}:`, error);
    }
  }

  console.log(`✨ Payments seeded successfully! (${createdCount} payments)`);
}

// Run if called directly
if (require.main === module) {
  seedPayments()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
