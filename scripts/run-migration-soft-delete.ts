import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('Running soft delete migration...');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

    const migrationSQL = readFileSync(
      join(__dirname, '../prisma/migrations/20260119_add_soft_delete_to_monthly_statements/migration.sql'),
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await prisma.$executeRawUnsafe(statement);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
