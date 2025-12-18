/**
 * Customer Plants Server Actions
 * Manage plants assigned to customers
 */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAction, createSimpleAction } from "@/lib/action-utils";
import { AppError, NotFoundError } from "@/lib/errors";
import type { PlantStatus, Prisma } from "@prisma/client";

/**
 * Schema for adding a plant to a customer
 */
const addPlantSchema = z.object({
  customerId: z.string().cuid(),
  plantTypeId: z.string().cuid(),
  quantity: z.number().int().positive(),
  location: z.string().optional(),
  notes: z.string().optional(),
  // contractId removed - not in CustomerPlant schema
});

/**
 * Schema for updating a customer plant
 */
const updatePlantSchema = z.object({
  id: z.string().cuid(),
  quantity: z.number().int().positive().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "REPLACED", "REMOVED", "DAMAGED"]).optional(),
});

/**
 * Get all plants for a customer
 */
export async function getCustomerPlants(customerId: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const plants = await prisma.customerPlant.findMany({
    where: { customerId },
    include: {
      plantType: {
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          rentalPrice: true,
          wateringFrequency: true,
        },
      },
      // contract relation does not exist in CustomerPlant schema
    },
    orderBy: [{ status: "asc" }, { plantType: { name: "asc" } }],
  });

  return plants;
}

/**
 * Get available plant types for adding to a customer
 */
export async function getAvailablePlantTypes() {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const plantTypes = await prisma.plantType.findMany({
    where: { isActive: true },
    include: {
      inventory: {
        select: {
          availableStock: true,
          totalStock: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return plantTypes;
}

/**
 * Add a plant to a customer
 */
export const addPlantToCustomer = createAction(addPlantSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) throw new NotFoundError("Khách hàng");

  // Verify plant type exists
  const plantType = await prisma.plantType.findUnique({
    where: { id: input.plantTypeId },
    include: { inventory: true },
  });
  if (!plantType) throw new NotFoundError("Loại cây");

  // Check inventory availability
  if (plantType.inventory) {
    if (plantType.inventory.availableStock < input.quantity) {
      throw new AppError(
        `Không đủ số lượng. Hiện có: ${plantType.inventory.availableStock}`,
        "INSUFFICIENT_STOCK"
      );
    }
  }

  // Use transaction to ensure atomicity between inventory update and customer plant creation
  const result = await prisma.$transaction(async (tx) => {
    // Create customer plant
    const customerPlant = await tx.customerPlant.create({
      data: {
        customerId: input.customerId,
        plantTypeId: input.plantTypeId,
        quantity: input.quantity,
        location: input.location,
        notes: input.notes,
        // contractId field doesn't exist in CustomerPlant schema
        status: "ACTIVE",
        installedAt: new Date(),
      },
      include: {
        plantType: true,
      },
    });

    // Update inventory (if exists)
    if (plantType.inventory) {
      await tx.inventory.update({
        where: { id: plantType.inventory.id },
        data: {
          availableStock: { decrement: input.quantity },
          rentedStock: { increment: input.quantity },
        },
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADD_PLANT",
        entityType: "CustomerPlant",
        entityId: customerPlant.id,
        newValues: {
          customerId: input.customerId,
          plantType: plantType.name,
          quantity: input.quantity,
        } as unknown as Prisma.JsonObject,
      },
    });

    return customerPlant;
  });

  const customerPlant = result;

  revalidatePath(`/customers/${input.customerId}`);
  return customerPlant;
});

/**
 * Update a customer plant
 */
export const updateCustomerPlant = createAction(updatePlantSchema, async (input) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const { id, ...updateData } = input;

  // Build update data with proper types
  const data: Prisma.CustomerPlantUpdateInput = {};
  if (updateData.quantity !== undefined) data.quantity = updateData.quantity;
  if (updateData.location !== undefined) data.location = updateData.location;
  if (updateData.notes !== undefined) data.notes = updateData.notes;
  if (updateData.status !== undefined) data.status = updateData.status as PlantStatus;

  // Get existing plant
  const existing = await prisma.customerPlant.findUnique({
    where: { id },
    include: { plantType: { include: { inventory: true } } },
  });
  if (!existing) throw new NotFoundError("Cây xanh");

  // Handle quantity changes
  if (updateData.quantity && updateData.quantity !== existing.quantity) {
    const diff = updateData.quantity - existing.quantity;
    if (existing.plantType.inventory) {
      if (diff > 0 && existing.plantType.inventory.availableStock < diff) {
        throw new AppError(
          `Không đủ số lượng. Hiện có: ${existing.plantType.inventory.availableStock}`,
          "INSUFFICIENT_STOCK"
        );
      }

      await prisma.inventory.update({
        where: { id: existing.plantType.inventory.id },
        data: {
          availableStock: { decrement: diff },
          rentedStock: { increment: diff },
        },
      });
    }
  }

  // Handle status changes (return to inventory if returned/damaged)
  if (updateData.status && updateData.status !== existing.status) {
    if (
      (updateData.status === "REMOVED" || updateData.status === "DAMAGED") &&
      existing.status === "ACTIVE"
    ) {
      if (existing.plantType.inventory) {
        await prisma.inventory.update({
          where: { id: existing.plantType.inventory.id },
          data: {
            rentedStock: { decrement: existing.quantity },
            ...(updateData.status === "REMOVED"
              ? { availableStock: { increment: existing.quantity } }
              : { damagedStock: { increment: existing.quantity } }),
          },
        });
      }
    }
  }

  const customerPlant = await prisma.customerPlant.update({
    where: { id },
    data,
  });

  revalidatePath(`/customers/${existing.customerId}`);
  return customerPlant;
});

/**
 * Remove a plant from a customer (soft delete - set status to RETURNED)
 */
export const removePlantFromCustomer = createSimpleAction(async (id: string) => {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const existing = await prisma.customerPlant.findUnique({
    where: { id },
    include: { plantType: { include: { inventory: true } } },
  });
  if (!existing) throw new NotFoundError("Cây xanh");

  // Return to inventory
  if (existing.plantType.inventory && existing.status === "ACTIVE") {
    await prisma.inventory.update({
      where: { id: existing.plantType.inventory.id },
      data: {
        rentedStock: { decrement: existing.quantity },
        availableStock: { increment: existing.quantity },
      },
    });
  }

  await prisma.customerPlant.update({
    where: { id },
    data: { status: "REMOVED" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "REMOVE_PLANT",
      entityType: "CustomerPlant",
      entityId: id,
      oldValues: {
        customerId: existing.customerId,
        plantType: existing.plantType.name,
        quantity: existing.quantity,
      },
    },
  });

  revalidatePath(`/customers/${existing.customerId}`);
  return { success: true };
});

/**
 * Get plant status summary for a customer
 */
export async function getCustomerPlantStats(customerId: string) {
  const session = await auth();
  if (!session?.user) throw new AppError("Unauthorized", "UNAUTHORIZED", 401);

  const stats = await prisma.customerPlant.groupBy({
    by: ["status"],
    where: { customerId },
    _sum: { quantity: true },
    _count: true,
  });

  const total = stats.reduce((acc, s) => acc + (s._sum.quantity ?? 0), 0);
  const active = stats.find((s) => s.status === "ACTIVE")?._sum.quantity ?? 0;

  return {
    total,
    active,
    byStatus: stats.reduce(
      (acc, s) => ({
        ...acc,
        [s.status]: s._sum.quantity ?? 0,
      }),
      {} as Record<PlantStatus, number>
    ),
  };
}
