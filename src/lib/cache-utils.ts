/**
 * Cache Invalidation Utilities
 * Centralized revalidation helpers for consistent cache management
 */
import { revalidatePath, revalidateTag } from "next/cache";

// ========================================
// Cache Tags (for unstable_cache)
// ========================================

export const CACHE_TAGS = {
  CUSTOMERS_LIST: "customers-list",
  INVOICES_LIST: "invoices-list",
  CARE_SCHEDULES: "care-schedules",
  EXCHANGES_LIST: "exchanges-list",
} as const;

/** Invalidate customer search cache */
export function invalidateCustomerCache() {
  revalidateTag(CACHE_TAGS.CUSTOMERS_LIST, "max");
}

// ========================================
// Path Revalidation (for page cache)
// ========================================

/**
 * Revalidate customer-related paths
 */
export function revalidateCustomer(customerId: string) {
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}

/**
 * Revalidate contract-related paths
 */
export function revalidateContract(contractId: string, customerId?: string) {
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");
  if (customerId) {
    revalidateCustomer(customerId);
  }
}

/**
 * Revalidate invoice-related paths
 */
export function revalidateInvoice(invoiceId: string, customerId?: string, contractId?: string) {
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  if (customerId) {
    revalidateCustomer(customerId);
  }
  if (contractId) {
    revalidatePath(`/contracts/${contractId}`);
  }
}

/**
 * Revalidate quotation-related paths
 */
export function revalidateQuotation(quotationId: string, customerId?: string) {
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/quotations");
  if (customerId) {
    revalidateCustomer(customerId);
  }
}

/**
 * Revalidate care schedule paths
 */
export function revalidateCare(customerId?: string) {
  revalidatePath("/care");
  if (customerId) {
    revalidateCustomer(customerId);
  }
}

/**
 * Revalidate exchange schedule paths
 */
export function revalidateExchange() {
  revalidatePath("/exchanges");
  revalidatePath("/exchanges/daily-schedule");
}

/**
 * Revalidate payment-related paths
 */
export function revalidatePayment(invoiceId?: string, customerId?: string) {
  revalidatePath("/payments");
  if (invoiceId) {
    revalidatePath(`/invoices/${invoiceId}`);
  }
  if (customerId) {
    revalidateCustomer(customerId);
  }
}

/**
 * Revalidate dashboard/analytics paths
 */
export function revalidateDashboard() {
  revalidatePath("/");
  revalidatePath("/analytics");
}

/**
 * Revalidate all related paths after major data changes
 */
export function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath("/contracts");
  revalidatePath("/invoices");
  revalidatePath("/quotations");
  revalidatePath("/care");
  revalidatePath("/exchanges");
  revalidatePath("/payments");
  revalidatePath("/analytics");
}
