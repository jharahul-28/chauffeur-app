import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchWaitingTimer, WaitingResponse } from '../services/rideService';

interface UseOneWayWaitingTimerProps {
  bookingVehicleId: string | undefined;
  isWaiting: boolean;
}

export function useOneWayWaitingTimer({ bookingVehicleId, isWaiting }: UseOneWayWaitingTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [formattedTime, setFormattedTime] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to format seconds to HH:MM:SS
  const format = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
  };

  const syncWithServer = async () => {
    if (!bookingVehicleId) return;
    try {
      const data = await fetchWaitingTimer(bookingVehicleId);
      setSeconds(data.totalWaitingSeconds);
      setFormattedTime(data.formattedWaitingTime || format(data.totalWaitingSeconds));
    } catch (err) {
      console.error('[useOneWayWaitingTimer] Sync failed:', err);
    }
  };

  // 1. Initial sync and re-sync on AppState change (foregrounding)
  useEffect(() => {
    if (!bookingVehicleId) return;

    syncWithServer();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[useOneWayWaitingTimer] App foregrounded, syncing timer...');
        syncWithServer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [bookingVehicleId]);

  // 2. Local increment while waiting
  useEffect(() => {
    if (isWaiting) {
      // Start local ticking
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          setFormattedTime(format(next));
          return next;
        });
      }, 1000);
    } else {
      // Stop ticking
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // One last sync when stopping to ensure we have the server's final value
      syncWithServer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWaiting, bookingVehicleId]);

  return { seconds, formattedTime, refresh: syncWithServer };
}
