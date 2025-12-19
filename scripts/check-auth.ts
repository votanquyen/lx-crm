/**
 * Check authentication setup
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Checking authentication setup...\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  console.log(`👥 Total users: ${users.length}\n`);

  if (users.length === 0) {
    console.log("⚠️  No users found in database!");
    console.log("\n💡 The system uses Google OAuth for authentication.");
    console.log("   You need to:");
    console.log("   1. Set up Google OAuth credentials in .env");
    console.log("   2. Sign in with a Google account");
    console.log("   3. The first user will be created automatically\n");
  } else {
    console.log("Users in database:");
    users.forEach((u) => {
      console.log(`  ✅ ${u.email} (${u.role})`);
      console.log(`     Name: ${u.name || "N/A"}`);
      console.log(`     Created: ${u.createdAt.toLocaleString("vi-VN")}\n`);
    });
  }

  // Check if .env has Google OAuth configured
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your-google-client-id") {
    console.log("\n⚠️  Google OAuth is NOT configured!");
    console.log("   Configure these in your .env file:");
    console.log("   - GOOGLE_CLIENT_ID");
    console.log("   - GOOGLE_CLIENT_SECRET");
    console.log("   - AUTH_SECRET");
    console.log("\n   See .env.example for details\n");
  } else {
    console.log("\n✅ Google OAuth is configured");
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
