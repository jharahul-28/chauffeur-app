import { Coordinate } from '../components/MapViewContainer';

// ─── Distance Calculation ──────────────────────────────────────────────────────

/** Metres between two lat/lng points (Haversine formula). */
export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 6_371_000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const a2 =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.sqrt(a2));
}

// ─── Route Refetch Throttle ────────────────────────────────────────────────────

/**
 * Returns true when the driver has moved at least `thresholdMeters` from the
 * last position at which a route was fetched — preventing excessive API calls.
 *
 * Always returns true on the first call (prev === null).
 */
export function shouldRefetchRoute(
  prev: Coordinate | null,
  curr: Coordinate,
  thresholdMeters = 40,
): boolean {
  if (!prev) return true;
  return haversineDistance(prev, curr) >= thresholdMeters;
}

// ─── Display Formatters ────────────────────────────────────────────────────────

/**
 * Format raw seconds → human-readable string.
 * e.g. 720 → "12 min", 3720 → "1 h 2 min"
 */
export function formatEta(durationSeconds: number): string {
  const totalMins = Math.round(durationSeconds / 60);
  if (totalMins < 1) return '< 1 min';
  if (totalMins < 60) return `${totalMins} min`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}

/**
 * Format raw metres → human-readable string.
 * e.g. 350 → "350 m", 3200 → "3.2 km"
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}
