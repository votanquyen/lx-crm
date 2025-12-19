/**
 * Google Maps Route Optimizer
 * Optimize delivery routes using Google Maps Directions API
 */
import { Client, TravelMode, DirectionsResponse } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export interface Stop {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  plantCount: number;
  estimatedDurationMins?: number;
}

export interface OptimizedRoute {
  stops: Stop[];
  totalDistanceKm: number;
  totalDurationMins: number;
  polyline?: string;
  waypoints: Array<{
    stopOrder: number;
    stop: Stop;
    eta: string;
    distanceFromPrevious: number;
    durationFromPrevious: number;
  }>;
}

/**
 * Optimize route using Google Maps Directions API
 * @param stops - Array of stops to visit
 * @param startLocation - Optional starting point (default: first stop)
 * @returns Optimized route with distances and durations
 */
export async function optimizeRoute(
  stops: Stop[],
  startLocation?: { lat: number; lng: number }
): Promise<OptimizedRoute> {
  if (stops.length === 0) {
    throw new Error("No stops provided");
  }

  if (stops.length === 1) {
    return {
      stops,
      totalDistanceKm: 0,
      totalDurationMins: stops[0].estimatedDurationMins || 30,
      waypoints: [
        {
          stopOrder: 1,
          stop: stops[0],
          eta: "08:00",
          distanceFromPrevious: 0,
          durationFromPrevious: 0,
        },
      ],
    };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set, using simple ordering");
    return simpleRouteOptimization(stops);
  }

  try {
    // Use first stop as origin and last as destination
    const origin = startLocation
      ? `${startLocation.lat},${startLocation.lng}`
      : `${stops[0].latitude},${stops[0].longitude}`;

    const destination = `${stops[stops.length - 1].latitude},${stops[stops.length - 1].longitude}`;

    // Middle stops as waypoints
    const waypoints = stops
      .slice(startLocation ? 0 : 1, -1)
      .map((stop) => `${stop.latitude},${stop.longitude}`);

    // Call Google Maps Directions API
    const response = await client.directions({
      params: {
        origin,
        destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        optimize: true, // Optimize waypoint order
        mode: TravelMode.driving,
        key: apiKey,
      },
    });

    if (response.data.status !== "OK") {
      console.error("Google Maps API error:", response.data.status);
      return simpleRouteOptimization(stops);
    }

    return parseDirectionsResponse(response.data, stops, startLocation !== undefined);
  } catch (error) {
    console.error("Route optimization error:", error);
    // Fallback to simple optimization
    return simpleRouteOptimization(stops);
  }
}

/**
 * Parse Google Maps Directions API response
 */
function parseDirectionsResponse(
  response: DirectionsResponse,
  stops: Stop[],
  hasStartLocation: boolean
): OptimizedRoute {
  const route = response.routes[0];
  if (!route) {
    return simpleRouteOptimization(stops);
  }

  const legs = route.legs;
  let totalDistance = 0;
  let totalDuration = 0;

  // Get optimized waypoint order
  const waypointOrder = route.waypoint_order || [];
  const reorderedStops = hasStartLocation
    ? stops
    : [
        stops[0],
        ...waypointOrder.map((index) => stops[index + 1]),
        stops[stops.length - 1],
      ];

  // Calculate waypoints with ETAs
  const waypoints = [];
  let currentTime = new Date();
  currentTime.setHours(8, 0, 0, 0); // Start at 8:00 AM

  for (let i = 0; i < reorderedStops.length; i++) {
    const stop = reorderedStops[i];
    const leg = legs[i];

    if (leg) {
      totalDistance += leg.distance.value / 1000; // Convert to km
      totalDuration += leg.duration.value / 60; // Convert to minutes
    }

    // Add stop duration (service time)
    const stopDuration = stop.estimatedDurationMins || 30;
    currentTime = new Date(currentTime.getTime() + stopDuration * 60000);

    waypoints.push({
      stopOrder: i + 1,
      stop,
      eta: `${currentTime.getHours().toString().padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`,
      distanceFromPrevious: leg ? leg.distance.value / 1000 : 0,
      durationFromPrevious: leg ? leg.duration.value / 60 : 0,
    });

    // Add travel time to next stop
    if (leg) {
      currentTime = new Date(currentTime.getTime() + leg.duration.value * 1000);
    }
  }

  return {
    stops: reorderedStops,
    totalDistanceKm: Math.round(totalDistance * 10) / 10,
    totalDurationMins: Math.round(totalDuration),
    polyline: route.overview_polyline?.points,
    waypoints,
  };
}

/**
 * Simple route optimization (fallback when Google Maps API unavailable)
 * Uses nearest neighbor algorithm
 */
function simpleRouteOptimization(stops: Stop[]): OptimizedRoute {
  if (stops.length <= 2) {
    return {
      stops,
      totalDistanceKm: 0,
      totalDurationMins: stops.reduce((sum, s) => sum + (s.estimatedDurationMins || 30), 0),
      waypoints: stops.map((stop, i) => ({
        stopOrder: i + 1,
        stop,
        eta: calculateEta(i, stops),
        distanceFromPrevious: 0,
        durationFromPrevious: 0,
      })),
    };
  }

  // Nearest neighbor optimization
  const optimized: Stop[] = [stops[0]];
  const remaining = stops.slice(1);

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    optimized.push(remaining[nearestIndex]);
    remaining.splice(nearestIndex, 1);
  }

  return {
    stops: optimized,
    totalDistanceKm: 0,
    totalDurationMins: optimized.reduce((sum, s) => sum + (s.estimatedDurationMins || 30), 0),
    waypoints: optimized.map((stop, i) => ({
      stopOrder: i + 1,
      stop,
      eta: calculateEta(i, optimized),
      distanceFromPrevious: 0,
      durationFromPrevious: 0,
    })),
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated time of arrival
 */
function calculateEta(index: number, stops: Stop[]): string {
  const startHour = 8;
  const startMinute = 0;

  let totalMinutes = startMinute;
  for (let i = 0; i <= index; i++) {
    totalMinutes += stops[i].estimatedDurationMins || 30;
    if (i < index) {
      totalMinutes += 15; // Travel time between stops
    }
  }

  const hours = Math.floor(totalMinutes / 60) + startHour;
  const minutes = totalMinutes % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
