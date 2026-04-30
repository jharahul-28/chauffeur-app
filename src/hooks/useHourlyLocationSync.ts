import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getCurrentLocation } from '../services/locationService';
import { updateDriverLocation } from '../services/rideService';
import { setActiveBookingVehicleId, removeActiveBookingVehicleId, getActiveBookingVehicleId } from '../storage/tokenStorage';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../services/locationTask';
import { useLocationStore } from '../state/useLocationStore';

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
  const setSyncResponse = useLocationStore((state) => state.setSyncResponse);

  // Sync background data to UI via native events
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('LOCATION_SYNC_UPDATE', (data) => {
      console.log('[useHourlyLocationSync] 📬 Received Native Update:', data.rideStartTime);
      setSyncResponse(data);
    });
    return () => sub.remove();
  }, [setSyncResponse]);

  const bookingVehicleIdRef = useRef(bookingVehicleId);
  bookingVehicleIdRef.current = bookingVehicleId;

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
        useLocationStore.getState().setSyncResponse({
          waypoint: response.waypoint,
          distanceMeters: response.distanceMeters,
          rideStartTime: response.rideStartTime,
          arrived: response.arrived ?? false,
        });
      }
    } catch (err) {
      console.error('[useHourlyLocationSync] tick failed, will retry:', err);
    }
  }, []);

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!bookingVehicleId) return;

    const startBackgroundSync = async () => {
      try {
        // 1. Set the active ID for the background task to pick up
        await setActiveBookingVehicleId(bookingVehicleId);

        // 2. Request permissions & start native background task
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          console.warn('[useHourlyLocationSync] Foreground permission denied');
          return;
        }

        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.warn('[useHourlyLocationSync] Background permission denied');
          // We can still run in foreground, but background will be limited
        }

        console.log('[useHourlyLocationSync] Checking if native tracking is already active...');
        const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        const activeId = await getActiveBookingVehicleId();

        if (isRunning && activeId === bookingVehicleId) {
          console.log('[useHourlyLocationSync] Tracking already active, skipping start.');
          isStoppedRef.current = false;
          doSync();
          return;
        }

        if (isRunning) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: SYNC_INTERVAL_MS,
          distanceInterval: 0, 
          foregroundService: {
            notificationTitle: 'Hourly Ride Tracking',
            notificationBody: 'Velvet is tracking your location for the hourly ride.',
            notificationColor: '#EDB96D',
          },
          pausesUpdatesAutomatically: false,
          deferredUpdatesInterval: SYNC_INTERVAL_MS,
          deferredUpdatesDistance: 0,
        });

        console.log('[useHourlyLocationSync] 🚀 Native Hourly Tracking STARTED for BV ID:', bookingVehicleId);

        isStoppedRef.current = false;
        doSync(); // immediate first tick
      } catch (err) {
        console.error('[useHourlyLocationSync] Failed to start native sync:', err);
      }
    };

    startBackgroundSync();

    return () => {
      isStoppedRef.current = true;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then((started) => {
        if (started) Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      });
      removeActiveBookingVehicleId();
      useLocationStore.getState().clearLocationState();
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
    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    removeActiveBookingVehicleId();

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

  const rideStartTime = useLocationStore((state) => state.rideStartTime);

  return { rideStartTime, sendFinalAndStop };
}
