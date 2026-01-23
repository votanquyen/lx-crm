/**
 * Import Bảng Kê from SQL Script - Direct Execution
 */
import "dotenv/config";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("📊 Import Bảng Kê 2026\n");

    const sqlPath = join(__dirname, "import-bang-ke-2026.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    console.log("SQL file length:", sql.length, "characters");
    console.log("Executing SQL script...\n");

    // Execute the entire SQL script
    const result = await pool.query(sql);

    console.log("✅ SQL executed successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

main();
