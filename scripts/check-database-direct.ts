import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function checkDatabase() {
  try {
    console.log('\n=== Direct Database Check ===\n');

    // Count statements
    const activeCount = await prisma.monthlyStatement.count({
      where: { deletedAt: null }
    });
    console.log('1. Active statements (deletedAt: null):', activeCount);

    const totalCount = await prisma.monthlyStatement.count();
    console.log('2. Total statements:', totalCount);

    const deletedCount = await prisma.monthlyStatement.count({
      where: { deletedAt: { not: null } }
    });
    console.log('3. Deleted statements:', deletedCount);

    // Check year 2026
    const year2026Active = await prisma.monthlyStatement.count({
      where: { year: 2026, deletedAt: null }
    });
    console.log('\n4. Year 2026 active statements:', year2026Active);

    // Get sample data
    if (year2026Active > 0) {
      const samples = await prisma.monthlyStatement.findMany({
        where: { year: 2026, deletedAt: null },
        select: {
          id: true,
          month: true,
          year: true,
          customerId: true,
          needsConfirmation: true,
          customer: {
            select: { companyName: true }
          }
        },
        take: 5,
        orderBy: { month: 'desc' }
      });

      console.log('\n5. Sample statements (Year 2026):');
      samples.forEach((stmt, idx) => {
        console.log(`   ${idx + 1}. ${stmt.customer.companyName}`);
        console.log(`      Period: ${stmt.month}/${stmt.year}`);
        console.log(`      Needs confirmation: ${stmt.needsConfirmation}`);
        console.log(`      ID: ${stmt.id}`);
      });
    }

    // Check if any have deletedAt set
    const withDeletedAt = await prisma.monthlyStatement.findMany({
      where: {
        deletedAt: { not: null }
      },
      select: {
        id: true,
        month: true,
        year: true,
        deletedAt: true,
        customer: {
          select: { companyName: true }
        }
      },
      take: 3
    });

    if (withDeletedAt.length > 0) {
      console.log('\n6. Soft-deleted statements found:');
      withDeletedAt.forEach((stmt, idx) => {
        console.log(`   ${idx + 1}. ${stmt.customer.companyName}`);
        console.log(`      Period: ${stmt.month}/${stmt.year}`);
        console.log(`      Deleted at: ${stmt.deletedAt?.toISOString()}`);
      });
    } else {
      console.log('\n6. No soft-deleted statements found');
    }

    console.log('\n=== Check Complete ===\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
