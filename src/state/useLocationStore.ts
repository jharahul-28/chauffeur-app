import { create } from 'zustand';
import { NextWaypoint } from '../services/rideService';

interface LocationState {
  /** The next destination/waypoint for the driver. Updated by the location sync task. */
  nextWaypoint: NextWaypoint | null;
  /** Distance in meters to the next waypoint. */
  distanceMeters: number;
  /** Server-side ride start time (for hourly). */
  rideStartTime: string | null;
  
  setNextWaypoint: (waypoint: NextWaypoint | null) => void;
  setSyncResponse: (data: { waypoint: NextWaypoint | null; distanceMeters: number; rideStartTime?: string | null }) => void;
  clearLocationState: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  nextWaypoint: null,
  distanceMeters: 0,
  rideStartTime: null,

  setNextWaypoint: (waypoint) => set({ nextWaypoint: waypoint }),
  
  setSyncResponse: (data) => set({ 
    nextWaypoint: data.waypoint, 
    distanceMeters: data.distanceMeters,
    rideStartTime: data.rideStartTime || null 
  }),

  clearLocationState: () => set({ 
    nextWaypoint: null, 
    distanceMeters: 0, 
    rideStartTime: null 
  }),
}));
