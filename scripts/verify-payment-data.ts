/**
 * Verify Seeded Data
 * Check that invoices and payments were created correctly
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyData() {
  console.log("🔍 Verifying seeded data...\n");

  // Count totals
  const [customerCount, contractCount, invoiceCount, paymentCount] = await Promise.all([
    prisma.customer.count(),
    prisma.contract.count(),
    prisma.invoice.count(),
    prisma.payment.count(),
  ]);

  console.log("📊 Data Counts:");
  console.log(`  Customers: ${customerCount}`);
  console.log(`  Contracts: ${contractCount}`);
  console.log(`  Invoices: ${invoiceCount}`);
  console.log(`  Payments: ${paymentCount}\n`);

  // List invoices with details
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: {
        select: { code: true, companyName: true },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          isVerified: true,
        },
      },
    },
    orderBy: { invoiceNumber: "asc" },
  });

  console.log("📄 Invoices:");
  for (const inv of invoices) {
    const totalAmount = Number(inv.totalAmount);
    const paidAmount = Number(inv.paidAmount);
    const outstanding = Number(inv.outstandingAmount);
    const paymentCount = inv.payments.length;

    console.log(`\n  ${inv.invoiceNumber}`);
    console.log(`    Customer: ${inv.customer.companyName} (${inv.customer.code})`);
    console.log(`    Total: ${(totalAmount / 1000000).toFixed(2)}M VND`);
    console.log(`    Paid: ${(paidAmount / 1000000).toFixed(2)}M VND`);
    console.log(`    Outstanding: ${(outstanding / 1000000).toFixed(2)}M VND`);
    console.log(`    Status: ${inv.status}`);
    console.log(`    Payments: ${paymentCount} payment(s)`);

    if (paymentCount > 0) {
      inv.payments.forEach((p, i) => {
        const verified = p.isVerified ? "✓ Verified" : "⏳ Unverified";
        console.log(
          `      ${i + 1}. ${(Number(p.amount) / 1000000).toFixed(2)}M - ${p.paymentMethod} - ${verified}`
        );
      });
    }
  }

  // Verify invoice status logic
  console.log("\n✅ Verification Checks:");
  let allChecksPass = true;

  for (const inv of invoices) {
    const totalAmount = Number(inv.totalAmount);
    const paidAmount = Number(inv.paidAmount);
    const outstanding = Number(inv.outstandingAmount);

    // Check balance calculation
    const calculatedOutstanding = totalAmount - paidAmount;
    if (Math.abs(calculatedOutstanding - outstanding) > 0.01) {
      console.log(
        `  ❌ ${inv.invoiceNumber}: Balance mismatch (calculated: ${calculatedOutstanding}, stored: ${outstanding})`
      );
      allChecksPass = false;
    }

    // Check status logic
    let expectedStatus = "SENT";
    if (paidAmount === totalAmount) {
      expectedStatus = "PAID";
    } else if (paidAmount > 0) {
      expectedStatus = "PARTIAL";
    }

    if (inv.status !== expectedStatus) {
      console.log(
        `  ❌ ${inv.invoiceNumber}: Status mismatch (expected: ${expectedStatus}, actual: ${inv.status})`
      );
      allChecksPass = false;
    }
  }

  if (allChecksPass) {
    console.log("  ✅ All invoice balances and statuses are correct!");
  }

  // Payment summary
  const paymentsByMethod = await prisma.payment.groupBy({
    by: ["paymentMethod"],
    _count: { id: true },
    _sum: { amount: true },
  });

  console.log("\n💰 Payments by Method:");
  for (const group of paymentsByMethod) {
    const total = Number(group._sum.amount || 0) / 1000000;
    console.log(`  ${group.paymentMethod}: ${group._count.id} payments - ${total.toFixed(2)}M VND`);
  }

  const verifiedCount = await prisma.payment.count({ where: { isVerified: true } });
  const unverifiedCount = await prisma.payment.count({ where: { isVerified: false } });
  console.log(`\n  Verified: ${verifiedCount} | Unverified: ${unverifiedCount}`);

  console.log("\n✨ Verification complete!\n");
}

verifyData()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
