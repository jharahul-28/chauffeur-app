import { useMemo } from 'react';
import { Coordinate } from '../components/MapViewContainer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaypointType = 'PICKUP' | 'STOP' | 'DROP';

export interface RawWaypoint {
  id: number;
  waypointSequence: number;
  waypointType: WaypointType;
  latitude: number;
  longitude: number;
  address: string;
  arrivedAt?: string | null;
}

export interface RouteStop extends Coordinate {
  id: number;
  sequence: number;
  address: string;
}

export interface RoutePoints {
  /** PICKUP waypoint coordinate + metadata */
  pickup: RouteStop | null;
  /** Ordered intermediate STOPs (sequence ASC, between pickup and drop) */
  stops: RouteStop[];
  /** DROP waypoint coordinate + metadata */
  destination: RouteStop | null;
  /** All valid coordinates in full sequence order: pickup → stops → destination */
  allCoordinates: Coordinate[];
}

// ─── Coordinate Validation ────────────────────────────────────────────────────

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) &&
    isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

// ─── Core Processing ──────────────────────────────────────────────────────────

/**
 * Sort an array of raw waypoints by waypointSequence ascending.
 * Does not mutate the input.
 */
export function sortWaypoints(waypoints: RawWaypoint[]): RawWaypoint[] {
  return [...waypoints].sort((a, b) => a.waypointSequence - b.waypointSequence);
}

/**
 * Extract typed route points from a raw waypoints array.
 *
 * Rules:
 * - Waypoints are sorted by sequence before extraction.
 * - Only waypoints with valid, non-zero coordinates are included.
 * - There must be exactly one PICKUP and one DROP; additional ones are ignored
 *   (first PICKUP wins, first DROP wins — backend should not send multiples).
 * - STOPs are collected in sequence order between PICKUP and DROP.
 */
export function extractRoutePoints(waypoints: RawWaypoint[]): RoutePoints {
  const sorted = sortWaypoints(waypoints);

  let pickup: RouteStop | null = null;
  const stops: RouteStop[] = [];
  let destination: RouteStop | null = null;

  for (const wp of sorted) {
    if (!isValidCoordinate(wp.latitude, wp.longitude)) continue;

    const stop: RouteStop = {
      id: wp.id,
      sequence: wp.waypointSequence,
      latitude: wp.latitude,
      longitude: wp.longitude,
      address: wp.address,
    };

    switch (wp.waypointType) {
      case 'PICKUP':
        if (!pickup) pickup = stop;
        break;
      case 'STOP':
        stops.push(stop);
        break;
      case 'DROP':
        if (!destination) destination = stop;
        break;
    }
  }

  const allCoordinates: Coordinate[] = [
    ...(pickup ? [{ latitude: pickup.latitude, longitude: pickup.longitude }] : []),
    ...stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
    ...(destination ? [{ latitude: destination.latitude, longitude: destination.longitude }] : []),
  ];

  return { pickup, stops, destination, allCoordinates };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Memoised hook wrapper — prevents recalculating route points on every render.
 * Pass the raw waypoints array from the booking; only recomputes when the
 * reference changes (i.e. a new booking is loaded).
 */
export function useRoutePoints(waypoints: RawWaypoint[] | undefined): RoutePoints {
  return useMemo(
    () => extractRoutePoints(waypoints ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [waypoints],
  );
}
