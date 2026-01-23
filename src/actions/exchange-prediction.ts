/**
 * Exchange Prediction Server Actions
 * Fetches plant data and predicts exchange needs
 */
"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  predictExchangeNeed,
  getUrgencyPriority,
  type PlantHealthInput,
  type CustomerPlantHealth,
  type CustomerHealthSummary,
  type LocationCondition,
  type ExchangeUrgency,
} from "@/lib/ai/exchange-prediction";

/**
 * Get average exchange interval for each plant type
 * Based on historical exchange data from plantsData JSON
 */
async function getAverageExchangeIntervals(): Promise<Map<string, number>> {
  // Since plantsData is JSON, we can't easily query by plantType
  // For now, return empty map - will use default lifespans
  // Future: Parse plantsData to extract patterns
  return new Map<string, number>();
}

/**
 * Get recent care notes for a customer
 */
async function getRecentCareNotes(customerId: string): Promise<string[]> {
  const schedules = await prisma.careSchedule.findMany({
    where: {
      customerId,
      status: "COMPLETED",
      notes: { not: null },
    },
    orderBy: { scheduledDate: "desc" },
    take: 5,
    select: { notes: true },
  });

  return schedules
    .map((s) => s.notes)
    .filter((n): n is string => n !== null && n.trim().length > 0);
}

/**
 * Get last exchange date for a customer's plant type
 * Parses plantsData JSON to find matching plant types
 */
async function getLastExchangeDates(customerId: string): Promise<Map<string, Date>> {
  const exchanges = await prisma.exchangeRequest.findMany({
    where: {
      customerId,
      status: "COMPLETED",
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      completedAt: true,
      currentPlant: true, // Plant type name
    },
  });

  const lastExchangeMap = new Map<string, Date>();

  for (const ex of exchanges) {
    if (ex.completedAt && ex.currentPlant) {
      // Use plant name as key (normalized)
      const plantKey = ex.currentPlant.toLowerCase().trim();
      if (!lastExchangeMap.has(plantKey)) {
        lastExchangeMap.set(plantKey, ex.completedAt);
      }
    }
  }

  return lastExchangeMap;
}

/**
 * Predict exchange needs for all plants at a customer location
 */
