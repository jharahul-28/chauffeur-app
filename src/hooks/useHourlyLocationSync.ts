import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation } from '../services/locationService';
import { updateDriverLocation } from '../services/rideService';

const SYNC_INTERVAL_MS = 30_000;

interface UseHourlyLocationSyncResult {
  /**
   * Most recent rideStartTime returned by the location-update API.
   * Null until the first successful sync tick.
   */
  rideStartTime: string | null;
  /**
   * Send one final location update then permanently stop the interval.
   * Returns a promise that resolves when the final POST completes (or rejects).
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  sendFinalAndStop: () => Promise<void>;
}

/**
 * Location sync for hourly rentals.
 *
 * Differences from the one-way useLocationSync:
 *  - Starts automatically on mount (no manual startSync() needed).
 *  - Never calls an onArrivedAtPickup callback — irrelevant for hourly.
 *  - Exposes sendFinalAndStop() for the end-ride flow:
 *      1. Clears the interval immediately so no more ticks fire.
 *      2. Sends one last POST location-update.
 *      3. Resolves so the caller can then POST end-ride.
 *  - Captures rideStartTime from every API response so the timer hook
 *    always has the authoritative server value.
 */
export function useHourlyLocationSync(
  bookingVehicleId: string | undefined,
): UseHourlyLocationSyncResult {
  const bookingVehicleIdRef = useRef(bookingVehicleId);
  bookingVehicleIdRef.current = bookingVehicleId;

  const [rideStartTime, setRideStartTime] = useState<string | null>(null);
  const rideStartTimeRef = useRef<string | null>(null);

  const isStoppedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core sync tick ──────────────────────────────────────────────────────────
  const doSync = useCallback(async (): Promise<void> => {
    if (isStoppedRef.current) return;

    const bvId = bookingVehicleIdRef.current;
    if (!bvId) return;

    const loc = await getCurrentLocation();
    if (!loc) {
      console.warn('[useHourlyLocationSync] GPS unavailable, skipping tick');
      return;
    }

    // Guard again after the async GPS call — stop may have been called while waiting
    if (isStoppedRef.current) return;

    try {
      const response = await updateDriverLocation(bvId, loc.latitude, loc.longitude);
      if (response.rideStartTime && response.rideStartTime !== rideStartTimeRef.current) {
        rideStartTimeRef.current = response.rideStartTime;
        setRideStartTime(response.rideStartTime);
      }
    } catch (err) {
      console.error('[useHourlyLocationSync] tick failed, will retry:', err);
    }
  }, []);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bookingVehicleId) return;

    isStoppedRef.current = false;
    doSync(); // immediate first tick
    intervalRef.current = setInterval(doSync, SYNC_INTERVAL_MS);

    return () => {
      isStoppedRef.current = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bookingVehicleId, doSync]);

  // ── Final update + stop ─────────────────────────────────────────────────────

  const sendFinalAndStop = useCallback(async (): Promise<void> => {
    if (isStoppedRef.current) return; // already stopped — no-op

    // Stop interval first so no more background ticks fire during the final POST
    isStoppedRef.current = true;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const bvId = bookingVehicleIdRef.current;
    if (!bvId) return;

    const loc = await getCurrentLocation();
    if (!loc) {
      console.warn('[useHourlyLocationSync] GPS unavailable for final update — skipping');
      return;
    }

    try {
      await updateDriverLocation(bvId, loc.latitude, loc.longitude);
      console.log('[useHourlyLocationSync] final location update sent ✓');
    } catch (err) {
      // Non-fatal — end-ride proceeds regardless
      console.error('[useHourlyLocationSync] final location update failed:', err);
    }
  }, []);

  return { rideStartTime, sendFinalAndStop };
}
