import { useState, useCallback, useRef, useEffect } from 'react';
import { formatCountdown } from '../utils/timeUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_WAIT_SECONDS = 180; // 3 minutes free wait per trip

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages wait-timer state for an active ride — backend-driven design.
 *
 * Design:
 *   - `currentSeconds`       → live timer value, initialised from the backend's
 *                              `totalWaitingSeconds` and incremented every second.
 *   - `totalWaitingSeconds`  → snapshot of the backend value at the moment wait
 *                              was started; used for billing decisions.
 *   - `isFreeTimeExceeded`   → true when totalWaitingSeconds ≥ FREE_WAIT_SECONDS.
 *
 * Session lifecycle:
 *   startWaiting(n)  → set currentSeconds = n → start 1-s interval ticking up
 *   stopWaiting()    → stop interval → currentSeconds freezes (billing snapshot)
 *   resetTimer()     → full teardown (called at trip end)
 *
 * Guarantees:
 *   - Only ONE interval ever runs. startWaiting clears any stale interval first.
 *   - Timer never starts without an explicit startWaiting(n) call — the caller
 *     must receive API success before invoking this.
 *
 * Extensibility:
 *   - totalWaitingSeconds can feed dynamic surcharge calculations.
 *   - Persist currentSeconds to AsyncStorage between app backgrounding.
 *   - Replace the interval with a server-side polling mechanism.
 */
export function useWaitTimer() {
  const [isWaiting, setIsWaiting] = useState(false);
  /**
   * Live timer value — starts from the backend totalWaitingSeconds and
   * increments by 1 every second while waiting.
   */
  const [currentSeconds, setCurrentSeconds] = useState(0);
  /**
   * Snapshot of the backend's totalWaitingSeconds at wait-start time.
   * Never decreases; drives the free-wait billing threshold check.
   */
  const [totalWaitingSeconds, setTotalWaitingSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived
  const isFreeTimeExceeded = totalWaitingSeconds >= FREE_WAIT_SECONDS;
  const remainingFreeWaitTime = Math.max(0, FREE_WAIT_SECONDS - totalWaitingSeconds);
  const formattedTime = formatCountdown(currentSeconds);

  /**
   * Begin a wait session starting from `initialSeconds`.
   *
   * `initialSeconds` MUST come from the backend's `totalWaitingSeconds` so the
   * timer reflects cumulative wait time across all sessions for this booking.
   * This function must only be called AFTER a successful API response.
   */
  const startWaiting = useCallback(
    (initialSeconds: number) => {
      if (isWaiting) return;
      // Defensive: clear any stale interval before starting a new one
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

  /** Stop the current wait session. currentSeconds is preserved for display. */
  const stopWaiting = useCallback(() => {
    if (!isWaiting) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
    // currentSeconds intentionally NOT reset — shows the frozen session value
  }, [isWaiting]);

  /** Full reset — call this at trip end. */
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsWaiting(false);
    setCurrentSeconds(0);
    setTotalWaitingSeconds(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isWaiting,
    /** Live timer seconds — initialised from backend value, increments every second. */
    currentSeconds,
    /** @deprecated alias for currentSeconds — kept for existing callers. */
    elapsedTime: currentSeconds,
    /** Backend snapshot used for billing threshold checks. */
    totalWaitingSeconds,
    /** Remaining free wait seconds before surcharge applies. */
    remainingFreeWaitTime,
    /** True when the 3-minute free allowance is exhausted. */
    isFreeTimeExceeded,
    /** Billing signal — ready for surcharge logic. */
    isExtraChargeApplicable: isFreeTimeExceeded,
    /** Pre-formatted "mm:ss" string of currentSeconds. */
    formattedTime,
    startWaiting,
    stopWaiting,
    resetTimer,
    /** Alias kept for any existing callers. */
    reset: resetTimer,
  };
}
