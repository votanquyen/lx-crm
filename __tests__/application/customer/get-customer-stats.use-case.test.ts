/**
 * GetCustomerStatsUseCase Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GetCustomerStatsUseCase,
  CustomerStatsProvider,
  CustomerStats,
} from "@/application/customer/get-customer-stats.use-case";

describe("GetCustomerStatsUseCase", () => {
  let useCase: GetCustomerStatsUseCase;
  let mockStatsProvider: CustomerStatsProvider;

  beforeEach(() => {
    mockStatsProvider = {
      getStats: vi.fn(),
    };
    useCase = new GetCustomerStatsUseCase(mockStatsProvider);
  });

  it("returns stats from provider", async () => {
    const mockStats: CustomerStats = {
      total: 100,
      active: 75,
      leads: 20,
      withDebt: 5,
    };
    vi.mocked(mockStatsProvider.getStats).mockResolvedValue(mockStats);

    const result = await useCase.execute();

    expect(result).toEqual(mockStats);
    expect(result.total).toBe(100);
    expect(result.active).toBe(75);
    expect(result.leads).toBe(20);
    expect(result.withDebt).toBe(5);
  });

  it("delegates to stats provider", async () => {
    const mockStats: CustomerStats = {
      total: 0,
      active: 0,
      leads: 0,
      withDebt: 0,
    };
    vi.mocked(mockStatsProvider.getStats).mockResolvedValue(mockStats);

    await useCase.execute();

    expect(mockStatsProvider.getStats).toHaveBeenCalledTimes(1);
  });

  it("handles zero stats correctly", async () => {
    const emptyStats: CustomerStats = {
      total: 0,
      active: 0,
      leads: 0,
      withDebt: 0,
    };
    vi.mocked(mockStatsProvider.getStats).mockResolvedValue(emptyStats);

    const result = await useCase.execute();

    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
  });

  it("propagates provider errors", async () => {
    const error = new Error("Database connection failed");
    vi.mocked(mockStatsProvider.getStats).mockRejectedValue(error);

    await expect(useCase.execute()).rejects.toThrow("Database connection failed");
  });
});
