import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_WAIT_SECONDS = 180; // 3 minutes cumulative per trip

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the cumulative wait timer for a trip.
 *
 * Rules:
 *   - 3 minutes (180s) of free wait time total per trip
 *   - Time accumulates across multiple wait sessions
 *   - When free time is exceeded, isExtraChargeApplicable = true (billing hook)
 *
 * Usage:
 *   const { isWaiting, remainingFreeWaitTime, isFreeTimeExceeded,
 *           startWaiting, stopWaiting, reset } = useWaitTimer();
 */
export function useWaitTimer() {
  const [isWaiting, setIsWaiting] = useState(false);
  const [totalWaitTimeUsed, setTotalWaitTimeUsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state
  const remainingFreeWaitTime = Math.max(0, FREE_WAIT_SECONDS - totalWaitTimeUsed);
  const isFreeTimeExceeded = totalWaitTimeUsed >= FREE_WAIT_SECONDS;

  const startWaiting = useCallback(() => {
    if (isWaiting) return;
    setIsWaiting(true);
    intervalRef.current = setInterval(() => {
      setTotalWaitTimeUsed((prev) => prev + 1);
    }, 1000);
  }, [isWaiting]);

  const stopWaiting = useCallback(() => {
    if (!isWaiting) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
  }, [isWaiting]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
    setTotalWaitTimeUsed(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isWaiting,
    totalWaitTimeUsed,
    remainingFreeWaitTime,
    isFreeTimeExceeded,
    /** Billing hook — true when free time exceeded. Ready for backend integration. */
    isExtraChargeApplicable: isFreeTimeExceeded,
    startWaiting,
    stopWaiting,
    reset,
  };
}
