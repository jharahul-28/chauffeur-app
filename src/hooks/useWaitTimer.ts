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
  const [timerRunning, setTimerRunning] = useState(false);

  /**
   * Live timer value — seeded from backend totalWaitingSeconds and
   * incremented every second while timerRunning is true.
   */
  const [currentSeconds, setCurrentSeconds] = useState(0);

  /**
   * Snapshot of the backend's totalWaitingSeconds at wait-start time.
   * Never decrements; drives the free-wait billing threshold check.
   */
  const [totalWaitingSeconds, setTotalWaitingSeconds] = useState(0);

  /**
   * Backend-supplied formatted string — preferred for display when present.
   * Cleared after first local tick so the local counter takes over seamlessly.
   */
  const [backendFormattedTime, setBackendFormattedTime] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived values ──────────────────────────────────────────────────────────

  const isFreeTimeExceeded = totalWaitingSeconds >= FREE_WAIT_SECONDS;
  const remainingFreeWaitTime = Math.max(0, FREE_WAIT_SECONDS - totalWaitingSeconds);
  /** mm:ss — kept for legacy callers */
  const formattedTime = formatCountdown(currentSeconds);
  /** HH:mm:ss — preferred for UI; uses backend string when freshly synced */
  const formattedWaitingTime = backendFormattedTime ?? formatHHMMSS(currentSeconds);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setBackendFormattedTime(null); // hand off to local counter after first tick
      setCurrentSeconds((prev) => prev + 1);
    }, 1000);
    setTimerRunning(true);
  }, [clearTimer]);

  // ── Public API ──────────────────────────────────────────────────────────────

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
    (initialSeconds: number, backendFmt?: string) => {
      if (isWaiting) return;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentSeconds(initialSeconds);
      setTotalWaitingSeconds(initialSeconds);
      setBackendFormattedTime(backendFmt ?? null);
      setIsWaiting(true);
      startInterval();
    },
    [isWaiting, startInterval],
  );

  /**
   * Re-seed the running timer from a fresh backend value without stopping it.
   * Call on screen focus and app foreground to prevent clock drift.
   * Safe to call when not waiting — it's a no-op in that case.
   */
  const syncFromBackend = useCallback(
    (seconds: number, backendFmt?: string) => {
      if (!isWaiting) return;
      setCurrentSeconds(seconds);
      setTotalWaitingSeconds(seconds);
      setBackendFormattedTime(backendFmt ?? null);
    },
    [isWaiting],
  );

  const stopWaiting = useCallback(() => {
    if (!isWaiting) return;
    clearTimer();
    setIsWaiting(false);
    setTimerRunning(false);
  }, [isWaiting, clearTimer]);

  /** Full reset — call at trip end. */
  const resetTimer = useCallback(() => {
    clearTimer();
    setIsWaiting(false);
    setTimerRunning(false);
    setCurrentSeconds(0);
    setTotalWaitingSeconds(0);
    setBackendFormattedTime(null);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    isWaiting,
    timerRunning,
    /** Live timer seconds — seeded from backend, increments every second. */
    currentSeconds,
    elapsedTime: currentSeconds,
    totalWaitingSeconds,
    remainingFreeWaitTime,
    isFreeTimeExceeded,
    isExtraChargeApplicable: isFreeTimeExceeded,
    formattedTime,
    /** HH:mm:ss formatted string — preferred for display. */
    formattedWaitingTime,
    startWaiting,
    syncFromBackend,
    stopWaiting,
    resetTimer,
    reset: resetTimer,
    syncWithServer,
  };
}
