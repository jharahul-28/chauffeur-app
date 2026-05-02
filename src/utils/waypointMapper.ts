/**
 * waypointMapper.ts
 *
 * Matches the "next target" waypoint from the location-update API against
 * the full booking waypoint list, and returns the matched booking waypoint
 * (including its stable `id` / waypointId) so it can be forwarded to action APIs.
 *
 * Matching priority (strict):
 *   1. placeId   — exact string match (primary, most reliable)
 *   2. lat/lng   — within GPS_TOLERANCE_DEG (~11 m at equator)
 *   3. type + address — normalised string, last resort
 *
 * The location-update API does NOT return waypointId. This utility bridges that
 * gap by resolving waypointId from the booking waypoint list.
 */

import { RawWaypoint } from './waypointUtils';
import { NextWaypoint } from '../services/rideService';

// ─── Constants ────────────────────────────────────────────────────────────────

/** ~11 m at the equator — tight enough to avoid ambiguity, loose enough for GPS jitter. */
const GPS_TOLERANCE_DEG = 0.0001;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseAddress(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function coordsMatch(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): boolean {
  return (
    Math.abs(lat1 - lat2) <= GPS_TOLERANCE_DEG &&
    Math.abs(lng1 - lng2) <= GPS_TOLERANCE_DEG
  );
}

// ─── Core Matcher ─────────────────────────────────────────────────────────────

/**
 * Returns the full booking waypoint that matches the location-update waypoint,
 * or null when no match is found.
 *
 * Always prefers the earliest match per priority pass — does not fall through
 * to lower-priority passes once a match is found.
 */
export function getMatchedWaypoint(
  locationWaypoint: NextWaypoint,
  bookingWaypoints: RawWaypoint[],
): RawWaypoint | null {
  if (!bookingWaypoints.length) return null;

  console.log('[waypointMapper] Location waypoint:', locationWaypoint);

  // ── Pass 1: placeId ────────────────────────────────────────────────────────
  if (locationWaypoint.placeId) {
    const match = bookingWaypoints.find(
      (wp) => wp.placeId && wp.placeId === locationWaypoint.placeId,
    ) ?? null;
    if (match) {
      console.log('[waypointMapper] Matched via placeId → waypointId:', match.waypointId, match);
      return match;
    }
    console.log('[waypointMapper] placeId present but no booking waypoint matched — falling through');
  }

  // ── Pass 2: lat/lng ────────────────────────────────────────────────────────
  const coordMatch = bookingWaypoints.find(
    (wp) => coordsMatch(
      locationWaypoint.latitude, locationWaypoint.longitude,
      wp.latitude, wp.longitude,
    ),
  ) ?? null;
  if (coordMatch) {
    console.log('[waypointMapper] Matched via lat/lng → waypointId:', coordMatch.waypointId, coordMatch);
    return coordMatch;
  }

  // ── Pass 3: type + address ─────────────────────────────────────────────────
  // Normalise location API type to booking API type ('DESTINATION' → 'DROP')
  const normType = (locationWaypoint.type === ('DESTINATION' as string) ? 'DROP' : locationWaypoint.type) as RawWaypoint['waypointType'];
  const normAddress = normaliseAddress(locationWaypoint.address ?? '');

  if (normAddress) {
    const addrMatch = bookingWaypoints.find(
      (wp) => wp.waypointType === normType && normaliseAddress(wp.address) === normAddress,
    ) ?? null;
    if (addrMatch) {
      console.log('[waypointMapper] Matched via address → waypointId:', addrMatch.waypointId, addrMatch);
      return addrMatch;
    }
  }

  console.warn('[waypointMapper] ⚠️ Waypoint mapping failed — cannot perform action', {
    locationWaypoint,
    bookingWaypointCount: bookingWaypoints.length,
  });
  return null;
}

// ─── Active Waypoint Derivation ───────────────────────────────────────────────

export interface ActiveWaypointResult {
  /** Index into the sorted booking waypoints array. -1 = unknown. */
  index: number;
  /** The full matched booking waypoint (contains stable id / waypointId). */
  waypoint: RawWaypoint | null;
  /**
   * True only when a match was found AND the location-update type === 'STOP'.
   * Guards all stop-action button rendering and API calls.
   */
  isActionableStop: boolean;
  /**
   * The resolved waypointId to forward to action APIs.
   * null when mapping failed — buttons must be disabled in this state.
   */
  waypointId: number | null;
}

/**
 * Derives the currently active waypoint from a location-update response,
 * resolving the stable waypointId needed for action APIs.
 *
 * Pure function — memoize at the call site with useMemo.
 */
export function deriveActiveWaypoint(
  locationWaypoint: NextWaypoint | null,
  bookingWaypoints: RawWaypoint[],
): ActiveWaypointResult {
  if (!locationWaypoint || !bookingWaypoints.length) {
    return { index: -1, waypoint: null, isActionableStop: false, waypointId: null };
  }

  const matched = getMatchedWaypoint(locationWaypoint, bookingWaypoints);
  const index = matched ? bookingWaypoints.indexOf(matched) : -1;

  const isActionableStop = matched !== null && locationWaypoint.type === 'STOP';
  const waypointId = matched?.waypointId ?? null;

  return { index, waypoint: matched, isActionableStop, waypointId };
}
