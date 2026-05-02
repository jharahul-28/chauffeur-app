import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { formatCountdown } from '../utils/timeUtils';
import { fetchWaitingTimer } from '../services/rideService';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_WAIT_SECONDS = 180; // 3 minutes free wait per trip

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages wait-timer state for an active ride — backend-driven design.
 */
export function useWaitTimer(bookingVehicleId?: string) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalWaitingSeconds, setTotalWaitingSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const isFreeTimeExceeded = totalWaitingSeconds >= FREE_WAIT_SECONDS;
  const remainingFreeWaitTime = Math.max(0, FREE_WAIT_SECONDS - totalWaitingSeconds);
  const formattedTime = formatCountdown(currentSeconds);

  /** Manual sync with server — call this only when needed (e.g. on Wait button click) */
  const syncWithServer = useCallback(async () => {
    if (!bookingVehicleId) return;
    try {
      const data = await fetchWaitingTimer(bookingVehicleId);
      setCurrentSeconds(data.totalWaitingSeconds);
      setTotalWaitingSeconds(data.totalWaitingSeconds);
      return data;
    } catch (err) {
      console.error('[useWaitTimer] Sync failed:', err);
    }
  }, [bookingVehicleId]);

  // Handle background -> foreground accuracy
  useEffect(() => {
    if (!bookingVehicleId) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // ONLY sync if the app comes to foreground AND we are currently in a waiting session
      if (nextAppState === 'active' && isWaiting) {
        console.log('[useWaitTimer] Foreground detected while waiting, re-syncing...');
        syncWithServer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [bookingVehicleId, isWaiting, syncWithServer]);

  const startWaiting = useCallback(
    (initialSeconds: number) => {
      if (isWaiting) return;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentSeconds(initialSeconds);
      setTotalWaitingSeconds(initialSeconds);
      setIsWaiting(true);
      intervalRef.current = setInterval(() => {
        setCurrentSeconds((prev) => prev + 1);
      }, 1000);
    },
    [isWaiting],
  );

  const stopWaiting = useCallback(() => {
    if (!isWaiting) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
  }, [isWaiting]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
    setCurrentSeconds(0);
    setTotalWaitingSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isWaiting,
    currentSeconds,
    elapsedTime: currentSeconds,
    totalWaitingSeconds,
    remainingFreeWaitTime,
    isFreeTimeExceeded,
    isExtraChargeApplicable: isFreeTimeExceeded,
    formattedTime,
    startWaiting,
    stopWaiting,
    resetTimer,
    reset: resetTimer,
    syncWithServer,
  };
}
