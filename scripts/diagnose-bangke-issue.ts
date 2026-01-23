import 'dotenv/config';
import { getMonthlyStatements } from '../src/actions/monthly-statements';

async function diagnose() {
  console.log('\n=== Diagnosing Bang-Ke Issue ===\n');

  try {
    // Test the action directly
    console.log('1. Testing getMonthlyStatements action...');
    const result = await getMonthlyStatements({
      year: 2026,
      limit: 500,
      offset: 0,
    });

    console.log('Action result:', {
      success: result.success,
      hasData: !!result.data,
      itemCount: result.data?.items?.length || 0,
      total: result.data?.total,
    });

    if (result.success && result.data) {
      console.log('\n2. Statement details:');
      console.log('   Total:', result.data.total);
      console.log('   Items returned:', result.data.items.length);

      if (result.data.items.length > 0) {
        console.log('\n3. Sample statements:');
        result.data.items.slice(0, 3).forEach((stmt, idx) => {
          console.log(`   ${idx + 1}. ${stmt.companyName} - ${stmt.month}/${stmt.year}`);
        });
      } else {
        console.log('\n❌ No statements returned! Checking database...');

        const { prisma } = await import('../src/lib/prisma');
        const dbCount = await prisma.monthlyStatement.count({
          where: { deletedAt: null }
        });
        console.log('   Database count (deletedAt: null):', dbCount);

        const year2026 = await prisma.monthlyStatement.count({
          where: { year: 2026, deletedAt: null }
        });
        console.log('   Year 2026 count:', year2026);

        if (year2026 > 0) {
          console.log('\n   ⚠️ Statements exist but not returned by action!');
          console.log('   Possible causes:');
          console.log('   - Prisma client needs regeneration');
          console.log('   - Server needs restart');
          console.log('   - Cache issue');
        }
      }
    } else {
      console.log('\n❌ Action failed!');
      console.log('Error:', result.error);
    }

    console.log('\n=== Diagnosis Complete ===\n');
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
  }
}

diagnose();
