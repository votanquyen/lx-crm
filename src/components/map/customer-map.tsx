"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerMapData, ExchangeMarkerData } from "./customer-map-client";

// Dynamic import with no SSR to avoid Leaflet window issues
const CustomerMapClient = dynamic(
  () => import("./customer-map-client").then((mod) => mod.CustomerMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/10 flex h-[600px] w-full items-center justify-center rounded-lg border">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <p className="text-muted-foreground text-sm">Đang tải bản đồ...</p>
        </div>
      </div>
    ),
  }
);

export interface CustomerMapProps {
  customers: CustomerMapData[];
  exchangeRequests?: ExchangeMarkerData[];
  onCustomerClick?: (customerId: string) => void;
  onCreateExchange?: (customerId: string) => void;
  showExchangeLayer?: boolean;
  className?: string;
}

export function CustomerMap(props: CustomerMapProps) {
  return <CustomerMapClient {...props} />;
}

// Re-export types for convenience
export type { CustomerMapData, ExchangeMarkerData };
