import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { updateDriverLocation } from './rideService';
import { getActiveBookingVehicleId } from '../storage/tokenStorage';
import { useLocationStore } from '../state/useLocationStore';
import { DeviceEventEmitter } from 'react-native';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_SYNC';

let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 25000; // Throttle to roughly 25-30s

/**
 * Global task definition for background location tracking.
 * This MUST be defined at the top level of the JS bundle.
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTask] Background location error:', error);
    return;
  }

  if (data) {
    // Throttle check
    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL_MS) {
      return; // Skip this update, too frequent
    }

    const { locations } = data as { locations: Location.LocationObject[] };
    const latestLocation = locations[0];

    if (latestLocation) {
      const { latitude, longitude } = latestLocation.coords;
      
      try {
        const bvId = await getActiveBookingVehicleId();
        if (bvId) {
          console.log('[LocationTask] Syncing background location:', { bvId, latitude, longitude });
          const response = await updateDriverLocation(bvId, latitude, longitude);
          
          // Update global state AND emit a native event for the UI to catch
          const syncData = {
            waypoint: response.waypoint,
            distanceMeters: response.distanceMeters,
            rideStartTime: response.rideStartTime,
          };
          
          useLocationStore.getState().setSyncResponse(syncData);
          DeviceEventEmitter.emit('LOCATION_SYNC_UPDATE', syncData);
          lastSyncTimestamp = now; // Update timestamp only on success
        } else {
          // No active booking found in storage, we should probably stop the task
          // but we'll let the hook handle that to avoid race conditions.
          console.log('[LocationTask] No active booking vehicle ID found in storage, skipping sync.');
        }
      } catch (err) {
        console.error('[LocationTask] Failed to sync background location:', err);
      }
    }
  }
});
