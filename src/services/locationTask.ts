import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { updateDriverLocation } from './rideService';
import { getActiveBookingVehicleId } from '../storage/tokenStorage';

export const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_SYNC';

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
    const { locations } = data as { locations: Location.LocationObject[] };
    const latestLocation = locations[0];

    if (latestLocation) {
      const { latitude, longitude } = latestLocation.coords;
      
      try {
        const bvId = await getActiveBookingVehicleId();
        if (bvId) {
          console.log('[LocationTask] Syncing background location:', { bvId, latitude, longitude });
          await updateDriverLocation(bvId, latitude, longitude);
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
