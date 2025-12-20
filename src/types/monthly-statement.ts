import { Prisma } from "@prisma/client";

// Plant item in monthly statement
export interface PlantItem {
  id: string;
  name: string;
  sizeSpec: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Statement with customer data
export type StatementWithCustomer = Prisma.MonthlyStatementGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        code: true;
        companyName: true;
        shortName: true;
        address: true;
        district: true;
        contactName: true;
        contactPhone: true;
      };
    };
    confirmedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

// For frontend (Decimal → number conversion)
export interface StatementDTO {
  id: string;
  customerId: string;
  year: number;
  month: number;
  periodStart: string; // ISO date
  periodEnd: string;
  contactName: string | null;
  plants: PlantItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  needsConfirmation: boolean;
  confirmedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    code: string;
    companyName: string;
    shortName: string | null;
    address: string;
    district: string | null;
    contactName: string | null;
  };
  confirmedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

// Period calculation result
export interface StatementPeriod {
  year: number;
  month: number;
  periodStart: Date;
  periodEnd: Date;
}

// List item for sidebar
export interface StatementListItem {
  id: string;
  customerId: string;
  year: number;
  month: number;
  total: number;
  needsConfirmation: boolean;
  companyName: string;
  shortName: string | null;
  district: string | null;
  plantCount: number;
}
