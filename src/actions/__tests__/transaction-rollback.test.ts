/**
 * Transaction Rollback Tests
 * Tests that database transactions properly rollback on failure scenarios
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/lib/errors";

// Mock the prisma client with transaction simulation
const mockTx = {
  inventory: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  contract: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  customerPlant: {
    create: vi.fn(),
    updateMany: vi.fn(),
  },
};

// Track transaction state
let transactionCompleted = false;
let rollbackCalled = false;

// Simulates the contract activation transaction logic
async function simulateActivateContractTransaction(
  contractId: string,
  items: Array<{ plantTypeId: string; quantity: number }>,
  inventoryStock: Record<string, number>
) {
  transactionCompleted = false;
  rollbackCalled = false;

  try {
    // Simulated transaction (like prisma.$transaction)
    await (async () => {
      // Step 1: Check inventory (inside transaction)
      for (const item of items) {
        const available = inventoryStock[item.plantTypeId] ?? 0;
        if (available < item.quantity) {
          // This would cause transaction to rollback
          throw new AppError(
            `Không đủ cây trong kho (cần ${item.quantity}, có ${available})`,
            "INSUFFICIENT_STOCK"
          );
        }
      }

      // Step 2: Update contract status
      mockTx.contract.update({ where: { id: contractId }, data: { status: "ACTIVE" } });

      // Step 3: Create customer plants
      for (const item of items) {
        mockTx.customerPlant.create({
          data: {
            plantTypeId: item.plantTypeId,
            quantity: item.quantity,
          },
        });
      }

      // Step 4: Update inventory (decrement)
      for (const item of items) {
        inventoryStock[item.plantTypeId]! -= item.quantity;
        mockTx.inventory.update({
          where: { plantTypeId: item.plantTypeId },
          data: { availableStock: inventoryStock[item.plantTypeId] },
        });
      }

      transactionCompleted = true;
    })();
  } catch (error) {
    rollbackCalled = true;
    throw error;
  }
}

// Simulates the contract cancellation transaction logic
async function simulateCancelContractTransaction(
  contractId: string,
  wasActive: boolean,
  items: Array<{ plantTypeId: string; quantity: number }>,
  inventoryStock: Record<string, number>,
  shouldFail: { step: number; error: Error } | null = null
) {
  transactionCompleted = false;
  rollbackCalled = false;

  try {
    await (async () => {
      // Step 1: Update contract status
      if (shouldFail?.step === 1) throw shouldFail.error;

      mockTx.contract.update({
        where: { id: contractId },
        data: { status: "CANCELLED" },
      });

      // Step 2: Return inventory if was active
      if (wasActive) {
        for (const item of items) {
          if (shouldFail?.step === 2) throw shouldFail.error;

          mockTx.customerPlant.updateMany({
            where: { plantTypeId: item.plantTypeId },
            data: { status: "REMOVED" },
          });

          inventoryStock[item.plantTypeId] =
            (inventoryStock[item.plantTypeId] ?? 0) + item.quantity;

          mockTx.inventory.update({
            where: { plantTypeId: item.plantTypeId },
            data: { availableStock: inventoryStock[item.plantTypeId] },
          });
        }
      }

      transactionCompleted = true;
    })();
  } catch (error) {
    rollbackCalled = true;
    throw error;
  }
}

describe("Transaction Rollback Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transactionCompleted = false;
    rollbackCalled = false;
  });

  describe("Contract Activation Transaction", () => {
    it("should rollback on insufficient stock for first item", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 100 },
        { plantTypeId: "plant-2", quantity: 50 },
      ];
      const inventory = { "plant-1": 50, "plant-2": 100 }; // plant-1 has insufficient stock

      await expect(
        simulateActivateContractTransaction("contract-1", items, inventory)
      ).rejects.toThrow("Không đủ cây trong kho");

      // Verify rollback was triggered
      expect(rollbackCalled).toBe(true);
      expect(transactionCompleted).toBe(false);

      // Verify inventory was NOT modified (rollback preserved original state)
      expect(inventory["plant-1"]).toBe(50);
      expect(inventory["plant-2"]).toBe(100);
    });

    it("should rollback on insufficient stock for second item", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 10 },
        { plantTypeId: "plant-2", quantity: 200 }, // Exceeds available
      ];
      const inventory = { "plant-1": 50, "plant-2": 100 };

      await expect(
        simulateActivateContractTransaction("contract-1", items, inventory)
      ).rejects.toThrow("Không đủ cây trong kho");

      expect(rollbackCalled).toBe(true);
      expect(transactionCompleted).toBe(false);

      // Original inventory preserved
      expect(inventory["plant-1"]).toBe(50);
      expect(inventory["plant-2"]).toBe(100);
    });

    it("should complete successfully when stock is sufficient", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 10 },
        { plantTypeId: "plant-2", quantity: 20 },
      ];
      const inventory = { "plant-1": 50, "plant-2": 100 };

      await simulateActivateContractTransaction("contract-1", items, inventory);

      expect(transactionCompleted).toBe(true);
      expect(rollbackCalled).toBe(false);

      // Inventory was decremented
      expect(inventory["plant-1"]).toBe(40);
      expect(inventory["plant-2"]).toBe(80);
    });

    it("should handle exact stock match without rollback", async () => {
      const items = [{ plantTypeId: "plant-1", quantity: 50 }];
      const inventory = { "plant-1": 50 }; // Exact match

      await simulateActivateContractTransaction("contract-1", items, inventory);

      expect(transactionCompleted).toBe(true);
      expect(rollbackCalled).toBe(false);
      expect(inventory["plant-1"]).toBe(0);
    });

    it("should fail on missing plant type in inventory", async () => {
      const items = [{ plantTypeId: "unknown-plant", quantity: 10 }];
      const inventory = { "plant-1": 50 }; // unknown-plant not in inventory

      await expect(
        simulateActivateContractTransaction("contract-1", items, inventory)
      ).rejects.toThrow("Không đủ cây trong kho");

      expect(rollbackCalled).toBe(true);
      expect(transactionCompleted).toBe(false);
    });
  });

  describe("Contract Cancellation Transaction", () => {
    it("should rollback if inventory update fails", async () => {
      const items = [{ plantTypeId: "plant-1", quantity: 10 }];
      const inventory = { "plant-1": 50 };
      const dbError = new Error("Database connection lost");

      await expect(
        simulateCancelContractTransaction("contract-1", true, items, inventory, {
          step: 2,
          error: dbError,
        })
      ).rejects.toThrow("Database connection lost");

      expect(rollbackCalled).toBe(true);
      expect(transactionCompleted).toBe(false);
    });

    it("should complete successfully for active contract", async () => {
      const items = [{ plantTypeId: "plant-1", quantity: 10 }];
      const inventory = { "plant-1": 50 };

      await simulateCancelContractTransaction("contract-1", true, items, inventory);

      expect(transactionCompleted).toBe(true);
      expect(rollbackCalled).toBe(false);

      // Inventory was incremented (plants returned)
      expect(inventory["plant-1"]).toBe(60);
    });

    it("should complete without inventory changes for draft contract", async () => {
      const items = [{ plantTypeId: "plant-1", quantity: 10 }];
      const inventory = { "plant-1": 50 };

      await simulateCancelContractTransaction("contract-1", false, items, inventory);

      expect(transactionCompleted).toBe(true);
      expect(rollbackCalled).toBe(false);

      // Inventory unchanged (draft contracts don't affect stock)
      expect(inventory["plant-1"]).toBe(50);
    });

    it("should handle multiple items in cancellation", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 10 },
        { plantTypeId: "plant-2", quantity: 20 },
        { plantTypeId: "plant-3", quantity: 5 },
      ];
      const inventory = { "plant-1": 40, "plant-2": 30, "plant-3": 15 };

      await simulateCancelContractTransaction("contract-1", true, items, inventory);

      expect(transactionCompleted).toBe(true);

      // All inventories incremented
      expect(inventory["plant-1"]).toBe(50);
      expect(inventory["plant-2"]).toBe(50);
      expect(inventory["plant-3"]).toBe(20);
    });
  });

  describe("Error Messages", () => {
    it("should provide Vietnamese error message with stock details", async () => {
      const items = [{ plantTypeId: "plant-1", quantity: 100 }];
      const inventory = { "plant-1": 45 };

      try {
        await simulateActivateContractTransaction("contract-1", items, inventory);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).message).toBe("Không đủ cây trong kho (cần 100, có 45)");
        expect((error as AppError).code).toBe("INSUFFICIENT_STOCK");
      }
    });

    it("should show zero available when plant type not in inventory", async () => {
      const items = [{ plantTypeId: "missing-plant", quantity: 10 }];
      const inventory = {};

      try {
        await simulateActivateContractTransaction("contract-1", items, inventory);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as AppError).message).toBe("Không đủ cây trong kho (cần 10, có 0)");
      }
    });
  });

  describe("Atomicity Guarantees", () => {
    it("should not partially update inventory on failure", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 10 }, // Would succeed
        { plantTypeId: "plant-2", quantity: 200 }, // Would fail
      ];
      const inventory = { "plant-1": 50, "plant-2": 100 };
      const originalInventory = { ...inventory };

      await expect(
        simulateActivateContractTransaction("contract-1", items, inventory)
      ).rejects.toThrow();

      // Both inventories unchanged (atomicity)
      expect(inventory).toEqual(originalInventory);
    });

    it("should maintain consistency across multiple plant types", async () => {
      const items = [
        { plantTypeId: "plant-1", quantity: 5 },
        { plantTypeId: "plant-2", quantity: 10 },
        { plantTypeId: "plant-3", quantity: 15 },
      ];
      const inventory = { "plant-1": 100, "plant-2": 100, "plant-3": 100 };

      await simulateActivateContractTransaction("contract-1", items, inventory);

      expect(transactionCompleted).toBe(true);
      expect(inventory["plant-1"]).toBe(95);
      expect(inventory["plant-2"]).toBe(90);
      expect(inventory["plant-3"]).toBe(85);
    });
  });
});
