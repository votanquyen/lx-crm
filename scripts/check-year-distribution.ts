import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function checkYears() {
  try {
    console.log('\n=== Statement Distribution by Year ===\n');

    const byYear = await prisma.monthlyStatement.groupBy({
      by: ['year'],
      where: { deletedAt: null },
      _count: { id: true },
      orderBy: { year: 'desc' }
    });

    console.log('Active statements by year:');
    byYear.forEach(y => {
      console.log(`  ${y.year}: ${y._count.id} statements`);
    });

    console.log('\n=== Analysis ===');
    const currentYear = new Date().getFullYear();
    const currentYearCount = byYear.find(y => y.year === currentYear)?._count.id || 0;

    if (currentYearCount === 0) {
      console.log(`\n⚠️ WARNING: No statements for current year (${currentYear})!`);
      console.log('   User is seeing empty list because frontend defaults to current year.');
      console.log('\n✅ SOLUTION: Change year selector to a year that has data.');
    } else if (currentYearCount < 5) {
      console.log(`\n⚠️ WARNING: Only ${currentYearCount} statement(s) for current year (${currentYear}).`);
      console.log('   Most data is probably in previous years.');
    } else {
      console.log(`\n✅ Current year (${currentYear}) has ${currentYearCount} statements.`);
    }

    console.log('\n====================================\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYears();
