/**
 * Customer Mapper
 * Converts between Prisma models and domain entities
 *
 * Responsibilities:
 * - Map Prisma Customer -> Domain Customer entity
 * - Map Domain Customer -> Prisma data for persistence
 * - Handle null/undefined conversions consistently
 */
import type { Customer as PrismaCustomer, Prisma, CustomerStatus } from "@prisma/client";
import { Customer, CustomerProps } from "@/domain/customer";

/**
 * Maps between Prisma Customer model and Domain Customer entity
 */
export class CustomerMapper {
  /**
   * Convert Prisma model to domain entity
   */
  static toDomain(prisma: PrismaCustomer): Customer {
    const props: CustomerProps = {
      id: prisma.id,
      code: prisma.code,
      companyName: prisma.companyName,
      companyNameNorm: prisma.companyNameNorm ?? "",
      address: prisma.address,
      addressNorm: prisma.addressNormalized ?? undefined,
      district: prisma.district ?? undefined,
      city: prisma.city ?? "TP.HCM",
      contactName: prisma.contactName ?? undefined,
      contactPhone: prisma.contactPhone ?? undefined,
      contactEmail: prisma.contactEmail ?? undefined,
      taxCode: prisma.taxCode ?? undefined,
      latitude: prisma.latitude ?? undefined,
      longitude: prisma.longitude ?? undefined,
      status: prisma.status as CustomerProps["status"],
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    };
    return Customer.fromPersistence(props);
  }

  /**
   * Convert domain entity to Prisma update data
   * Only includes fields managed by domain layer
   */
  static toPrismaUpdate(entity: Customer): Prisma.CustomerUpdateInput {
    const props = entity.toPersistence();
    return {
      companyName: props.companyName,
      companyNameNorm: props.companyNameNorm,
      address: props.address,
      addressNormalized: props.addressNorm ?? null,
      district: props.district ?? null,
      city: props.city,
      contactName: props.contactName ?? null,
      contactPhone: props.contactPhone ?? null,
      contactEmail: props.contactEmail ?? null,
      taxCode: props.taxCode ?? null,
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      status: props.status as CustomerStatus,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Convert domain entity to Prisma create data
   */
  static toPrismaCreate(entity: Customer): Prisma.CustomerCreateInput {
    const props = entity.toPersistence();
    return {
      id: props.id,
      code: props.code,
      companyName: props.companyName,
      companyNameNorm: props.companyNameNorm,
      address: props.address,
      addressNormalized: props.addressNorm ?? null,
      district: props.district ?? null,
      city: props.city,
      contactName: props.contactName ?? null,
      contactPhone: props.contactPhone ?? null,
      contactEmail: props.contactEmail ?? null,
      taxCode: props.taxCode ?? null,
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      status: props.status as CustomerStatus,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
