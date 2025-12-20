import type { PlantItem, StatementPeriod } from "@/types/monthly-statement";

/**
 * Calculate period dates for a given year/month
 * Period: 24th of previous month → 23rd of current month
 *
 * @example
 * calculateStatementPeriod(2025, 7)
 * // Returns: { periodStart: Date(2025-06-24), periodEnd: Date(2025-07-23) }
 */
export function calculateStatementPeriod(
  year: number,
  month: number
): StatementPeriod {
  // Calculate previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  // periodStart: 24th of previous month
  const periodStart = new Date(prevYear, prevMonth - 1, 24);

  // periodEnd: 23rd of current month
  const periodEnd = new Date(year, month - 1, 23);

  return {
    year,
    month,
    periodStart,
    periodEnd,
  };
}

/**
 * Calculate subtotal from plant items
 */
export function calculateSubtotal(plants: PlantItem[]): number {
  return plants.reduce((sum, plant) => sum + plant.total, 0);
}

/**
 * Calculate VAT amount (default 8%)
 */
export function calculateVAT(subtotal: number, vatRate: number = 8): number {
  return Math.round(subtotal * (vatRate / 100));
}

/**
 * Calculate total (subtotal + VAT)
 */
export function calculateTotal(subtotal: number, vatAmount: number): number {
  return subtotal + vatAmount;
}

/**
 * Validate plant item structure and calculations
 */
export function validatePlantItem(item: unknown): item is PlantItem {
  if (typeof item !== "object" || item === null) return false;

  const plant = item as PlantItem;

  return (
    typeof plant.id === "string" &&
    typeof plant.name === "string" &&
    typeof plant.sizeSpec === "string" &&
    typeof plant.quantity === "number" &&
    typeof plant.unitPrice === "number" &&
    typeof plant.total === "number" &&
    plant.quantity > 0 &&
    plant.unitPrice >= 0 &&
    plant.total === plant.quantity * plant.unitPrice
  );
}

/**
 * Format period label for display
 * @example "24/06/2025 → 23/07/2025"
 */
export function formatPeriodLabel(
  periodStart: Date,
  periodEnd: Date
): string {
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return `${formatDate(periodStart)} → ${formatDate(periodEnd)}`;
}

/**
 * Get previous month/year
 */
export function getPreviousMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Get next month/year
 */
export function getNextMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Calculate plant item total
 */
export function calculatePlantTotal(
  quantity: number,
  unitPrice: number
): number {
  return quantity * unitPrice;
}

/**
 * Recalculate all amounts from plant items
 */
export function recalculateStatementAmounts(
  plants: PlantItem[],
  vatRate: number = 8
): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  const subtotal = calculateSubtotal(plants);
  const vatAmount = calculateVAT(subtotal, vatRate);
  const total = calculateTotal(subtotal, vatAmount);

  return { subtotal, vatAmount, total };
}

/**
 * Format month label in Vietnamese
 * @example formatMonthLabel(7) => "Tháng 7"
 */
export function formatMonthLabel(month: number): string {
  return `Tháng ${month}`;
}

/**
 * Get month short label
 * @example getMonthShort(7) => "T7"
 */
export function getMonthShort(month: number): string {
  return `T${month}`;
}

/**
 * Check if a date is in the future
 */
export function isFutureMonth(year: number, month: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) return true;
  if (year === currentYear && month > currentMonth) return true;
  return false;
}
