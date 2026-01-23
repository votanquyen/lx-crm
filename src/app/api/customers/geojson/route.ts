/**
 * GeoJSON API for Customer Map
 * Returns customers with coordinates as GeoJSON FeatureCollection
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CustomerStatus } from "@prisma/client";

// GeoJSON types for response
export interface CustomerGeoJSONProperties {
  id: string;
  code: string;
  companyName: string;
  address: string;
  district: string;
  contactPhone: string | null;
  status: CustomerStatus;
  plantCount: number;
}

export interface CustomerGeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: CustomerGeoJSONProperties;
}

export interface CustomerGeoJSONResponse {
  type: "FeatureCollection";
  features: CustomerGeoJSONFeature[];
}

// Valid CustomerStatus values for validation
const VALID_STATUSES: CustomerStatus[] = ["LEAD", "ACTIVE", "INACTIVE", "TERMINATED"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const district = searchParams.get("district");

  // Validate status enum
  const status: CustomerStatus | null =
    statusParam && VALID_STATUSES.includes(statusParam as CustomerStatus)
      ? (statusParam as CustomerStatus)
      : null;

  const customers = await prisma.customer.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(status && { status }),
      ...(district && { district }),
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      address: true,
      district: true,
      latitude: true,
      longitude: true,
      contactPhone: true,
      status: true,
      _count: { select: { customerPlants: true } },
    },
  });

  const geojson: CustomerGeoJSONResponse = {
    type: "FeatureCollection",
    features: customers
      .filter((c) => c.longitude !== null && c.latitude !== null)
      .map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.longitude ?? 0, c.latitude ?? 0] as [number, number],
        },
        properties: {
          id: c.id,
          code: c.code,
          companyName: c.companyName,
          address: c.address,
          district: c.district ?? "",
          contactPhone: c.contactPhone,
          status: c.status,
          plantCount: c._count.customerPlants,
        },
      })),
  };

  return NextResponse.json(geojson, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
