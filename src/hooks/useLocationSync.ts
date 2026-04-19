import { useCallback, useEffect, useRef } from 'react';
import { getCurrentLocation } from '../services/locationService';
import { updateDriverLocation } from '../services/rideService';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 30_000;
const DISTANCE_THRESHOLD_M = 25;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Sends driver GPS location to the backend every 30 seconds.
 *
 * Skips the API call if the driver hasn't moved more than 25 m since the last
 * successful send, preventing unnecessary traffic at standstills.
 *
 * Lifecycle: call startSync() when the trip begins and stopSync() when it ends
 * or the screen unmounts. The hook guarantees only one interval runs at a time.
 *
 * Extensibility: replace the 30-second interval with a WebSocket push, or add
 * an offline queue by buffering failed calls in a ref and flushing on reconnect.
 */
export function useLocationSync(
  bookingVehicleId: string | undefined,
  onArrivedAtPickup?: () => void,
): {
  startSync: () => void;
  stopSync: () => void;
} {
  // Stable refs so the interval closure always reads the latest values
  const bookingVehicleIdRef = useRef(bookingVehicleId);
  bookingVehicleIdRef.current = bookingVehicleId;

  const onArrivedAtPickupRef = useRef(onArrivedAtPickup);
  onArrivedAtPickupRef.current = onArrivedAtPickup;

  const isRunningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // All refs → stable reference, never recreated
  const sync = useCallback(async () => {
    if (!isRunningRef.current) return;

    const bvId = bookingVehicleIdRef.current;
    if (!bvId) return;

    const loc = await getCurrentLocation();
    if (!loc) return;

    const { latitude: lat, longitude: lng } = loc;

    if (lastPositionRef.current) {
      const dist = haversineMeters(
        lastPositionRef.current.lat,
        lastPositionRef.current.lng,
        lat,
        lng,
      );
      if (dist < DISTANCE_THRESHOLD_M) return;
    }

    lastPositionRef.current = { lat, lng };

    try {
      const response = await updateDriverLocation(bvId, lat, lng);
      if (response.arrived && response.arrivedWaypointType === 'PICKUP') {
        onArrivedAtPickupRef.current?.();
      }
    } catch (err) {
      console.error('[useLocationSync] location update failed, will retry next cycle:', err);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startSync = useCallback(() => {
    if (isRunningRef.current) return; // guard against duplicate intervals

    isRunningRef.current = true;
    lastPositionRef.current = null; // reset so first tick always sends

    sync();
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

  return { startSync, stopSync };
}
