/**
 * Test Server Actions for Quotations
 */
import { PrismaClient } from "@prisma/client";
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
} from "../src/actions/quotations";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing Quotation Server Actions\n");
  console.log("=".repeat(60) + "\n");

  // Get test data
  const customer = await prisma.customer.findFirst();
  const plantTypes = await prisma.plantType.findMany({ take: 2 });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!customer || plantTypes.length < 2 || !admin) {
    console.error("❌ Missing test data");
    process.exit(1);
  }

  console.log("📋 Setup:");
  console.log(`   Customer: ${customer.companyName}`);
  console.log(`   Plants: ${plantTypes.length} available`);
  console.log(`   User: ${admin.email}\n`);

  // ============================================================
  // TEST 1: getQuotations (List with filters)
  // ============================================================
  console.log("📝 TEST 1: getQuotations()");
  console.log("-".repeat(60));

  try {
    const result = await getQuotations({
      page: 1,
      pageSize: 10,
    });

    if (result.success && result.data) {
      console.log(`✅ Retrieved ${result.data.quotations.length} quotations`);
      console.log(`   Total: ${result.data.pagination.total}`);
      console.log(`   Page: ${result.data.pagination.page}/${result.data.pagination.totalPages}`);

      if (result.data.stats) {
        console.log(`   Stats: Total=${result.data.stats.total}, Draft=${result.data.stats.draft}`);
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // ============================================================
  // TEST 2: createQuotation
  // ============================================================
  console.log("\n📝 TEST 2: createQuotation()");
  console.log("-".repeat(60));

  try {
    const createResult = await createQuotation({
      customerId: customer.id,
      title: "Server Action Test Quotation",
      description: "Testing create quotation server action",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      discountRate: 10,
      vatRate: 10,
      items: [
        {
          plantTypeId: plantTypes[0].id,
          quantity: 3,
          unitPrice: Number(plantTypes[0].rentalPrice),
          discountRate: 0,
        },
        {
          plantTypeId: plantTypes[1].id,
          quantity: 2,
          unitPrice: Number(plantTypes[1].rentalPrice),
          discountRate: 5,
        },
      ],
    });

    if (createResult.success && createResult.data) {
      console.log(`✅ Created: ${createResult.data.quoteNumber}`);
      console.log(`   Items: ${createResult.data.items?.length}`);
      console.log(`   Total: ${Number(createResult.data.totalAmount).toLocaleString()}đ`);
      console.log(`   Status: ${createResult.data.status}`);

      // Save for next tests
      const quotationId = createResult.data.id;

      // ============================================================
      // TEST 3: getQuotationById
      // ============================================================
      console.log("\n📝 TEST 3: getQuotationById()");
      console.log("-".repeat(60));

      const getResult = await getQuotationById(quotationId);
      if (getResult.success && getResult.data) {
        console.log(`✅ Retrieved: ${getResult.data.quoteNumber}`);
        console.log(`   Customer: ${getResult.data.customer.companyName}`);
        console.log(`   Items: ${getResult.data.items.length}`);
        console.log(`   Status: ${getResult.data.status}`);
      } else {
        console.log(`❌ Failed: ${getResult.error}`);
      }

      // ============================================================
      // TEST 4: sendQuotation
      // ============================================================
      console.log("\n📝 TEST 4: sendQuotation()");
      console.log("-".repeat(60));

      const sendResult = await sendQuotation({
        id: quotationId,
        email: customer.email || "test@example.com",
      });

      if (sendResult.success && sendResult.data) {
        console.log(`✅ Sent: ${sendResult.data.quoteNumber}`);
        console.log(`   Status: ${sendResult.data.status} (was DRAFT)`);
        console.log(`   Response Date: ${sendResult.data.responseDate?.toLocaleString() || "N/A"}`);
      } else {
        console.log(`❌ Failed: ${sendResult.error}`);
      }

      // ============================================================
      // TEST 5: acceptQuotation
      // ============================================================
      console.log("\n📝 TEST 5: acceptQuotation()");
      console.log("-".repeat(60));

      const acceptResult = await acceptQuotation(quotationId, {
        customerResponse: "Accept via server action test",
      });

      if (acceptResult.success && acceptResult.data) {
        console.log(`✅ Accepted: ${acceptResult.data.quoteNumber}`);
        console.log(`   Status: ${acceptResult.data.status} (was SENT)`);
        console.log(`   Response: ${acceptResult.data.customerResponse}`);
      } else {
        console.log(`❌ Failed: ${acceptResult.error}`);
      }

      // ============================================================
      // TEST 6: rejectQuotation (create new one first)
      // ============================================================
      console.log("\n📝 TEST 6: rejectQuotation()");
      console.log("-".repeat(60));

      // Create another quotation to reject
      const rejectQuote = await createQuotation({
        customerId: customer.id,
        title: "Test Rejection",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        discountRate: 0,
        vatRate: 10,
        items: [
          {
            plantTypeId: plantTypes[0].id,
            quantity: 1,
            unitPrice: Number(plantTypes[0].rentalPrice),
            discountRate: 0,
          },
        ],
      });

      if (rejectQuote.success && rejectQuote.data) {
        // Send it first
        await sendQuotation({
          id: rejectQuote.data.id,
          email: customer.email || "test@example.com",
        });

        // Then reject
        const rejectResult = await rejectQuotation(rejectQuote.data.id, "Price too high for test");

        if (rejectResult.success && rejectResult.data) {
          console.log(`✅ Rejected: ${rejectResult.data.quoteNumber}`);
          console.log(`   Status: ${rejectResult.data.status}`);
          console.log(`   Reason: ${rejectResult.data.rejectionReason}`);
        } else {
          console.log(`❌ Failed: ${rejectResult.error}`);
        }
      }
    } else {
      console.log(`❌ Create failed: ${createResult.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Server Action Tests Complete!");
  console.log("=".repeat(60) + "\n");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
