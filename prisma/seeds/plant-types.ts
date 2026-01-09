/**
 * Plant Types Seed Data
 * Sample plant types for development and testing
 */
import { PrismaClient } from "@prisma/client";
import { normalizeVietnamese } from "../../src/lib/utils";

const prisma = new PrismaClient();

const plantTypesData = [
  {
    code: "KT",
    name: "Cây Kim Tiền",
    category: "Indoor",
    description:
      "Cây cảnh văn phòng phổ biến, dễ chăm sóc, mang ý nghĩa tài lộc. Lá xanh bóng, thân cứng cáp.",
    sizeSpec: "Cao 60-80cm, Chậu 25cm",
    heightMin: 60,
    heightMax: 80,
    potDiameter: 25,
    rentalPrice: 50000,
    depositPrice: 100000,
    salePrice: 200000,
    replacementPrice: 150000,
    avgLifespanDays: 90,
    wateringFrequency: "2 lần/tuần",
    lightRequirement: "Ánh sáng gián tiếp",
    temperatureRange: "18-28°C",
    careLevel: "Easy" as const,
    careInstructions:
      "Tưới nước đều đặn, tránh úng. Đặt nơi thoáng mát, có ánh sáng gián tiếp. Bón phân 1 lần/tháng.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "PT",
    name: "Cây Phát Tài",
    category: "Indoor",
    description: "Cây phong thủy mang lại may mắn, tài lộc. Lá to màu xanh đậm, thân to khỏe.",
    sizeSpec: "Cao 1.2-1.5m, Chậu 35cm",
    heightMin: 120,
    heightMax: 150,
    potDiameter: 35,
    rentalPrice: 80000,
    depositPrice: 150000,
    salePrice: 350000,
    replacementPrice: 250000,
    avgLifespanDays: 120,
    wateringFrequency: "3 lần/tuần",
    lightRequirement: "Ánh sáng trung bình",
    temperatureRange: "20-30°C",
    careLevel: "Easy" as const,
    careInstructions:
      "Thích môi trường ẩm, tưới nước thường xuyên. Lau lá định kỳ. Tránh ánh nắng trực tiếp.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "LA",
    name: "Cây Lan Ý",
    category: "Indoor",
    description:
      "Cây cảnh cao cấp, thanh lịch. Lá dài mảnh màu xanh tươi, phù hợp văn phòng, hội trường.",
    sizeSpec: "Cao 1.5-1.8m, Chậu 40cm",
    heightMin: 150,
    heightMax: 180,
    potDiameter: 40,
    rentalPrice: 100000,
    depositPrice: 200000,
    salePrice: 450000,
    replacementPrice: 300000,
    avgLifespanDays: 90,
    wateringFrequency: "2-3 lần/tuần",
    lightRequirement: "Ánh sáng yếu đến trung bình",
    temperatureRange: "18-25°C",
    careLevel: "Medium" as const,
    careInstructions: "Giữ đất ẩm đều, không để khô. Phun sương lên lá. Tránh gió lạnh trực tiếp.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "VT",
    name: "Cây Vạn Tuế",
    category: "Indoor",
    description:
      "Cây thuỷ sinh dễ trồng, có thể để trong nước hoặc đất. Thân xanh mọng nước, lá dày.",
    sizeSpec: "Cao 30-50cm, Chậu 20cm",
    heightMin: 30,
    heightMax: 50,
    potDiameter: 20,
    rentalPrice: 35000,
    depositPrice: 70000,
    salePrice: 120000,
    replacementPrice: 80000,
    avgLifespanDays: 60,
    wateringFrequency: "Hằng ngày (nếu trồng đất)",
    lightRequirement: "Ánh sáng yếu",
    temperatureRange: "15-30°C",
    careLevel: "Easy" as const,
    careInstructions:
      "Có thể trồng thuỷ canh hoặc đất. Giữ môi trường ẩm. Cắt tỉa thường xuyên để giữ dáng.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "TT",
    name: "Cây Thiết Thụ",
    category: "Indoor",
    description:
      "Cây cảnh độc đáo, lá hình giọt nước màu xanh đậm. Chịu bóng tốt, phù hợp văn phòng.",
    sizeSpec: "Cao 40-60cm, Chậu 25cm",
    heightMin: 40,
    heightMax: 60,
    potDiameter: 25,
    rentalPrice: 45000,
    depositPrice: 90000,
    salePrice: 180000,
    replacementPrice: 120000,
    avgLifespanDays: 75,
    wateringFrequency: "1-2 lần/tuần",
    lightRequirement: "Ánh sáng yếu đến trung bình",
    temperatureRange: "18-28°C",
    careLevel: "Easy" as const,
    careInstructions: "Chịu bóng rất tốt. Tưới ít, tránh úng nước. Lau lá định kỳ để giữ bóng.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "RP",
    name: "Cây Rơi Phượng",
    category: "Outdoor",
    description:
      "Cây hoa cảnh ngoài trời, hoa màu đỏ rực rỡ. Thích hợp trang trí sân vườn, ban công.",
    sizeSpec: "Cao 80-120cm, Chậu 35cm",
    heightMin: 80,
    heightMax: 120,
    potDiameter: 35,
    rentalPrice: 70000,
    depositPrice: 140000,
    salePrice: 300000,
    replacementPrice: 200000,
    avgLifespanDays: 90,
    wateringFrequency: "Hằng ngày",
    lightRequirement: "Nắng trực tiếp",
    temperatureRange: "22-35°C",
    careLevel: "Medium" as const,
    careInstructions:
      "Cần nhiều nắng để ra hoa. Tưới nước đều đặn. Bón phân định kỳ. Cắt tỉa cành khô.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "TB",
    name: "Cây Trúc Bách Hợp",
    category: "Indoor",
    description:
      "Cây cảnh cao cấp, thân xanh đẹp mắt. Mang lại sự thanh tao, tươi mát cho không gian.",
    sizeSpec: "Cao 1.0-1.3m, Chậu 30cm",
    heightMin: 100,
    heightMax: 130,
    potDiameter: 30,
    rentalPrice: 60000,
    depositPrice: 120000,
    salePrice: 250000,
    replacementPrice: 180000,
    avgLifespanDays: 100,
    wateringFrequency: "2 lần/tuần",
    lightRequirement: "Ánh sáng trung bình",
    temperatureRange: "20-28°C",
    careLevel: "Easy" as const,
    careInstructions: "Giữ đất ẩm vừa phải. Tránh nắng gắt. Phun sương lên lá khi trời khô.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "XD",
    name: "Cây Xương Rồng",
    category: "Indoor",
    description:
      "Cây sa mạc chịu hạn tốt, ít cần chăm sóc. Hình dáng độc đáo, nhiều loại khác nhau.",
    sizeSpec: "Cao 20-40cm, Chậu 15cm",
    heightMin: 20,
    heightMax: 40,
    potDiameter: 15,
    rentalPrice: 25000,
    depositPrice: 50000,
    salePrice: 80000,
    replacementPrice: 60000,
    avgLifespanDays: 120,
    wateringFrequency: "1 lần/2 tuần",
    lightRequirement: "Nắng trực tiếp",
    temperatureRange: "18-35°C",
    careLevel: "Easy" as const,
    careInstructions:
      "Tưới ít, chỉ khi đất khô hoàn toàn. Cần nhiều ánh sáng. Trồng trong đất thoát nước tốt.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "SN",
    name: "Cây Sen Đá",
    category: "Indoor",
    description: "Cây mọng nước nhỏ xinh, nhiều màu sắc. Dễ trồng, phù hợp trang trí bàn làm việc.",
    sizeSpec: "Cao 10-15cm, Chậu 12cm",
    heightMin: 10,
    heightMax: 15,
    potDiameter: 12,
    rentalPrice: 20000,
    depositPrice: 40000,
    salePrice: 60000,
    replacementPrice: 45000,
    avgLifespanDays: 90,
    wateringFrequency: "1 lần/tuần",
    lightRequirement: "Ánh sáng trung bình đến mạnh",
    temperatureRange: "15-30°C",
    careLevel: "Easy" as const,
    careInstructions:
      "Tưới ít, tránh úng. Đất cần thoát nước tốt. Có thể để nắng nhẹ hoặc trong nhà sáng.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    code: "BD",
    name: "Cây Bạch Đàn",
    category: "Outdoor",
    description: "Cây thơm mát, lá có tinh dầu. Phù hợp trồng ngoài trời, tạo bóng mát.",
    sizeSpec: "Cao 1.5-2.0m, Chậu 50cm",
    heightMin: 150,
    heightMax: 200,
    potDiameter: 50,
    rentalPrice: 120000,
    depositPrice: 250000,
    salePrice: 500000,
    replacementPrice: 350000,
    avgLifespanDays: 120,
    wateringFrequency: "Hằng ngày",
    lightRequirement: "Nắng đầy đủ",
    temperatureRange: "20-35°C",
    careLevel: "Medium" as const,
    careInstructions:
      "Cần nhiều nước và nắng. Tỉa cành định kỳ. Phù hợp trồng sân vườn, ban công lớn.",
    imageUrl: null,
    thumbnailUrl: null,
    isActive: true,
  },
];

export async function seedPlantTypes() {
  console.log("🌱 Seeding plant types...");

  for (const data of plantTypesData) {
    // Check if plant type already exists
    const existing = await prisma.plantType.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      console.log(`  ⏭️  Plant type ${data.code} already exists, skipping...`);
      continue;
    }

    // Create plant type with inventory
    const plantType = await prisma.plantType.create({
      data: {
        ...data,
        nameNormalized: normalizeVietnamese(data.name),
        inventory: {
          create: {
            totalStock: Math.floor(Math.random() * 50) + 10, // Random 10-60
            availableStock: Math.floor(Math.random() * 30) + 5, // Random 5-35
            rentedStock: Math.floor(Math.random() * 15), // Random 0-15
            reservedStock: 0,
            damagedStock: Math.floor(Math.random() * 3), // Random 0-3
            maintenanceStock: Math.floor(Math.random() * 2), // Random 0-2
            lowStockThreshold: 5,
            reorderPoint: 10,
            reorderQuantity: 20,
          },
        },
      },
    });

    console.log(`  ✅ Created plant type: ${plantType.code} - ${plantType.name}`);
  }

  console.log("✨ Plant types seeded successfully!");
}

// Run if called directly
if (require.main === module) {
  seedPlantTypes()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
