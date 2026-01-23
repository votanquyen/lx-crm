/**
 * Customer Domain Types
 * Framework-agnostic type definitions for Customer aggregate
 */

/** Customer status lifecycle */
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE" | "TERMINATED";

/** Customer value tier for pricing/service levels */
export type CustomerTier = "REGULAR" | "SILVER" | "GOLD" | "PLATINUM" | "VIP";

/**
 * Core customer properties (immutable representation)
 */
export interface CustomerProps {
  readonly id: string;
  readonly code: string;
  readonly companyName: string;
  readonly companyNameNorm: string;
  readonly address: string;
  readonly addressNorm?: string;
  readonly district?: string;
  readonly city: string;
  readonly contactName?: string;
  readonly contactPhone?: string;
  readonly contactEmail?: string;
  readonly taxCode?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly status: CustomerStatus;
  readonly tier?: CustomerTier;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Input for creating a new customer
 */
export interface CreateCustomerInput {
  companyName: string;
  address: string;
  district?: string;
  city?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  taxCode?: string;
  latitude?: number;
  longitude?: number;
  status?: CustomerStatus;
}

/**
 * Input for updating an existing customer
 */
export interface UpdateCustomerInput {
  companyName?: string;
  address?: string;
  district?: string;
  city?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  taxCode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Mutable version of CustomerProps for internal entity updates
 */
export type MutableCustomerProps = {
  -readonly [K in keyof CustomerProps]: CustomerProps[K];
};

/**
 * Valid status transitions map
 * Key = current status, Value = allowed target statuses
 */
export const STATUS_TRANSITIONS: Record<CustomerStatus, CustomerStatus[]> = {
  LEAD: ["ACTIVE", "TERMINATED"],
  ACTIVE: ["INACTIVE", "TERMINATED"],
  INACTIVE: ["ACTIVE", "TERMINATED"],
  TERMINATED: [], // Terminal state - no transitions allowed
};
