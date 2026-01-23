/**
 * Customer Repository Port (Interface)
 * Defines the contract for customer persistence operations
 *
 * This is a "port" in hexagonal architecture terminology.
 * Implementation (adapter) will be in infrastructure layer.
 */
import { Customer } from "./customer.entity";
import { CustomerStatus } from "./customer.types";

/**
 * Search/filter parameters for customer queries
 */
export interface CustomerSearchQuery {
  /** Fuzzy search term (Vietnamese normalized) */
  search?: string;
  /** Filter by status */
  status?: CustomerStatus;
  /** Filter by district */
  district?: string;
  /** Filter customers with outstanding debt */
  hasDebt?: boolean;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: "companyName" | "createdAt" | "updatedAt" | "code";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated result container
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Customer Repository Port
 * Interface for customer persistence operations
 */
export interface CustomerRepository {
  /**
   * Find customer by ID
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Find customer by code (e.g., KH-0001)
   */
  findByCode(code: string): Promise<Customer | null>;

  /**
   * Find customer by normalized company name
   * Used for duplicate detection
   */
  findByNormalizedName(nameNorm: string, excludeId?: string): Promise<Customer | null>;

  /**
   * Save customer (create or update)
   */
  save(customer: Customer): Promise<void>;

  /**
   * Search customers with pagination
   */
  search(query: CustomerSearchQuery): Promise<PaginatedResult<Customer>>;

  /**
   * Generate next sequential customer code
   */
  generateNextCode(): Promise<string>;

  /**
   * Check if customer has active contracts
   */
  hasActiveContracts(customerId: string): Promise<boolean>;
}
