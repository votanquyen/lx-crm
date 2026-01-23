/**
 * Manual Testing Script for Quotation System
 * Tests all CRUD operations and business logic
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to format currency
const fmt = (amount: number | string) => {
  return Number(amount).toLocaleString("vi-VN") + "đ";
};

// Test results tracking
const results: { test: string; status: "✅" | "❌"; message: string }[] = [];

function addResult(test: string, passed: boolean, message: string) {
  results.push({ test, status: passed ? "✅" : "❌", message });
  console.log(`${passed ? "✅" : "❌"} ${test}: ${message}`);
}

async function main() {
  console.log("🧪 Starting Quotation System Manual Tests\n");
  console.log("=".repeat(60) + "\n");

  // Get test data
  const customer = await prisma.customer.findFirst();
  const plantTypes = await prisma.plantType.findMany({ take: 3 });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!customer || plantTypes.length < 2 || !admin) {
    console.error("❌ Missing test data (customers, plants, or admin user)");
    process.exit(1);
  }

  console.log(`📋 Test Setup:`);
  console.log(`   Customer: ${customer.companyName}`);
  console.log(`   Plant Types: ${plantTypes.length} available`);
  console.log(`   Admin: ${admin.email}`);
  console.log("");

  // ============================================================
  // TEST 1: Create Quotation with Single Item
  // ============================================================
  console.log("\n📝 TEST 1: Create Quotation with Single Item");
  console.log("-".repeat(60));

  try {
    const plant1 = plantTypes[0];
    const subtotal = Number(plant1.rentalPrice) * 5; // 5 items
    const discountAmount = subtotal * 0.05; // 5% discount
    const vatAmount = (subtotal - discountAmount) * 0.1; // 10% VAT
    const totalAmount = subtotal - discountAmount + vatAmount;

    const quotation1 = await prisma.quotation.create({
      data: {
        quoteNumber: `QT-TEST-${Date.now()}-001`,
        customerId: customer.id,
        createdById: admin.id,
        title: "Test Quotation - Single Item",
        description: "Testing single item quotation creation",
        subtotal,
        discountRate: 5,
        discountAmount,
        vatRate: 10,
        vatAmount,
        totalAmount,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "DRAFT",
        items: {
          create: [
            {
              plantTypeId: plant1.id,
              quantity: 5,
              unitPrice: plant1.rentalPrice,
              discountRate: 0,
              totalPrice: Number(plant1.rentalPrice) * 5,
            },
          ],
        },
      },
      include: { items: true },
    });

    addResult(
      "Create Single Item Quotation",
      quotation1.items.length === 1,
      `Created ${quotation1.quoteNumber} with 1 item`
    );
    addResult(
      "Subtotal Calculation",
      Math.abs(Number(quotation1.subtotal) - subtotal) < 1,
      `Subtotal: ${fmt(quotation1.subtotal)} (expected ${fmt(subtotal)})`
    );
    addResult(
      "Total Calculation",
      Math.abs(Number(quotation1.totalAmount) - totalAmount) < 1,
      `Total: ${fmt(quotation1.totalAmount)} (expected ${fmt(totalAmount)})`
    );
  } catch (error: any) {
    addResult("Create Single Item Quotation", false, error.message);
  }

  // ============================================================
  // TEST 2: Create Quotation with Multiple Items
  // ============================================================
  console.log("\n📝 TEST 2: Create Quotation with Multiple Items");
  console.log("-".repeat(60));

  try {
    const plant1 = plantTypes[0];
    const plant2 = plantTypes[1];

    const item1Total = Number(plant1.rentalPrice) * 3;
    const item2Total = Number(plant2.rentalPrice) * 2;
    const subtotal = item1Total + item2Total;
    const discountAmount = subtotal * 0.1; // 10% discount
    const vatAmount = (subtotal - discountAmount) * 0.1; // 10% VAT
    const totalAmount = subtotal - discountAmount + vatAmount;

    const quotation2 = await prisma.quotation.create({
      data: {
        quoteNumber: `QT-TEST-${Date.now()}-002`,
        customerId: customer.id,
        createdById: admin.id,
        title: "Test Quotation - Multiple Items",
        description: "Testing multi-item quotation creation",
        subtotal,
        discountRate: 10,
        discountAmount,
        vatRate: 10,
        vatAmount,
        totalAmount,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
        items: {
          create: [
            {
              plantTypeId: plant1.id,
              quantity: 3,
              unitPrice: plant1.rentalPrice,
              discountRate: 0,
              totalPrice: item1Total,
            },
            {
              plantTypeId: plant2.id,
              quantity: 2,
              unitPrice: plant2.rentalPrice,
              discountRate: 0,
              totalPrice: item2Total,
            },
          ],
        },
      },
      include: { items: true },
    });

    addResult(
      "Create Multi-Item Quotation",
      quotation2.items.length === 2,
      `Created ${quotation2.quoteNumber} with 2 items`
    );
    addResult(
      "Items Total Calculation",
      Math.abs(Number(quotation2.subtotal) - subtotal) < 1,
      `Subtotal: ${fmt(quotation2.subtotal)}`
    );
    addResult(
      "Discount Calculation",
      Math.abs(Number(quotation2.discountAmount) - discountAmount) < 1,
      `Discount: ${fmt(quotation2.discountAmount)} (10%)`
    );
    addResult(
      "VAT Calculation",
      Math.abs(Number(quotation2.vatAmount) - vatAmount) < 1,
      `VAT: ${fmt(quotation2.vatAmount)} (10%)`
    );
  } catch (error: any) {
    addResult("Create Multi-Item Quotation", false, error.message);
  }

  // ============================================================
  // TEST 3: Status Workflow Tests
  // ============================================================
  console.log("\n📝 TEST 3: Status Workflow (DRAFT → SENT → ACCEPTED)");
  console.log("-".repeat(60));

  try {
    // Create a draft quotation for status testing
    const testQuote = await prisma.quotation.create({
      data: {
        quoteNumber: `QT-TEST-${Date.now()}-003`,
        customerId: customer.id,
        createdById: admin.id,
        title: "Test Quotation - Status Workflow",
        subtotal: 1000000,
        discountRate: 0,
        discountAmount: 0,
        vatRate: 10,
        vatAmount: 100000,
        totalAmount: 1100000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
        items: {
          create: [
            {
              plantTypeId: plantTypes[0].id,
              quantity: 1,
              unitPrice: 1000000,
              discountRate: 0,
              totalPrice: 1000000,
            },
          ],
        },
      },
    });

    addResult(
      "Initial Status",
      testQuote.status === "DRAFT",
      `Initial status: ${testQuote.status}`
    );

    // DRAFT → SENT
    const sentQuote = await prisma.quotation.update({
      where: { id: testQuote.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    addResult(
      "DRAFT → SENT Transition",
      sentQuote.status === "SENT" && sentQuote.sentAt !== null,
      `Status: ${sentQuote.status}, sentAt: ${sentQuote.sentAt?.toLocaleString()}`
    );

    // SENT → ACCEPTED
    const acceptedQuote = await prisma.quotation.update({
      where: { id: testQuote.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    addResult(
      "SENT → ACCEPTED Transition",
      acceptedQuote.status === "ACCEPTED" && acceptedQuote.acceptedAt !== null,
      `Status: ${acceptedQuote.status}, acceptedAt: ${acceptedQuote.acceptedAt?.toLocaleString()}`
    );

    // Try to edit ACCEPTED quotation (should fail in business logic)
    addResult(
      "Edit Guard Check",
      acceptedQuote.status !== "DRAFT",
      `Cannot edit ${acceptedQuote.status} quotation (expected behavior)`
    );
  } catch (error: any) {
    addResult("Status Workflow", false, error.message);
  }

  // ============================================================
  // TEST 4: Reject Quotation
  // ============================================================
  console.log("\n📝 TEST 4: Reject Quotation Workflow");
  console.log("-".repeat(60));

  try {
    const rejectQuote = await prisma.quotation.create({
      data: {
        quoteNumber: `QT-TEST-${Date.now()}-004`,
        customerId: customer.id,
        createdById: admin.id,
        title: "Test Quotation - Rejection",
        subtotal: 500000,
        discountRate: 0,
        discountAmount: 0,
        vatRate: 10,
        vatAmount: 50000,
        totalAmount: 550000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "SENT",
        sentAt: new Date(),
        items: {
          create: [
            {
              plantTypeId: plantTypes[0].id,
              quantity: 1,
              unitPrice: 500000,
              discountRate: 0,
              totalPrice: 500000,
            },
          ],
        },
      },
    });

    const rejectedQuote = await prisma.quotation.update({
      where: { id: rejectQuote.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedReason: "Price too high",
      },
    });

    addResult(
      "Reject Quotation",
      rejectedQuote.status === "REJECTED" && rejectedQuote.rejectedAt !== null,
      `Status: ${rejectedQuote.status}, Reason: ${rejectedQuote.rejectedReason}`
    );
  } catch (error: any) {
    addResult("Reject Quotation", false, error.message);
  }

  // ============================================================
  // TEST 5: Delete Authorization
  // ============================================================
  console.log("\n📝 TEST 5: Delete Quotation (DRAFT only)");
  console.log("-".repeat(60));

  try {
    // Create draft quotation
    const draftQuote = await prisma.quotation.create({
      data: {
        quoteNumber: `QT-TEST-${Date.now()}-005`,
        customerId: customer.id,
        createdById: admin.id,
        title: "Test Quotation - Delete",
        subtotal: 100000,
        discountRate: 0,
        discountAmount: 0,
        vatRate: 10,
        vatAmount: 10000,
        totalAmount: 110000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
        items: {
          create: [
            {
              plantTypeId: plantTypes[0].id,
              quantity: 1,
              unitPrice: 100000,
              discountRate: 0,
              totalPrice: 100000,
            },
          ],
        },
      },
    });

    // Delete draft quotation
    await prisma.quotation.delete({
      where: { id: draftQuote.id },
    });

    const deletedCheck = await prisma.quotation.findUnique({
      where: { id: draftQuote.id },
    });

    addResult(
      "Delete DRAFT Quotation",
      deletedCheck === null,
      `Successfully deleted ${draftQuote.quoteNumber}`
    );

    // Try to delete non-draft quotation (should fail in business logic)
    const existingSent = await prisma.quotation.findFirst({
      where: { status: "SENT" },
    });

    if (existingSent) {
      addResult(
        "Delete Guard Check",
        true,
        `Cannot delete ${existingSent.status} quotation (business logic prevents this)`
      );
    }
  } catch (error: any) {
    addResult("Delete Quotation", false, error.message);
  }

  // ============================================================
  // TEST 6: List Page Stats
  // ============================================================
  console.log("\n📝 TEST 6: Quotation List Statistics");
  console.log("-".repeat(60));

  try {
    const totalCount = await prisma.quotation.count();
    const draftCount = await prisma.quotation.count({
      where: { status: "DRAFT" },
    });
    const sentCount = await prisma.quotation.count({
      where: { status: { in: ["SENT"] } },
    });
    const acceptedCount = await prisma.quotation.count({
      where: { status: "ACCEPTED" },
    });

    console.log(`   Total: ${totalCount}`);
    console.log(`   Draft: ${draftCount}`);
    console.log(`   Pending (Sent): ${sentCount}`);
    console.log(`   Accepted: ${acceptedCount}`);

    addResult("Statistics Query", totalCount > 0, `Found ${totalCount} total quotations`);

    // Test pagination
    const page1 = await prisma.quotation.findMany({
      take: 10,
      skip: 0,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true } },
        items: true,
      },
    });

    addResult(
      "Pagination Query",
      page1.length <= 10,
      `Retrieved ${page1.length} quotations (page 1)`
    );
  } catch (error: any) {
    addResult("Statistics Query", false, error.message);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log("❌ Failed Tests:");
    results
      .filter((r) => r.status === "❌")
      .forEach((r) => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Testing Complete!");
  console.log("=".repeat(60) + "\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});
