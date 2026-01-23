import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BangKeClient } from "@/components/bang-ke/bang-ke-client";
import {
  getMonthlyStatements,
  getCustomersForStatements,
  getAvailableYearMonths,
} from "@/actions/monthly-statements";

/**
 * Bang-ke (Monthly Statement) Page - Server Component
 *
 * Fetches initial data on server for faster first paint:
 * - Available years with statement counts
 * - Customer list for sidebar
 * - Statements for the default year
 *
 * Client component handles interactive state management.
 */

// Loading skeleton for Suspense fallback
function BangKeLoadingSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar Skeleton */}
      <div className="flex h-full w-80 flex-col border-r bg-white">
        <div className="sticky top-0 z-10 border-b bg-white/95 p-5">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-9 w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="flex-1 space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  );
}

// Server data fetching component
async function BangKeData() {
  // Determine default year: try localStorage pattern or use current year
  const currentYear = new Date().getFullYear();

  // Fetch initial data in parallel on server
  const [yearMonthsResult, customersResult, statementsResult] = await Promise.all([
    getAvailableYearMonths({}),
    getCustomersForStatements({}),
    getMonthlyStatements({
      year: currentYear,
      limit: 500,
      offset: 0,
    }),
  ]);

  // Process available years
  let availableYears: Array<{ year: number; count: number }> = [];
  let initialYear = currentYear;

  if (yearMonthsResult.success && yearMonthsResult.data) {
    // Group by year and sum counts
    const yearCounts = yearMonthsResult.data.reduce(
      (acc, item) => {
        const existing = acc.find((y) => y.year === item.year);
        if (existing) {
          existing.count += item.count;
        } else {
          acc.push({ year: item.year, count: item.count });
        }
        return acc;
      },
      [] as Array<{ year: number; count: number }>
    );

    yearCounts.sort((a, b) => b.year - a.year);
    availableYears = yearCounts;

    // Smart default: use year with most data, or current year
    const yearWithMostData =
      yearCounts.length > 0
        ? yearCounts.reduce((max, y) => (y.count > max.count ? y : max))
        : null;

    initialYear = yearWithMostData?.year || currentYear;
  }

  // If initialYear differs from currentYear, fetch statements for that year
  let initialStatements = statementsResult.success && statementsResult.data
    ? statementsResult.data.items || []
    : [];

  if (initialYear !== currentYear) {
    const correctYearStatements = await getMonthlyStatements({
      year: initialYear,
      limit: 500,
      offset: 0,
    });
    if (correctYearStatements.success && correctYearStatements.data) {
      initialStatements = correctYearStatements.data.items || [];
    }
  }

  // Process customers
  const initialCustomers =
    customersResult.success && customersResult.data ? customersResult.data : [];

  return (
    <BangKeClient
      initialCustomers={initialCustomers}
      initialStatements={initialStatements}
      initialYears={availableYears}
      initialYear={initialYear}
    />
  );
}

// Page component with Suspense boundary
export default function BangKePage() {
  return (
    <Suspense fallback={<BangKeLoadingSkeleton />}>
      <BangKeData />
    </Suspense>
  );
}
