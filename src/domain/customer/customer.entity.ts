/**
 * Customer Entity
 * Domain entity with protected invariants and business rule enforcement
 *
 * Key principles:
 * - Private constructor forces use of factory methods
 * - State changes only through defined methods
 * - No framework dependencies
 */
import {
  CustomerProps,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerStatus,
  STATUS_TRANSITIONS,
  MutableCustomerProps,
} from "./customer.types";
import { InvalidCustomerError, InvalidStatusTransitionError } from "./customer.errors";

/**
 * Normalize Vietnamese text for search matching
 * Removes diacritics and converts to lowercase
 */
function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Customer aggregate root
 */
export class Customer {
  private _props: CustomerProps;

  private constructor(props: CustomerProps) {
    this._props = props;
  }

  // ============ Getters (immutable access) ============

  get id(): string {
    return this._props.id;
  }
  get code(): string {
    return this._props.code;
  }
  get companyName(): string {
    return this._props.companyName;
  }
  get companyNameNorm(): string {
    return this._props.companyNameNorm;
  }
  get address(): string {
    return this._props.address;
  }
  get addressNorm(): string | undefined {
    return this._props.addressNorm;
  }
  get district(): string | undefined {
    return this._props.district;
  }
  get city(): string {
    return this._props.city;
  }
  get contactName(): string | undefined {
    return this._props.contactName;
  }
  get contactPhone(): string | undefined {
    return this._props.contactPhone;
  }
  get contactEmail(): string | undefined {
    return this._props.contactEmail;
  }
  get taxCode(): string | undefined {
    return this._props.taxCode;
  }
  get latitude(): number | undefined {
    return this._props.latitude;
  }
  get longitude(): number | undefined {
    return this._props.longitude;
  }
  get status(): CustomerStatus {
    return this._props.status;
  }
  get createdAt(): Date {
    return this._props.createdAt;
  }
  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ============ Factory Methods ============

  /**
   * Create a new customer with validation
   * @param input - Customer creation input
   * @param id - Pre-generated CUID
   * @param code - Pre-generated customer code (KH-XXXX)
   */
  static create(input: CreateCustomerInput, id: string, code: string): Customer {
    // Validate required fields
    if (!input.companyName || input.companyName.trim().length < 2) {
      throw new InvalidCustomerError("Tên công ty phải có ít nhất 2 ký tự");
    }
    if (input.companyName.length > 255) {
      throw new InvalidCustomerError("Tên công ty tối đa 255 ký tự");
    }
    if (!input.address || input.address.trim().length < 5) {
      throw new InvalidCustomerError("Địa chỉ phải có ít nhất 5 ký tự");
    }

    const now = new Date();
    const companyName = input.companyName.trim();
    const address = input.address.trim();

    return new Customer({
      id,
      code,
      companyName,
      companyNameNorm: normalizeVietnamese(companyName),
      address,
      addressNorm: normalizeVietnamese(address),
      district: input.district?.trim(),
      city: input.city?.trim() ?? "TP.HCM",
      contactName: input.contactName?.trim(),
      contactPhone: input.contactPhone?.trim(),
      contactEmail: input.contactEmail?.trim(),
      taxCode: input.taxCode?.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      status: input.status ?? "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct entity from persistence layer
   * No validation - trusts persisted data
   */
  static fromPersistence(props: CustomerProps): Customer {
    return new Customer(props);
  }

  // ============ Business Methods ============

  /**
   * Update customer fields
   * Only provided fields are updated
   */
  update(input: UpdateCustomerInput): void {
    const updates: Partial<MutableCustomerProps> = {};

    if (input.companyName !== undefined) {
      const name = input.companyName.trim();
      if (name.length < 2) {
        throw new InvalidCustomerError("Tên công ty phải có ít nhất 2 ký tự");
      }
      updates.companyName = name;
      updates.companyNameNorm = normalizeVietnamese(name);
    }

    if (input.address !== undefined) {
      const addr = input.address.trim();
      if (addr.length < 5) {
        throw new InvalidCustomerError("Địa chỉ phải có ít nhất 5 ký tự");
      }
      updates.address = addr;
      updates.addressNorm = normalizeVietnamese(addr);
    }

    if (input.district !== undefined) updates.district = input.district?.trim();
    if (input.city !== undefined) updates.city = input.city?.trim() ?? "TP.HCM";
    if (input.contactName !== undefined) updates.contactName = input.contactName?.trim();
    if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone?.trim();
    if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail?.trim();
    if (input.taxCode !== undefined) updates.taxCode = input.taxCode?.trim();
    if (input.latitude !== undefined) updates.latitude = input.latitude;
    if (input.longitude !== undefined) updates.longitude = input.longitude;

    this._props = {
      ...this._props,
      ...updates,
      updatedAt: new Date(),
    };
  }

  /**
   * Transition to ACTIVE status
   */
  activate(): void {
    this.transitionTo("ACTIVE");
  }

  /**
   * Transition to INACTIVE status
   */
  deactivate(): void {
    this.transitionTo("INACTIVE");
  }

  /**
   * Transition to TERMINATED status (soft delete)
   */
  terminate(): void {
    this.transitionTo("TERMINATED");
  }

  /**
   * Check if customer can be terminated
   * (business rule: no active contracts)
   */
  canTerminate(hasActiveContracts: boolean): boolean {
    if (this._props.status === "TERMINATED") return false;
    return !hasActiveContracts;
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(targetStatus: CustomerStatus): boolean {
    const allowed = STATUS_TRANSITIONS[this._props.status];
    return allowed.includes(targetStatus);
  }

  // ============ Persistence ============

  /**
   * Export entity state for persistence
   */
  toPersistence(): CustomerProps {
    return { ...this._props };
  }

  // ============ Private Helpers ============

  private transitionTo(targetStatus: CustomerStatus): void {
    if (!this.canTransitionTo(targetStatus)) {
      throw new InvalidStatusTransitionError(this._props.status, targetStatus);
    }
    this._props = {
      ...this._props,
      status: targetStatus,
      updatedAt: new Date(),
    };
  }
}
