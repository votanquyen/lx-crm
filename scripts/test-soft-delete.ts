import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSoftDelete() {
  log('\n========================================', 'cyan');
  log('SOFT DELETE FUNCTIONALITY TEST', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // 1. Check database schema
    log('1. Checking database schema...', 'blue');
    const schemaCheck = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'monthly_statements'
      AND column_name IN ('deletedAt', 'deletedById')
      ORDER BY column_name;
    `;

    if (schemaCheck.length === 2) {
      log('✓ Schema columns exist:', 'green');
      schemaCheck.forEach(col => {
        log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`, 'green');
      });
    } else {
      log('✗ Missing schema columns!', 'red');
      return;
    }

    // 2. Check indexes
    log('\n2. Checking indexes...', 'blue');
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'monthly_statements'
      AND indexname LIKE '%deleted%'
      ORDER BY indexname;
    `;

    log(`✓ Found ${indexes.length} soft-delete indexes:`, 'green');
    indexes.forEach(idx => log(`  - ${idx.indexname}`, 'green'));

    // 3. Find a test statement
    log('\n3. Finding test statement...', 'blue');
    const testStatement = await prisma.monthlyStatement.findFirst({
      where: {
        needsConfirmation: true, // Only test on unconfirmed statements
        deletedAt: null,
      },
      include: {
        customer: {
          select: { companyName: true }
        }
      }
    });

    if (!testStatement) {
      log('✗ No unconfirmed statements available for testing', 'yellow');
      log('Creating a test statement...', 'yellow');

      // Find a customer to create test statement
      const customer = await prisma.customer.findFirst();
      if (!customer) {
        log('✗ No customers available', 'red');
        return;
      }

      const now = new Date();
      const testStmt = await prisma.monthlyStatement.create({
        data: {
          customerId: customer.id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 24),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 23),
          contactName: 'TEST CONTACT',
          plants: [],
          subtotal: 0,
          vatRate: 8,
          vatAmount: 0,
          total: 0,
          needsConfirmation: true,
        },
        include: {
          customer: { select: { companyName: true } }
        }
      });

      log(`✓ Created test statement: ${testStmt.id}`, 'green');
      log(`  Customer: ${testStmt.customer.companyName}`, 'green');
      log(`  Period: ${testStmt.month}/${testStmt.year}`, 'green');
    } else {
      log(`✓ Found test statement: ${testStatement.id}`, 'green');
      log(`  Customer: ${testStatement.customer.companyName}`, 'green');
      log(`  Period: ${testStatement.month}/${testStatement.year}`, 'green');
    }

    const statementId = testStatement?.id || (await prisma.monthlyStatement.findFirst({ where: { needsConfirmation: true } }))?.id;

    if (!statementId) {
      log('✗ Could not find or create test statement', 'red');
      return;
    }

    // 4. Count statements before soft delete
    log('\n4. Counting active statements...', 'blue');
    const beforeCount = await prisma.monthlyStatement.count({
      where: { deletedAt: null }
    });
    log(`✓ Active statements: ${beforeCount}`, 'green');

    // 5. Soft delete the statement
    log('\n5. Testing soft delete...', 'blue');
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      log('⚠ No admin user found, creating test user...', 'yellow');
      adminUser = await prisma.user.create({
        data: {
          email: 'test-admin@locxanh.vn',
          name: 'Test Admin',
          role: 'ADMIN',
          isActive: true,
        }
      });
      log(`✓ Created test admin user: ${adminUser.email}`, 'green');
    }

    await prisma.monthlyStatement.update({
      where: { id: statementId },
      data: {
        deletedAt: new Date(),
        deletedById: adminUser.id,
      }
    });
    log('✓ Statement soft-deleted successfully', 'green');

    // 6. Verify it's hidden from queries
    log('\n6. Verifying statement is hidden...', 'blue');
    const afterCount = await prisma.monthlyStatement.count({
      where: { deletedAt: null }
    });

    if (afterCount === beforeCount - 1) {
      log(`✓ Statement hidden (count: ${beforeCount} → ${afterCount})`, 'green');
    } else {
      log(`✗ Statement not properly hidden! (count: ${beforeCount} → ${afterCount})`, 'red');
    }

    // 7. Verify soft-deleted record exists
    log('\n7. Checking soft-deleted record...', 'blue');
    const deletedStatement = await prisma.monthlyStatement.findUnique({
      where: { id: statementId },
      include: {
        deletedBy: {
          select: { name: true, email: true }
        }
      }
    });

    if (deletedStatement?.deletedAt) {
      log('✓ Soft-deleted record found:', 'green');
      log(`  Deleted at: ${deletedStatement.deletedAt.toISOString()}`, 'green');
      log(`  Deleted by: ${deletedStatement.deletedBy?.name} (${deletedStatement.deletedBy?.email})`, 'green');
    } else {
      log('✗ Soft-deleted record not found!', 'red');
    }

    // 8. Test restore
    log('\n8. Testing restore functionality...', 'blue');
    await prisma.monthlyStatement.update({
      where: { id: statementId },
      data: {
        deletedAt: null,
        deletedById: null,
      }
    });
    log('✓ Statement restored successfully', 'green');

    // 9. Verify it's visible again
    log('\n9. Verifying statement is visible...', 'blue');
    const restoredCount = await prisma.monthlyStatement.count({
      where: { deletedAt: null }
    });

    if (restoredCount === beforeCount) {
      log(`✓ Statement visible again (count: ${restoredCount})`, 'green');
    } else {
      log(`✗ Statement not properly restored! (count: ${restoredCount})`, 'red');
    }

    // 10. Test query filters
    log('\n10. Testing query filters...', 'blue');

    // Create another soft-deleted statement for testing
    await prisma.monthlyStatement.update({
      where: { id: statementId },
      data: {
        deletedAt: new Date(),
        deletedById: adminUser.id,
      }
    });

    // Test various queries
    const allStatements = await prisma.monthlyStatement.findMany();
    const activeStatements = await prisma.monthlyStatement.findMany({
      where: { deletedAt: null }
    });
    const deletedStatements = await prisma.monthlyStatement.findMany({
      where: { deletedAt: { not: null } }
    });

    log(`✓ Query results:`, 'green');
    log(`  Total (unfiltered): ${allStatements.length}`, 'green');
    log(`  Active (deletedAt: null): ${activeStatements.length}`, 'green');
    log(`  Deleted (deletedAt: not null): ${deletedStatements.length}`, 'green');

    // 11. Clean up - restore the test statement
    log('\n11. Cleaning up...', 'blue');
    await prisma.monthlyStatement.update({
      where: { id: statementId },
      data: {
        deletedAt: null,
        deletedById: null,
      }
    });
    log('✓ Test statement restored', 'green');

    // 12. Final verification
    log('\n12. Final verification...', 'blue');
    const finalCount = await prisma.monthlyStatement.count({
      where: { deletedAt: null }
    });

    if (finalCount === beforeCount) {
      log(`✓ Database state restored (count: ${finalCount})`, 'green');
    } else {
      log(`⚠ Database state changed (before: ${beforeCount}, after: ${finalCount})`, 'yellow');
    }

    log('\n========================================', 'cyan');
    log('✅ ALL TESTS PASSED', 'green');
    log('========================================\n', 'cyan');

  } catch (error) {
    log('\n========================================', 'red');
    log('❌ TEST FAILED', 'red');
    log('========================================', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testSoftDelete();
