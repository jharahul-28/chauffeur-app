import { useState, useCallback } from 'react';
import { ActiveRide, RideStatus } from '../types/ride';

export function useRideStore() {
  const [ride, setRide] = useState<ActiveRide | null>(null);

  const initRide = useCallback((rideData: Omit<ActiveRide, 'status'>) => {
    setRide({ ...rideData, status: 'GOING_TO_PICKUP' });
  }, []);

  const updateStatus = useCallback((status: RideStatus) => {
    setRide((prev) => (prev ? { ...prev, status } : null));
  }, []);

  const clearRide = useCallback(() => {
    setRide(null);
  }, []);

  return { ride, initRide, updateStatus, clearRide };
}
