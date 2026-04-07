import { useState, useCallback } from 'react';
import { ActiveRide, RideStatus } from '../types/ride';
import { MOCK_ACTIVE_RIDE } from '../data/mockTripData';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the local state of the active ride.
 *
 * Usage:
 *   const { ride, initRide, updateStatus, clearRide } = useRideStore();
 *
 * Extensibility:
 *   - Replace `initRide` with an API call that populates real ride data
 *   - Replace `updateStatus` with a mutation that syncs state to the backend
 *   - Add `updateStoppages` to handle dynamic stoppage changes mid-trip
 */
export function useRideStore() {
  const [ride, setRide] = useState<ActiveRide | null>(null);

  /**
   * Initialise a new ride from mock data (or partial real data overrides).
   * Called when the driver taps "Go to Pickup".
   */
  const initRide = useCallback((overrides?: Partial<Omit<ActiveRide, 'status'>>) => {
    setRide({
      ...MOCK_ACTIVE_RIDE,
      status: 'GOING_TO_PICKUP',
      ...overrides,
    });
  }, []);

  /**
   * Advance the ride state machine to the next status.
   * Safe to call when `ride` is null (no-op).
   */
  const updateStatus = useCallback((status: RideStatus) => {
    setRide((prev) => (prev ? { ...prev, status } : null));
  }, []);

  /**
   * Tear down the current ride.
   * Called after trip completion, cancellation, or navigating back.
   */
  const clearRide = useCallback(() => {
    setRide(null);
  }, []);

  return { ride, initRide, updateStatus, clearRide };
}
