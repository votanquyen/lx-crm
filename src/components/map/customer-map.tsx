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
      <div className="h-[600px] w-full rounded-lg border bg-muted/10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải bản đồ...</p>
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
