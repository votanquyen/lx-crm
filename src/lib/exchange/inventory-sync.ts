/**
 * Exchange Inventory Sync
 * Handles inventory updates when exchanges are completed
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export interface PlantExchangeItem {
  plantTypeId: string;
  quantity: number;
}

export interface ExchangeCompletionData {
  exchangeRequestId: string;
  customerId: string;
  removedPlants: PlantExchangeItem[];
  installedPlants: PlantExchangeItem[];
  completionNotes?: string;
  completedByUserId: string;
}

/**
 * Sync inventory when exchange is completed
 * Uses transaction with atomic updates to ensure data consistency
 *
 * Flow:
 * 1. Return removed plants to inventory (increase availableStock, decrease rentedStock)
 * 2. Decrease customer plant quantities for removed plants
 * 3. Decrease inventory for installed plants (decrease availableStock, increase rentedStock)
 * 4. Increase/create customer plant quantities for installed plants
 * 5. Log exchange history
 */
export async function syncInventoryOnExchangeCompletion(
  data: ExchangeCompletionData
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Process removed plants (return to inventory)
    for (const plant of data.removedPlants) {
      // Decrease customer plant quantity
      const customerPlant = await tx.customerPlant.findFirst({
        where: {
          customerId: data.customerId,
          plantTypeId: plant.plantTypeId,
        },
      });

      if (customerPlant) {
        const newQuantity = customerPlant.quantity - plant.quantity;
        if (newQuantity <= 0) {
          // Remove the customer plant record if quantity becomes 0 or negative
          await tx.customerPlant.delete({
            where: { id: customerPlant.id },
          });
        } else {
          await tx.customerPlant.update({
            where: { id: customerPlant.id },
            data: { quantity: newQuantity },
          });
        }
      }

      // Return to inventory (increase available stock, decrease rented stock)
      await tx.inventory.update({
        where: { plantTypeId: plant.plantTypeId },
        data: {
          availableStock: { increment: plant.quantity },
          rentedStock: { decrement: plant.quantity },
        },
      });
    }

    // Pre-fetch all inventory and plant type info for installed plants (avoid N+1)
    if (data.installedPlants.length > 0) {
      const plantTypeIds = data.installedPlants.map((p) => p.plantTypeId);

      const inventories = await tx.inventory.findMany({
        where: { plantTypeId: { in: plantTypeIds } },
        include: { plantType: { select: { id: true, name: true } } },
      });

      const inventoryMap = new Map(inventories.map((inv) => [inv.plantTypeId, inv]));

      // Process each plant with pre-fetched data
      for (const plant of data.installedPlants) {
        const inventory = inventoryMap.get(plant.plantTypeId);

        if (!inventory) {
          throw new AppError(
            `Loại cây không tồn tại: ${plant.plantTypeId}`,
            "PLANT_TYPE_NOT_FOUND"
          );
        }

        if (inventory.availableStock < plant.quantity) {
          throw new AppError(
            `Không đủ số lượng cây "${inventory.plantType.name}" trong kho. Cần: ${plant.quantity}, Có: ${inventory.availableStock}`,
            "INSUFFICIENT_STOCK"
          );
        }

        // Atomic update with WHERE clause to prevent race condition
        // If another transaction modified stock, this will update 0 rows
        const updateResult = await tx.$executeRaw`
          UPDATE inventory
          SET "availableStock" = "availableStock" - ${plant.quantity},
              "rentedStock" = "rentedStock" + ${plant.quantity},
              "updatedAt" = NOW()
          WHERE "plantTypeId" = ${plant.plantTypeId}
            AND "availableStock" >= ${plant.quantity}
        `;

        // Check if update succeeded (affected 1 row)
        if (updateResult === 0) {
          throw new AppError(
            `Không đủ số lượng cây "${inventory.plantType.name}" trong kho (đã thay đổi bởi giao dịch khác).`,
            "INSUFFICIENT_STOCK_RACE"
          );
        }

        // Increase customer plant quantity (or create if not exists)
        const existingCustomerPlant = await tx.customerPlant.findFirst({
          where: {
            customerId: data.customerId,
            plantTypeId: plant.plantTypeId,
          },
        });

        if (existingCustomerPlant) {
          await tx.customerPlant.update({
            where: { id: existingCustomerPlant.id },
            data: { quantity: { increment: plant.quantity } },
          });
        } else {
          await tx.customerPlant.create({
            data: {
              customerId: data.customerId,
              plantTypeId: plant.plantTypeId,
              quantity: plant.quantity,
              status: "ACTIVE",
            },
          });
        }
      }
    }

    // Update exchange request as completed
    await tx.exchangeRequest.update({
      where: { id: data.exchangeRequestId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completionNotes: data.completionNotes,
      },
    });

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: data.completedByUserId,
        action: "COMPLETE_EXCHANGE",
        entityType: "ExchangeRequest",
        entityId: data.exchangeRequestId,
        newValues: {
          removedPlants: data.removedPlants,
          installedPlants: data.installedPlants,
          completedAt: new Date().toISOString(),
        } as unknown as Prisma.JsonObject,
      },
    });
  });
}

/**
 * Validate inventory before scheduling exchange
 * Returns list of plant types with insufficient stock
 * Uses batched query to avoid N+1 problem
 */
export async function validateInventoryForExchange(
  plantsToInstall: PlantExchangeItem[]
): Promise<{ plantTypeId: string; name: string; required: number; available: number }[]> {
  if (plantsToInstall.length === 0) return [];

  const plantTypeIds = plantsToInstall.map((p) => p.plantTypeId);

  // Batch query all inventory and plant types at once
  const inventories = await prisma.inventory.findMany({
    where: { plantTypeId: { in: plantTypeIds } },
    include: { plantType: { select: { id: true, name: true } } },
  });

  const inventoryMap = new Map(inventories.map((inv) => [inv.plantTypeId, inv]));

  const insufficientStock: {
    plantTypeId: string;
    name: string;
    required: number;
    available: number;
  }[] = [];

  for (const plant of plantsToInstall) {
    const inventory = inventoryMap.get(plant.plantTypeId);

    if (!inventory) {
      insufficientStock.push({
        plantTypeId: plant.plantTypeId,
        name: "Unknown",
        required: plant.quantity,
        available: 0,
      });
      continue;
    }

    const available = inventory.availableStock;
    if (available < plant.quantity) {
      insufficientStock.push({
        plantTypeId: plant.plantTypeId,
        name: inventory.plantType.name,
        required: plant.quantity,
        available,
      });
    }
  }

  return insufficientStock;
}
