import * as Location from 'expo-location';
import { useCallback, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { setActiveBookingVehicleId, removeActiveBookingVehicleId, getActiveBookingVehicleId } from '../storage/tokenStorage';
import { LOCATION_TASK_NAME } from '../services/locationTask';
import { useLocationStore } from '../state/useLocationStore';
import { getCurrentLocation } from '../services/locationService';
import { updateDriverLocation } from '../services/rideService';

/**
 * Manages background location tracking lifecycle.
 * Uses expo-location background updates and expo-task-manager.
 * 
 * Note: Background tracking requires "Always" location permission.
 */
export function useLocationSync(bookingVehicleId: string | undefined) {
  const setSyncResponse = useLocationStore((state) => state.setSyncResponse);

  // Listen for native events from the background task (since Zustand stores aren't
  // shared between main JS and background task JS contexts on Android).
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('LOCATION_SYNC_UPDATE', (data) => {
      console.log('[useLocationSync] 📬 Received Native Update:', data.waypoint?.type);
      setSyncResponse(data);
    });
    return () => sub.remove();
  }, [setSyncResponse]);
  
  const startSync = useCallback(async () => {
    if (!bookingVehicleId) return;

    try {
      // 1. Request Permissions
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        console.warn('[useLocationSync] Foreground location permission denied');
        return;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.warn('[useLocationSync] Background location permission denied. Updates will only work in foreground.');
        // We continue anyway, as it might still work in foreground or the user might grant it later
      }

      // 2. Persist ID for the background task to read from AsyncStorage
      await setActiveBookingVehicleId(bookingVehicleId);

      // 3. Start Background Updates
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      
      // If it's already running with the right ID, don't restart to avoid "stacking"
      const activeId = await getActiveBookingVehicleId();
      if (isRunning && activeId === bookingVehicleId) {
        console.log('[useLocationSync] Tracking already active for this ID, skipping restart.');
        return;
      }

      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 0, // We use time-based throttling in the task now
        // Android Specific: Keeps the app process alive after kill
        foregroundService: {
          notificationTitle: 'Trip Tracking Active',
          notificationBody: 'Velvet is syncing your location for the active ride.',
          notificationColor: '#FFC107',
        },
        pausesUpdatesAutomatically: false,
        deferredUpdatesInterval: 30000,
        deferredUpdatesDistance: 0,
      });

      console.log('[useLocationSync] 🚀 Native Background Tracking STARTED for BV ID:', bookingVehicleId);

      // 4. Immediate first tick so the Map gets data right away
      (async () => {
        const loc = await getCurrentLocation();
        if (loc) {
          const resp = await updateDriverLocation(bookingVehicleId, loc.latitude, loc.longitude);
          useLocationStore.getState().setSyncResponse({
            waypoint: resp.waypoint,
            distanceMeters: resp.distanceMeters,
            rideStartTime: resp.rideStartTime,
          });
        }
      })();
    } catch (err) {
      console.error('[useLocationSync] Failed to start background tracking:', err);
    }
  }, [bookingVehicleId]);

  const stopSync = useCallback(async () => {
    try {
      // 1. Remove ID from storage
      await removeActiveBookingVehicleId();

      // 2. Clear global state
      useLocationStore.getState().clearLocationState();

      // 3. Stop Background Updates
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[useLocationSync] Background location tracking stopped');
      }
    } catch (err) {
      console.error('[useLocationSync] Failed to stop background tracking:', err);
    }
  }, []);

  const nextWaypoint = useLocationStore((state) => state.nextWaypoint);

  return { startSync, stopSync, nextWaypoint };
}