export async function getCustomerPlantHealth(
  customerId: string
): Promise<CustomerHealthSummary | null> {
  await requireAuth();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      companyName: true,
      customerPlants: {
        where: { status: "ACTIVE" },
        include: {
          plantType: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    return null;
  }

  // Get historical exchange intervals and care notes
  const [avgIntervals, careNotes, lastExchanges] = await Promise.all([
    getAverageExchangeIntervals(),
    getRecentCareNotes(customerId),
    getLastExchangeDates(customerId),
  ]);

  // TODO: Add locationCondition to Customer model in future
  // For now, default to INDOOR
  const locationCondition: LocationCondition = "INDOOR";

  // Predict health for each plant
  const plants: CustomerPlantHealth[] = [];

  for (const cp of customer.customerPlants) {
    // Try to find last exchange by plant name
    const plantNameKey = cp.plantType.name.toLowerCase().trim();
    const lastExchangeAt = lastExchanges.get(plantNameKey) || null;

    const input: PlantHealthInput = {
      plantTypeId: cp.plantType.id,
      plantTypeName: cp.plantType.name,
      plantTypeCode: cp.plantType.code || undefined,
      installedAt: cp.createdAt,
      lastExchangeAt,
      locationCondition,
      recentCareNotes: careNotes,
      avgExchangeIntervalDays: avgIntervals.get(cp.plantType.id) || null,
    };

    const recommendation = predictExchangeNeed(input);

    plants.push({
      plantId: cp.id,
      plantTypeId: cp.plantType.id,
      plantTypeName: cp.plantType.name,
      quantity: cp.quantity,
      recommendation,
    });
  }

  // Sort by urgency (most urgent first)
  plants.sort(
    (a, b) =>
      getUrgencyPriority(b.recommendation.urgency) - getUrgencyPriority(a.recommendation.urgency)
  );

  // Calculate summary
  const plantsNeedingAttention = plants.filter((p) => p.recommendation.urgency !== "NONE").length;

  const worstPlant = plants[0];
  const worstHealthScore = worstPlant?.recommendation.healthScore ?? 100;
  const worstUrgency: ExchangeUrgency = worstPlant?.recommendation.urgency ?? "NONE";

  return {
    customerId: customer.id,
    customerName: customer.companyName,
    totalPlants: plants.reduce((sum, p) => sum + p.quantity, 0),
    plantsNeedingAttention,
    worstHealthScore,
    worstUrgency,
    plants,
  };
}

/**
 * Exchange suggestion for dashboard widget
 */
export interface ExchangeSuggestion {
  customerId: string;
  customerCode: string;
  customerName: string;
  plantTypeName: string;
  quantity: number;
  healthScore: number;
  urgency: ExchangeUrgency;
  reason: string;
  daysRemaining: number;
}

/**
 * Get upcoming exchange suggestions across all customers
 * Returns plants that need attention, sorted by urgency
 */
export async function getExchangeSuggestions(options?: {
  limit?: number;
  minUrgency?: ExchangeUrgency;
}): Promise<ExchangeSuggestion[]> {
  await requireAuth();

  const limit = options?.limit ?? 20;
  const minUrgency = options?.minUrgency ?? "UPCOMING";
  const minUrgencyPriority = getUrgencyPriority(minUrgency);

  // Get all active customers with plants
  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
      customerPlants: {
        some: { status: "ACTIVE" },
      },
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      customerPlants: {
        where: { status: "ACTIVE" },
        include: {
          plantType: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  // Get historical data once for all
  const [avgIntervals] = await Promise.all([getAverageExchangeIntervals()]);

  // Get all customer IDs for batch fetching
  const customerIds = customers.map((c) => c.id);

  // Batch fetch: Get all last exchanges (using currentPlant field as plant identifier)
  // and all care notes in parallel
  const [allLastExchanges, allCareNotes] = await Promise.all([
    prisma.exchangeRequest.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      select: {
        customerId: true,
        currentPlant: true,
        completedAt: true,
      },
    }),
    prisma.careSchedule.findMany({
      where: {
        customerId: { in: customerIds },
        status: "COMPLETED",
        notes: { not: null },
      },
      orderBy: { scheduledDate: "desc" },
      select: {
        customerId: true,
        notes: true,
      },
    }),
  ]);

  // Build lookup map: customerId_plantName -> lastExchangeDate
  const exchangeMap = new Map<string, Date>();
  for (const ex of allLastExchanges) {
    if (ex.currentPlant && ex.completedAt) {
      const key = `${ex.customerId}_${ex.currentPlant.toLowerCase().trim()}`;
      if (!exchangeMap.has(key)) {
        exchangeMap.set(key, ex.completedAt);
      }
    }
  }

  // Build lookup map: customerId -> care notes (limit 5 per customer)
  const careNotesMap = new Map<string, string[]>();
  const careNotesCountMap = new Map<string, number>();
  for (const cn of allCareNotes) {
    const currentCount = careNotesCountMap.get(cn.customerId) || 0;
    if (currentCount < 5 && cn.notes && cn.notes.trim().length > 0) {
      const list = careNotesMap.get(cn.customerId) || [];
      list.push(cn.notes);
      careNotesMap.set(cn.customerId, list);
      careNotesCountMap.set(cn.customerId, currentCount + 1);
    }
  }

  const suggestions: ExchangeSuggestion[] = [];

  for (const customer of customers) {
    // Get care notes from batch data (instead of N+1 query)
    const careNotes = careNotesMap.get(customer.id) || [];

    for (const cp of customer.customerPlants) {
      const exchangeKey = `${customer.id}_${cp.plantType.name.toLowerCase().trim()}`;

      const input: PlantHealthInput = {
        plantTypeId: cp.plantType.id,
        plantTypeName: cp.plantType.name,
        plantTypeCode: cp.plantType.code || undefined,
        installedAt: cp.createdAt,
        lastExchangeAt: exchangeMap.get(exchangeKey) || null,
        locationCondition: "INDOOR",
        recentCareNotes: careNotes,
        avgExchangeIntervalDays: avgIntervals.get(cp.plantType.id) || null,
      };

      const recommendation = predictExchangeNeed(input);

      // Filter by minimum urgency
      if (getUrgencyPriority(recommendation.urgency) >= minUrgencyPriority) {
        suggestions.push({
          customerId: customer.id,
          customerCode: customer.code,
          customerName: customer.companyName,
          plantTypeName: cp.plantType.name,
          quantity: cp.quantity,
          healthScore: recommendation.healthScore,
          urgency: recommendation.urgency,
          reason: recommendation.reason,
          daysRemaining: recommendation.estimatedDaysRemaining,
        });
      }
    }
  }

  // Sort by urgency (most urgent first), then by days remaining
  suggestions.sort((a, b) => {
    const urgencyDiff = getUrgencyPriority(b.urgency) - getUrgencyPriority(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;
    return a.daysRemaining - b.daysRemaining;
  });

  return suggestions.slice(0, limit);
}

/**
 * Get exchange prediction summary statistics
 */
export async function getExchangePredictionSummary(): Promise<{
  total: number;
  urgent: number;
  recommended: number;
  upcoming: number;
  healthy: number;
}> {
  await requireAuth();

  const suggestions = await getExchangeSuggestions({
    limit: 1000,
    minUrgency: "NONE",
  });

  const summary = {
    total: suggestions.length,
    urgent: 0,
    recommended: 0,
    upcoming: 0,
    healthy: 0,
  };

  for (const s of suggestions) {
    switch (s.urgency) {
      case "URGENT":
        summary.urgent++;
        break;
      case "RECOMMENDED":
        summary.recommended++;
        break;
      case "UPCOMING":
        summary.upcoming++;
        break;
      case "NONE":
        summary.healthy++;
        break;
    }
  }

  return summary;
}
