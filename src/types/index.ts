// Re-export Prisma types for easier imports
export type {
  User,
  Customer,
  PlantType,
  Inventory,
  CustomerPlant,
  Contract,
  ContractItem,
  Invoice,
  InvoiceItem,
  Payment,
  CareSchedule,
  ExchangeRequest,
  DailySchedule,
  ScheduledExchange,
  ExchangeHistory,
  StickyNote,
  Quotation,
  QuotationItem,
  ActivityLog,
  Setting,
} from "@prisma/client";

export {
  UserRole,
  CustomerStatus,
  ContractStatus,
  InvoiceStatus,
  PaymentMethod,
  CareStatus,
  ExchangeStatus,
  ExchangePriority,
  NoteStatus,
  
  NoteCategory,
  PlantStatus,
} from "@prisma/client";

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Search params
export interface SearchParams extends PaginationParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Auth types
export type { AuthUser, AuthSession, ActionContext } from "./auth";

// Dashboard stats
export interface DashboardStats {
  customers: {
    total: number;
    active: number;
    new: number;
  };
  plants: {
    total: number;
    rented: number;
    available: number;
  };
  contracts: {
    active: number;
    expiringSoon: number;
  };
  invoices: {
    pending: number;
    overdue: number;
    totalValue: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}
