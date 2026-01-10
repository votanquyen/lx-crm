import type {
  Customer,
  Invoice,
  CareSchedule,
  Payment,
  Contract,
  Prisma,
} from "@prisma/client";

type Decimal = Prisma.Decimal;

// Helper type to serialize Decimal/Date to string for client components
type SerializeFields<T> = {
  [K in keyof T]: T[K] extends Decimal
    ? string
    : T[K] extends Date
      ? string
      : T[K] extends Date | null
        ? string | null
        : T[K];
};

export type SerializedCustomer = SerializeFields<Customer>;
export type SerializedInvoice = SerializeFields<Invoice>;
export type SerializedCareSchedule = SerializeFields<CareSchedule>;
export type SerializedPayment = SerializeFields<Payment>;
export type SerializedContract = SerializeFields<Contract>;
