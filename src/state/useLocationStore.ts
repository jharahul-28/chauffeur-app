import { create } from 'zustand';
import { NextWaypoint } from '../services/rideService';

interface LocationState {
  /** The next destination/waypoint for the driver. Updated by the location sync task. */
  nextWaypoint: NextWaypoint | null;
  /** Distance in meters to the next waypoint. */
  distanceMeters: number;
  /** Server-side ride start time (for hourly). */
  rideStartTime: string | null;
  /** Whether the driver has arrived at the current waypoint (set by backend). */
  arrived: boolean;
  
  setNextWaypoint: (waypoint: NextWaypoint | null) => void;
  setSyncResponse: (data: { waypoint: NextWaypoint | null; distanceMeters: number; rideStartTime?: string | null; arrived?: boolean }) => void;
  clearLocationState: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  nextWaypoint: null,
  distanceMeters: 0,
  rideStartTime: null,
  arrived: false,

  setNextWaypoint: (waypoint) => set({ nextWaypoint: waypoint }),
  
  setSyncResponse: (data) => set({ 
    nextWaypoint: data.waypoint, 
    distanceMeters: data.distanceMeters,
    rideStartTime: data.rideStartTime || null,
    arrived: data.arrived ?? false,
  }),

  clearLocationState: () => set({ 
    nextWaypoint: null, 
    distanceMeters: 0, 
    rideStartTime: null,
    arrived: false,
  }),
}));
