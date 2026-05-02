/**
 * TC-WP-001 through TC-WP-030
 * Unit tests for waypointUtils
 */

import {
  isValidCoordinate,
  sortWaypoints,
  extractRoutePoints,
} from '../../../src/utils/waypointUtils';
import type { RawWaypoint } from '../../../src/utils/waypointUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

const wp = (overrides: Partial<RawWaypoint>): RawWaypoint => ({
  id: 1,
  waypointId: 1,
  waypointSequence: 0,
  waypointType: 'PICKUP',
  latitude: 13.0,
  longitude: 77.5,
  address: 'Test Location',
  ...overrides,
});

// ── isValidCoordinate ─────────────────────────────────────────────────────────

describe('isValidCoordinate', () => {
  // TC-WP-001
  it('returns true for valid non-zero coordinates', () => {
    expect(isValidCoordinate(13.1986, 77.7066)).toBe(true);
  });

  // TC-WP-002
  it('returns false for (0, 0) — zero coordinates', () => {
    expect(isValidCoordinate(0, 0)).toBe(false);
  });

  // TC-WP-003
  it('returns false for non-finite latitude', () => {
    expect(isValidCoordinate(Infinity, 77.5)).toBe(false);
  });

  // TC-WP-004
  it('returns false for non-finite longitude', () => {
    expect(isValidCoordinate(13.0, NaN)).toBe(false);
  });

  // TC-WP-005
  it('returns false for string coordinates', () => {
    expect(isValidCoordinate('13.0' as any, 77.5)).toBe(false);
  });

  // TC-WP-006
  it('returns true for negative coordinates (southern hemisphere)', () => {
    expect(isValidCoordinate(-33.8688, 151.2093)).toBe(true);
  });
});

// ── sortWaypoints ─────────────────────────────────────────────────────────────

describe('sortWaypoints', () => {
  // TC-WP-007
  it('sorts by waypointSequence ascending', () => {
    const waypoints: RawWaypoint[] = [
      wp({ id: 3, waypointSequence: 2, waypointType: 'DROP' }),
      wp({ id: 1, waypointSequence: 0, waypointType: 'PICKUP' }),
      wp({ id: 2, waypointSequence: 1, waypointType: 'STOP' }),
    ];
    const sorted = sortWaypoints(waypoints);
    expect(sorted.map((w) => w.waypointType)).toEqual(['PICKUP', 'STOP', 'DROP']);
  });

  // TC-WP-008
  it('does not mutate the original array', () => {
    const original: RawWaypoint[] = [
      wp({ waypointSequence: 1, waypointType: 'STOP' }),
      wp({ waypointSequence: 0, waypointType: 'PICKUP' }),
    ];
    const origRef = original[0];
    sortWaypoints(original);
    expect(original[0]).toBe(origRef); // Original not mutated
  });

  // TC-WP-009
  it('handles empty array', () => {
    expect(sortWaypoints([])).toEqual([]);
  });
});

// ── extractRoutePoints ────────────────────────────────────────────────────────

