import { useEffect, useRef } from 'react';
import { getCurrentLocation } from '../services/locationService';

// ─── Constants ─────────────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Simulates sending the driver's GPS location to the backend every 30 seconds.
 *
 * Lifecycle:
 *  - Starts the interval when `isActive` is true (i.e. driver is logged in).
 *  - Clears the interval when `isActive` becomes false OR the component unmounts.
 *
 * Current implementation:
 *  - Logs the location to the console (mock — no real API call).
 *
 * Extensibility:
 *  - Replace the console.log with a real API call:
 *      await apiClient.post('/driver/location', { lat, lng, timestamp });
 *  - Add retry logic and offline queuing when network is unavailable.
 *  - Pass `rideId` to tag syncs with the active trip on the backend.
 *
 * @param isActive - Pass `true` when the driver is authenticated and online.
 */
export function useLocationSync(isActive: boolean): void {
  // Stable ref to avoid restarting the interval on every render
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    if (!isActive) return;

    const sync = async () => {
      const location = await getCurrentLocation();
      if (!location) return;

      const timestamp = new Date().toISOString();
      console.log(
        `[Driver Location Sync] lat: ${location.latitude.toFixed(6)}, ` +
          `lng: ${location.longitude.toFixed(6)}, ` +
          `timestamp: ${timestamp}`,
      );

      // TODO: replace with real backend call
      // await apiClient.post('/driver/location', {
      //   latitude: location.latitude,
      //   longitude: location.longitude,
      //   timestamp,
      // });
    };

    // Fire immediately on start, then every 30 seconds
    sync();
    const intervalId = setInterval(sync, SYNC_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive]);
}
