/**
 * Unit Tests for Inventory Sync
 * Tests inventory validation logic for exchange operations
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateInventoryForExchange,
  type PlantExchangeItem,
} from "@/lib/exchange/inventory-sync";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventory: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("inventory-sync: validateInventoryForExchange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no plants to install", async () => {
    const result = await validateInventoryForExchange([]);
    expect(result).toEqual([]);
    expect(prisma.inventory.findMany).not.toHaveBeenCalled();
  });

  it("returns empty array when all plants have sufficient stock", async () => {
    const plantsToInstall: PlantExchangeItem[] = [
      { plantTypeId: "plant-1", quantity: 5 },
      { plantTypeId: "plant-2", quantity: 3 },
    ];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      {
        id: "inv-1",
        plantTypeId: "plant-1",
        availableStock: 10,
        rentedStock: 5,
        plantType: { id: "plant-1", name: "Cây Kim Tiền" },
      },
      {
        id: "inv-2",
        plantTypeId: "plant-2",
        availableStock: 5,
        rentedStock: 3,
        plantType: { id: "plant-2", name: "Cây Phát Tài" },
      },
    ] as never);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toEqual([]);
  });

  it("returns insufficient stock items when stock is low", async () => {
    const plantsToInstall: PlantExchangeItem[] = [
      { plantTypeId: "plant-1", quantity: 15 },
      { plantTypeId: "plant-2", quantity: 3 },
    ];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      {
        id: "inv-1",
        plantTypeId: "plant-1",
        availableStock: 10,
        rentedStock: 5,
        plantType: { id: "plant-1", name: "Cây Kim Tiền" },
      },
      {
        id: "inv-2",
        plantTypeId: "plant-2",
        availableStock: 5,
        rentedStock: 3,
        plantType: { id: "plant-2", name: "Cây Phát Tài" },
      },
    ] as never);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toEqual([
      {
        plantTypeId: "plant-1",
        name: "Cây Kim Tiền",
        required: 15,
        available: 10,
      },
    ]);
  });

  it("returns Unknown name for missing plant types", async () => {
    const plantsToInstall: PlantExchangeItem[] = [{ plantTypeId: "non-existent", quantity: 5 }];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([]);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toEqual([
      {
        plantTypeId: "non-existent",
        name: "Unknown",
        required: 5,
        available: 0,
      },
    ]);
  });

  it("handles multiple insufficient stock items", async () => {
    const plantsToInstall: PlantExchangeItem[] = [
      { plantTypeId: "plant-1", quantity: 20 },
      { plantTypeId: "plant-2", quantity: 10 },
      { plantTypeId: "plant-3", quantity: 5 },
    ];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      {
        id: "inv-1",
        plantTypeId: "plant-1",
        availableStock: 10,
        rentedStock: 5,
        plantType: { id: "plant-1", name: "Cây Kim Tiền" },
      },
      {
        id: "inv-2",
        plantTypeId: "plant-2",
        availableStock: 5,
        rentedStock: 3,
        plantType: { id: "plant-2", name: "Cây Phát Tài" },
      },
      {
        id: "inv-3",
        plantTypeId: "plant-3",
        availableStock: 10,
        rentedStock: 0,
        plantType: { id: "plant-3", name: "Cây Lưỡi Hổ" },
      },
    ] as never);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      plantTypeId: "plant-1",
      name: "Cây Kim Tiền",
      required: 20,
      available: 10,
    });
    expect(result).toContainEqual({
      plantTypeId: "plant-2",
      name: "Cây Phát Tài",
      required: 10,
      available: 5,
    });
  });

  it("queries database with correct plant type IDs", async () => {
    const plantsToInstall: PlantExchangeItem[] = [
      { plantTypeId: "plant-a", quantity: 1 },
      { plantTypeId: "plant-b", quantity: 2 },
      { plantTypeId: "plant-c", quantity: 3 },
    ];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([]);

    await validateInventoryForExchange(plantsToInstall);

    expect(prisma.inventory.findMany).toHaveBeenCalledWith({
      where: { plantTypeId: { in: ["plant-a", "plant-b", "plant-c"] } },
      include: { plantType: { select: { id: true, name: true } } },
    });
  });

  it("handles exact stock match (boundary condition)", async () => {
    const plantsToInstall: PlantExchangeItem[] = [{ plantTypeId: "plant-1", quantity: 10 }];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      {
        id: "inv-1",
        plantTypeId: "plant-1",
        availableStock: 10,
        rentedStock: 0,
        plantType: { id: "plant-1", name: "Cây Kim Tiền" },
      },
    ] as never);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toEqual([]);
  });

  it("handles zero available stock", async () => {
    const plantsToInstall: PlantExchangeItem[] = [{ plantTypeId: "plant-1", quantity: 1 }];

    vi.mocked(prisma.inventory.findMany).mockResolvedValue([
      {
        id: "inv-1",
        plantTypeId: "plant-1",
        availableStock: 0,
        rentedStock: 10,
        plantType: { id: "plant-1", name: "Cây Kim Tiền" },
      },
    ] as never);

    const result = await validateInventoryForExchange(plantsToInstall);
    expect(result).toEqual([
      {
        plantTypeId: "plant-1",
        name: "Cây Kim Tiền",
        required: 1,
        available: 0,
      },
    ]);
  });
});

describe("inventory-sync: PlantExchangeItem type", () => {
  it("correctly types plant exchange items", () => {
    const item: PlantExchangeItem = {
      plantTypeId: "test-id",
      quantity: 5,
    };

    expect(item.plantTypeId).toBe("test-id");
    expect(item.quantity).toBe(5);
  });
});
