/**
 * Geocoding Service
 * Uses Nominatim (OpenStreetMap) for address to coordinates
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "LocXanh-CRM/4.0";

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName?: string;
}

/**
 * Geocode an address to coordinates
 * Uses Nominatim with Vietnam context
 */
export async function geocodeAddress(
  address: string,
  city: string = "Ho Chi Minh"
): Promise<GeocodingResult | null> {
  const cacheKey = `${address}|${city}`;

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    return cached ? { ...cached } : null;
  }

  try {
    const params = new URLSearchParams({
      q: `${address}, ${city}, Vietnam`,
      format: "json",
      limit: "1",
      addressdetails: "1",
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      // Respect Nominatim's usage policy (max 1 request/second)
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) {
      console.error("Geocoding failed:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();

    if (data && data[0]) {
      const result: GeocodingResult = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };

      // Cache the result
      geocodeCache.set(cacheKey, { lat: result.lat, lng: result.lng });

      return result;
    }

    // Cache null result to avoid repeated failures
    geocodeCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: "json",
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.display_name ?? null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
