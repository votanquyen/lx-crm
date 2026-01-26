/**
 * Customer Map Client Wrapper
 * Handles dynamic import with ssr: false for map component
 */
"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function MapSkeleton() {
  return (
    <div className="bg-muted/10 flex h-[600px] w-full items-center justify-center">
      <div className="space-y-2 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
        <p className="text-muted-foreground text-sm">Dang tai ban do...</p>
      </div>
    </div>
  );
}

const CustomerMapMapcn = dynamic(
  () => import("@/components/customers/customer-map-mapcn").then((m) => m.CustomerMapMapcn),
  {
    loading: () => <MapSkeleton />,
    ssr: false,
  }
);

interface CustomerMapWrapperProps {
  geojsonUrl: string;
}

export function CustomerMapWrapper({ geojsonUrl }: CustomerMapWrapperProps) {
  return <CustomerMapMapcn geojsonUrl={geojsonUrl} />;
}
