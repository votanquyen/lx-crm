import { PrismaClient, CustomerStatus, ContractStatus, CustomerTier } from "@prisma/client";
import { seedPlantTypes } from "./seeds/plant-types";
import { seedInvoices } from "./seeds/invoices";
import { seedPayments } from "./seeds/payments";
import { seedQuotations } from "./seeds/quotations";

const prisma = new PrismaClient();

// Helper to normalize Vietnamese text
function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@locxanh.vn" },
    update: {},
    create: {
      email: "admin@locxanh.vn",
      name: "Admin Lộc Xanh",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // Seed plant types using dedicated seeder
  await seedPlantTypes();

  // Get all plant types for contract creation
  const plantTypes = await prisma.plantType.findMany({
    where: { isActive: true },
    take: 5,
  });
  console.log("✅ Plant types available:", plantTypes.length);

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: "KH-0001" },
      update: {},
      create: {
        code: "KH-0001",
        companyName: "Công ty ABC",
        companyNameNorm: normalizeVietnamese("Công ty ABC"),
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        addressNormalized: normalizeVietnamese("123 Nguyễn Huệ, Quận 1, TP.HCM"),
        district: "Quận 1",
        city: "TP.HCM",
        contactName: "Nguyễn Văn A",
        contactPhone: "0901234567",
        contactEmail: "contact@abc.vn",
        taxCode: "0123456789",
        status: CustomerStatus.ACTIVE,
        tier: CustomerTier.PREMIUM,
        latitude: 10.7769,
        longitude: 106.7009,
      },
    }),
    prisma.customer.upsert({
      where: { code: "KH-0002" },
      update: {},
      create: {
        code: "KH-0002",
        companyName: "Văn phòng XYZ",
        companyNameNorm: normalizeVietnamese("Văn phòng XYZ"),
        address: "456 Lê Lợi, Quận 3, TP.HCM",
        addressNormalized: normalizeVietnamese("456 Lê Lợi, Quận 3, TP.HCM"),
        district: "Quận 3",
        city: "TP.HCM",
        contactName: "Trần Thị B",
        contactPhone: "0912345678",
        contactEmail: "info@xyz.vn",
        status: CustomerStatus.ACTIVE,
        tier: CustomerTier.STANDARD,
        latitude: 10.7831,
        longitude: 106.6878,
      },
    }),
    prisma.customer.upsert({
      where: { code: "KH-0003" },
      update: {},
      create: {
        code: "KH-0003",
        companyName: "Nhà hàng Green Garden",
        companyNameNorm: normalizeVietnamese("Nhà hàng Green Garden"),
        address: "789 Pasteur, Quận 1, TP.HCM",
        addressNormalized: normalizeVietnamese("789 Pasteur, Quận 1, TP.HCM"),
        district: "Quận 1",
        city: "TP.HCM",
        contactName: "Lê Văn C",
        contactPhone: "0923456789",
        contactEmail: "hello@greengarden.vn",
        status: CustomerStatus.ACTIVE,
        tier: CustomerTier.VIP,
        latitude: 10.7825,
        longitude: 106.6936,
      },
    }),
  ]);
  console.log("✅ Customers created:", customers.length);

  // Create sample contracts
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);

  const contract = await prisma.contract.upsert({
    where: { contractNumber: "HD-2024-001" },
    update: {},
    create: {
      contractNumber: "HD-2024-001",
      customerId: customers[0].id,
      startDate: startOfYear,
      endDate: endOfYear,
      monthlyFee: 5000000,
      totalContractValue: 60000000,
      depositAmount: 10000000,
      status: ContractStatus.ACTIVE,
      paymentTerms: "Thanh toán hàng tháng, trước ngày 10",
      termsNotes: "Hợp đồng thuê cây xanh văn phòng 12 tháng",
    },
  });
  console.log("✅ Sample contract created:", contract.contractNumber);

  // Create contract items
  await prisma.contractItem.createMany({
    data: [
      {
        contractId: contract.id,
        plantTypeId: plantTypes[0].id, // Cau Hạnh Phúc
        quantity: 10,
        unitPrice: 250000,
        totalPrice: 2500000,
      },
      {
        contractId: contract.id,
        plantTypeId: plantTypes[1].id, // Kim Ngân
        quantity: 5,
        unitPrice: 180000,
        totalPrice: 900000,
      },
      {
        contractId: contract.id,
        plantTypeId: plantTypes[2].id, // Lan Ý
        quantity: 8,
        unitPrice: 120000,
        totalPrice: 960000,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Contract items created");

  // Create default settings
  const settings = [
    { key: "company_name", value: "Lộc Xanh", description: "Tên công ty" },
    { key: "company_address", value: "TP. Hồ Chí Minh", description: "Địa chỉ công ty" },
    { key: "company_phone", value: "0901234567", description: "Số điện thoại" },
    { key: "company_email", value: "contact@locxanh.vn", description: "Email liên hệ" },
    { key: "invoice_prefix", value: "INV", description: "Tiền tố hóa đơn" },
    { key: "contract_prefix", value: "HD", description: "Tiền tố hợp đồng" },
    { key: "customer_prefix", value: "KH", description: "Tiền tố khách hàng" },
    { key: "care_schedule_days", value: "14", description: "Chu kỳ chăm sóc mặc định (ngày)" },
    { key: "vat_rate", value: "10", description: "Thuế VAT (%)" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: JSON.parse(JSON.stringify(setting.value)) },
      create: {
        key: setting.key,
        value: JSON.parse(JSON.stringify(setting.value)),
        description: setting.description,
      },
    });
  }
  console.log("✅ Settings created:", settings.length);

  // Seed invoices
  await seedInvoices();

  // Seed payments
  await seedPayments();

  // Seed quotations
  await seedQuotations();

  console.log("\n🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
