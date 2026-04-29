import * as Location from 'expo-location';
import { useCallback, useEffect } from 'react';
import { setActiveBookingVehicleId, removeActiveBookingVehicleId } from '../storage/tokenStorage';
import { LOCATION_TASK_NAME } from '../services/locationTask';

/**
 * Manages background location tracking lifecycle.
 * Uses expo-location background updates and expo-task-manager.
 * 
 * Note: Background tracking requires "Always" location permission.
 */
export function useLocationSync(bookingVehicleId: string | undefined) {
  
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
      // We check if it's already running to avoid duplicate tasks
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 20, // 20 meters
        // Android Specific: Shows a persistent notification to keep the app alive
        foregroundService: {
          notificationTitle: 'Trip Tracking Active',
          notificationBody: 'Velvet is syncing your location for the active ride.',
          notificationColor: '#FFC107',
        },
        pausesUpdatesAutomatically: false,
      });

      console.log('[useLocationSync] Background location tracking started for:', bookingVehicleId);
    } catch (err) {
      console.error('[useLocationSync] Failed to start background tracking:', err);
    }
  }, [bookingVehicleId]);

  const stopSync = useCallback(async () => {
    try {
      // 1. Remove ID from storage
      await removeActiveBookingVehicleId();

      // 2. Stop Background Updates
      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[useLocationSync] Background location tracking stopped');
      }
    } catch (err) {
      console.error('[useLocationSync] Failed to stop background tracking:', err);
    }
  }, []);

  // Return nextWaypoint as null for now, as it's handled in the task or should be moved to a global store
  return { startSync, stopSync, nextWaypoint: null };
}
