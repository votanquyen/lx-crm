"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Building2, TreeDeciduous, Plus } from "lucide-react";

// Fix for default marker icons in Next.js
// @ts-expect-error - Leaflet private property access needed for icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ho Chi Minh City center coordinates
const HCMC_CENTER: [number, number] = [10.7769, 106.7009];

export interface CustomerMapData {
  id: string;
  code: string;
  companyName: string;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  status: string;
  plantCount?: number;
  hasPendingExchange?: boolean;
}

export interface ExchangeMarkerData {
  id: string;
  customerId: string;
  priority: string;
  priorityScore: number;
  status: string;
  latitude: number;
  longitude: number;
  customerName: string;
}

interface CustomerMapClientProps {
  customers: CustomerMapData[];
  exchangeRequests?: ExchangeMarkerData[];
  onCustomerClick?: (customerId: string) => void;
  onCreateExchange?: (customerId: string) => void;
  showExchangeLayer?: boolean;
  className?: string;
}

// Custom marker icons based on customer status
function createCustomerIcon(hasExchange: boolean): L.DivIcon {
  const color = "#16a34a"; // green-600 - default color for all customers
  const ringColor = hasExchange ? "#f59e0b" : "transparent"; // amber-500 for pending exchange

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid ${ringColor};
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Exchange request marker with priority indicator
function createExchangeIcon(priorityScore: number): L.DivIcon {
  let color = "#22c55e"; // green - low
  if (priorityScore >= 80) color = "#dc2626"; // red - urgent
  else if (priorityScore >= 60) color = "#f59e0b"; // amber - high
  else if (priorityScore >= 40) color = "#3b82f6"; // blue - medium

  return L.divIcon({
    className: "exchange-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2px solid white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">${priorityScore}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// Map bounds controller
function MapBoundsController({ customers }: { customers: CustomerMapData[] }) {
  const map = useMap();

  const validCustomers = customers.filter(
    (c) => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)
  );

  if (validCustomers.length > 0) {
    const bounds = L.latLngBounds(
      validCustomers.map((c) => [c.latitude!, c.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  return null;
}

export function CustomerMapClient({
  customers,
  exchangeRequests = [],
  onCustomerClick,
  onCreateExchange,
  showExchangeLayer = true,
  className = "",
}: CustomerMapClientProps) {
  const validCustomers = customers.filter(
    (c) => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)
  );

  const validExchanges = exchangeRequests.filter(
    (e) => e.latitude && e.longitude && !isNaN(e.latitude) && !isNaN(e.longitude)
  );

  // Mark customers with pending exchanges
  const customersWithExchanges = new Set(
    exchangeRequests
      .filter((e) => ["PENDING", "SCHEDULED"].includes(e.status))
      .map((e) => e.customerId)
  );

  return (
    <MapContainer
      center={HCMC_CENTER}
      zoom={12}
      className={`h-[600px] w-full rounded-lg ${className}`}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fit map to customer bounds on load */}
      {validCustomers.length > 0 && <MapBoundsController customers={validCustomers} />}

      {/* Customer markers with clustering */}
      <MarkerClusterGroup chunkedLoading>
        {validCustomers.map((customer) => (
          <Marker
            key={customer.id}
            position={[customer.latitude!, customer.longitude!]}
            icon={createCustomerIcon(customersWithExchanges.has(customer.id))}
          >
            <Popup minWidth={280} maxWidth={320}>
              <div className="p-2 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{customer.companyName}</div>
                    <div className="text-xs text-muted-foreground">{customer.code}</div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                    <span>{customer.address}, {customer.district}</span>
                  </div>
                  {customer.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{customer.contactPhone}</span>
                    </div>
                  )}
                  {customer.plantCount !== undefined && (
                    <div className="flex items-center gap-2">
                      <TreeDeciduous className="h-3 w-3 text-muted-foreground" />
                      <span>{customer.plantCount} cây</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {onCustomerClick && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => onCustomerClick(customer.id)}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      Chi tiết
                    </Button>
                  )}
                  {onCreateExchange && !customersWithExchanges.has(customer.id) && (
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => onCreateExchange(customer.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Đổi cây
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {/* Exchange request markers (separate layer) */}
      {showExchangeLayer &&
        validExchanges.map((exchange) => (
          <Marker
            key={`exchange-${exchange.id}`}
            position={[exchange.latitude, exchange.longitude]}
            icon={createExchangeIcon(exchange.priorityScore)}
          >
            <Popup>
              <div className="p-2">
                <div className="font-semibold text-sm">{exchange.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  Ưu tiên: {exchange.priorityScore} | {exchange.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