describe('extractRoutePoints', () => {
  const pickupWp = wp({ id: 1, waypointId: 101, waypointSequence: 0, waypointType: 'PICKUP', latitude: 13.1986, longitude: 77.7066, address: 'Airport' });
  const stopWp = wp({ id: 2, waypointId: 103, waypointSequence: 1, waypointType: 'STOP', latitude: 13.0, longitude: 77.6, address: 'Hebbal' });
  const dropWp = wp({ id: 3, waypointId: 102, waypointSequence: 2, waypointType: 'DROP', latitude: 12.9716, longitude: 77.5946, address: 'MG Road' });

  // TC-WP-010
  it('extracts pickup, stops, and destination correctly', () => {
    const route = extractRoutePoints([pickupWp, stopWp, dropWp]);
    expect(route.pickup?.address).toBe('Airport');
    expect(route.stops).toHaveLength(1);
    expect(route.stops[0].address).toBe('Hebbal');
    expect(route.destination?.address).toBe('MG Road');
  });

  // TC-WP-011
  it('allCoordinates includes pickup → stops → destination in order', () => {
    const route = extractRoutePoints([pickupWp, stopWp, dropWp]);
    expect(route.allCoordinates).toHaveLength(3);
    expect(route.allCoordinates[0]).toEqual({ latitude: 13.1986, longitude: 77.7066 });
    expect(route.allCoordinates[1]).toEqual({ latitude: 13.0, longitude: 77.6 });
    expect(route.allCoordinates[2]).toEqual({ latitude: 12.9716, longitude: 77.5946 });
  });

  // TC-WP-012
  it('sorts waypoints by sequence before extraction (order-independent input)', () => {
    const route = extractRoutePoints([dropWp, stopWp, pickupWp]); // Reversed input
    expect(route.pickup?.address).toBe('Airport');
    expect(route.destination?.address).toBe('MG Road');
  });

  // TC-WP-013
  it('skips waypoints with invalid (zero) coordinates', () => {
    const invalidWp = wp({ id: 4, waypointId: 104, waypointSequence: 3, waypointType: 'STOP', latitude: 0, longitude: 0 });
    const route = extractRoutePoints([pickupWp, invalidWp, dropWp]);
    expect(route.stops).toHaveLength(0); // Invalid stop excluded
  });

  // TC-WP-014
  it('handles missing pickup (no PICKUP waypoint)', () => {
    const route = extractRoutePoints([stopWp, dropWp]);
    expect(route.pickup).toBeNull();
    expect(route.destination?.address).toBe('MG Road');
  });

  // TC-WP-015
  it('handles missing destination (hourly rental — no DROP)', () => {
    const route = extractRoutePoints([pickupWp, stopWp]);
    expect(route.destination).toBeNull();
    expect(route.pickup?.address).toBe('Airport');
  });

  // TC-WP-016
  it('handles empty waypoints array', () => {
    const route = extractRoutePoints([]);
    expect(route.pickup).toBeNull();
    expect(route.stops).toEqual([]);
    expect(route.destination).toBeNull();
    expect(route.allCoordinates).toEqual([]);
  });

  // TC-WP-017
  it('uses first PICKUP if multiple exist (duplicate guard)', () => {
    const pickup2 = wp({ id: 5, waypointId: 105, waypointSequence: 3, waypointType: 'PICKUP', latitude: 14.0, longitude: 78.0, address: 'Second Pickup' });
    const route = extractRoutePoints([pickupWp, pickup2, dropWp]);
    expect(route.pickup?.address).toBe('Airport'); // First one wins
  });

  // TC-WP-018
  it('uses first DROP if multiple exist (duplicate guard)', () => {
    const drop2 = wp({ id: 6, waypointId: 106, waypointSequence: 3, waypointType: 'DROP', latitude: 12.8, longitude: 77.4, address: 'Second Drop' });
    const route = extractRoutePoints([pickupWp, dropWp, drop2]);
    expect(route.destination?.address).toBe('MG Road'); // First one wins
  });

  // TC-WP-019
  it('handles multiple stops in correct sequence order', () => {
    const stop1 = wp({ id: 2, waypointId: 201, waypointSequence: 1, waypointType: 'STOP', latitude: 13.1, longitude: 77.6, address: 'Stop 1' });
    const stop2 = wp({ id: 3, waypointId: 202, waypointSequence: 2, waypointType: 'STOP', latitude: 13.05, longitude: 77.55, address: 'Stop 2' });
    const route = extractRoutePoints([pickupWp, stop2, stop1, dropWp]);
    expect(route.stops[0].address).toBe('Stop 1');
    expect(route.stops[1].address).toBe('Stop 2');
  });

  // TC-WP-020
  it('allCoordinates is empty when no valid waypoints', () => {
    const invalidAll = [
      wp({ latitude: 0, longitude: 0, waypointType: 'PICKUP' }),
      wp({ latitude: 0, longitude: 0, waypointType: 'DROP' }),
    ];
    const route = extractRoutePoints(invalidAll);
    expect(route.allCoordinates).toEqual([]);
  });

  // TC-WP-021: waypointId is preserved correctly
  it('preserves waypointId for API calls (arrived-at-stop, skip-stop)', () => {
    const route = extractRoutePoints([pickupWp, stopWp, dropWp]);
    // The stop's id (used in RouteStop) comes from wp.id — critical for API calls
    expect(route.stops[0].id).toBe(stopWp.id);
  });
});
