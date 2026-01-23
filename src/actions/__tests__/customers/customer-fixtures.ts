/**
 * Customer Test Fixtures
 * Factory functions for generating customer test data
 */
import type { Customer, CustomerStatus } from "@prisma/client";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validations/customer";

// Counter for unique codes
let customerCodeCounter = 1;

/**
 * Reset counter between test suites
 */
export function resetCustomerCodeCounter(): void {
  customerCodeCounter = 1;
}

/**
 * Generate unique customer code
 */
export function generateCustomerCode(): string {
  return `KH-${String(customerCodeCounter++).padStart(4, "0")}`;
}

/**
 * Valid Vietnamese company names for testing
 */
export const VALID_COMPANY_NAMES = {
  standard: "Công ty TNHH ABC",
  withDiacritics: "Công ty Cổ phần Đầu tư Phát triển Việt Nam",
  withSpecialChars: "Công ty TNHH MTV Lộc Xanh (HCM)",
  english: "Green Tech Solutions Vietnam Co., Ltd",
  mixed: "Công ty TNHH ABC Trading & Services",
};

/**
 * Valid Vietnamese addresses for testing
 */
export const VALID_ADDRESSES = {
  full: "123 Nguyễn Văn Linh, Phường Tân Thuận Tây, Quận 7, TP.HCM",
  noDistrict: "456 Lê Văn Việt, TP.HCM",
  withBuilding: "Tầng 5, Tòa nhà Bitexco, 2 Hải Triều, Quận 1, TP.HCM",
  simple: "789 Đường ABC, Quận 3",
};

/**
 * Valid phone numbers for testing
 */
export const VALID_PHONES = {
  mobile10: "0912345678",
  mobile11: "09123456789",
  withPlus84: "+84912345678",
  landline: "02812345678",
};

/**
 * Invalid inputs for edge case testing
 */
export const INVALID_INPUTS = {
  emptyCompanyName: "",
  tooLongCompanyName: "A".repeat(256),
  invalidPhone: "123",
  invalidEmail: "not-an-email",
  xssAttempt: '<script>alert("xss")</script>',
  sqlInjection: "'; DROP TABLE customers; --",
};

/**
 * Create valid customer input for create action
 */
export function createValidCustomerInput(
  overrides: Partial<CreateCustomerInput> = {}
): CreateCustomerInput {
  return {
    companyName: VALID_COMPANY_NAMES.standard,
    address: VALID_ADDRESSES.full,
    district: "Quận 7",
    city: "TP.HCM",
    contactName: "Nguyễn Văn A",
    contactPhone: VALID_PHONES.mobile10,
    contactEmail: "contact@company.vn",
    taxCode: "0123456789",
    status: "ACTIVE",
    latitude: 10.7285,
    longitude: 106.7114,
    ...overrides,
  };
}

/**
 * Create valid update input
 */
export function createValidUpdateInput(
  id: string,
  overrides: Partial<Omit<UpdateCustomerInput, "id">> = {}
): UpdateCustomerInput {
  return {
    id,
    ...overrides,
  };
}

/**
 * Create mock customer object (as returned from Prisma)
 */
export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  const now = new Date();
  const code = generateCustomerCode();

  return {
    id: `cuid_${code}`,
    code,
    companyName: VALID_COMPANY_NAMES.standard,
    companyNameNorm: "cong ty tnhh abc",
    shortName: null,
    taxCode: "0123456789",
    businessType: null,
    address: VALID_ADDRESSES.full,
    addressNormalized: "123 nguyen van linh phuong tan thuan tay quan 7 tp hcm",
    ward: null,
    district: "Quận 7",
    city: "Hồ Chí Minh",
    country: "Việt Nam",
    postalCode: null,
    latitude: 10.7285,
    longitude: 106.7114,
    // Primary contact
    contactName: "Nguyễn Văn A",
    contactPhone: VALID_PHONES.mobile10,
    contactEmail: "contact@company.vn",
    contactPosition: null,
    // Secondary contact
    contact2Name: null,
    contact2Phone: null,
    contact2Email: null,
    contact2Position: null,
    // Accounting contact
    accountingName: null,
    accountingPhone: null,
    accountingEmail: null,
    // Business info
    status: "ACTIVE" as CustomerStatus,
    source: null,
    industry: null,
    // Care schedule
    careWeekday: 1,
    careTimeSlot: null,
    preferredStaffId: null,
    careFrequency: "weekly",
    requiresAppointment: false,
    // Building details
    buildingName: null,
    floorCount: null,
    hasElevator: true,
    parkingNote: null,
    securityNote: null,
    accessInstructions: null,
    // Billing
    billingCycle: "monthly",
    paymentTermDays: 30,
    preferredPayment: "BANK_TRANSFER",
    // Notes
    notes: null,
    internalNotes: null,
    // Timestamps
    createdAt: now,
    updatedAt: now,
    firstContractDate: null,
    lastCareDate: null,
    lastContactDate: null,
    ...overrides,
  };
}

/**
 * Create customer with active contracts (for delete blocking test)
 */
export function createMockCustomerWithContracts(
  overrides: Partial<Customer> = {}
): Customer & { contracts: { id: string; status: string }[] } {
  const customer = createMockCustomer(overrides);
  return {
    ...customer,
    contracts: [{ id: "contract_1", status: "ACTIVE" }],
  };
}

/**
 * Mock session object for auth tests
 */
export function createMockSession(role: "ADMIN" | "MANAGER" | "STAFF" = "STAFF") {
  return {
    user: {
      id: "user_123",
      email: "test@locxanh.vn",
      name: "Test User",
      role,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}
