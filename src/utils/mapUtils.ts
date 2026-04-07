import { Coordinate } from '@/src/components/MapViewContainer';

// ─── Pickup Coordinate ────────────────────────────────────────────────────────

/**
 * Dummy pickup coordinate — replace with API-resolved coordinates in production.
 * The driver-home screen uses this when no real coordinate is passed.
 */
export const DUMMY_PICKUP_COORDINATE: Coordinate = {
  latitude: 12.9716,
  longitude: 77.5946,
};

// ─── Route Building ───────────────────────────────────────────────────────────

/**
 * Returns a straight-line route between two coordinates.
 *
 * This is the fallback implementation. To plug in real routing:
 *   1. Call fetchDirectionsRoute() below (uncomment when ready)
 *   2. Decode the overview_polyline from the Directions API response
 *   3. Return the decoded coordinate array in place of [from, to]
 */
export function buildStraightLineRoute(
  from: Coordinate,
  to: Coordinate,
): Coordinate[] {
  return [from, to];
}

// ─── Map Fit Padding ──────────────────────────────────────────────────────────

/**
 * Edge padding for MapView.fitToCoordinates().
 * Bottom is larger to account for the pickup drawer sitting above the fold.
 */
export const MAP_FIT_PADDING = {
  top: 120,
  right: 60,
  bottom: 280,
  left: 60,
} as const;

// ─── Future: Google Directions API ───────────────────────────────────────────
// Uncomment and implement when real routing is needed.
//
// export async function fetchDirectionsRoute(
//   from: Coordinate,
//   to: Coordinate,
//   apiKey: string,
// ): Promise<Coordinate[]> {
//   const origin = `${from.latitude},${from.longitude}`;
//   const dest   = `${to.latitude},${to.longitude}`;
//   const url    = `https://maps.googleapis.com/maps/api/directions/json`
//                + `?origin=${origin}&destination=${dest}&key=${apiKey}`;
//   const res    = await fetch(url);
//   const data   = await res.json();
//   if (data.routes?.[0]?.overview_polyline?.points) {
//     return decodePolyline(data.routes[0].overview_polyline.points);
//   }
//   return [from, to]; // fallback
// }
