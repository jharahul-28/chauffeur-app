import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation } from '../services/locationService';
import { updateDriverLocation, NextWaypoint } from '../services/rideService';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 30_000;

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Sends driver GPS location to the backend every 30 seconds unconditionally.
 *
 * Lifecycle: call startSync() when the trip begins and stopSync() when it ends
 * or the screen unmounts. The hook guarantees only one interval runs at a time.
 */
export function useLocationSync(
  bookingVehicleId: string | undefined,
  onArrivedAtPickup?: () => void,
): {
  startSync: () => void;
  stopSync: () => void;
  /** Most recent next-waypoint from the location-update API. Updates every sync tick. */
  nextWaypoint: NextWaypoint | null;
} {
  // Stable refs so the interval closure always reads the latest values
  const bookingVehicleIdRef = useRef(bookingVehicleId);
  bookingVehicleIdRef.current = bookingVehicleId;

  const onArrivedAtPickupRef = useRef(onArrivedAtPickup);
  onArrivedAtPickupRef.current = onArrivedAtPickup;

  const [nextWaypoint, setNextWaypoint] = useState<NextWaypoint | null>(null);

  const isRunningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(async () => {
    if (!isRunningRef.current) return;

    const bvId = bookingVehicleIdRef.current;
    if (!bvId) return;

    const loc = await getCurrentLocation();
    if (!loc) {
      console.warn('[useLocationSync] Location unavailable, skipping this tick');
      return;
    }

    const { latitude: lat, longitude: lng } = loc;

    console.log('[useLocationSync] Location Sync Triggered', { bookingVehicleId: bvId, lat, lng });

    try {
      const response = await updateDriverLocation(bvId, lat, lng);
      if (response.waypoint) {
        setNextWaypoint(response.waypoint);
      }
      if (response.arrived && response.waypoint?.type === 'PICKUP') {
        onArrivedAtPickupRef.current?.();
      }
    } catch (err) {
      console.error('[useLocationSync] location update failed, will retry next cycle:', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startSync = useCallback(() => {
    if (isRunningRef.current) return; // guard against duplicate intervals

    isRunningRef.current = true;

    sync(); // fire immediately, then every 30s
    intervalRef.current = setInterval(sync, SYNC_INTERVAL_MS);
  }, [sync]);

  const stopSync = useCallback(() => {
    isRunningRef.current = false;

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount regardless of whether stopSync was called explicitly
  useEffect(() => () => stopSync(), [stopSync]);

  return { startSync, stopSync, nextWaypoint };
}
