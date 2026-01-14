/**
 * Customer Map with mapcn (MapLibre GL + Shadcn UI)
 * Displays customers as clustered markers with popup on click
 */
"use client";

import { useState } from "react";
import { Map, MapClusterLayer, MapPopup, MapControls } from "@/components/ui/map";
import { CustomerPopupContent } from "./customer-popup-content";

interface CustomerMapMapcnProps {
  geojsonUrl: string;
  className?: string;
}

interface SelectedPoint {
  coordinates: [number, number];
  properties: {
    id: string;
    code: string;
    companyName: string;
    address: string;
    district: string;
    contactPhone: string | null;
    plantCount: number;
  };
}

// Ho Chi Minh City center
const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769];

export function CustomerMapMapcn({ geojsonUrl, className }: CustomerMapMapcnProps) {
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

  return (
    <div className={`relative h-[600px] w-full rounded-lg overflow-hidden ${className ?? ""}`}>
      <Map
        center={DEFAULT_CENTER}
        zoom={11}
      >
        <MapClusterLayer
          data={geojsonUrl}
          clusterRadius={50}
          clusterMaxZoom={14}
          clusterColors={["#22c55e", "#eab308", "#ef4444"]}
          pointColor="#16a34a"
          onPointClick={(feature, coordinates) => {
            setSelectedPoint({
              coordinates,
              properties: feature.properties as SelectedPoint["properties"],
            });
          }}
        />

        {selectedPoint && (
          <MapPopup
            longitude={selectedPoint.coordinates[0]}
            latitude={selectedPoint.coordinates[1]}
            onClose={() => setSelectedPoint(null)}
            closeButton
            closeOnClick={false}
            className="p-0"
          >
            <CustomerPopupContent
              {...selectedPoint.properties}
            />
          </MapPopup>
        )}

        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
        />
      </Map>
    </div>
  );
}
