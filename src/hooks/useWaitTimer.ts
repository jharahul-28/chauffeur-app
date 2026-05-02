import { useState, useCallback, useRef, useEffect } from 'react';
import { formatCountdown, formatHHMMSS } from '../utils/timeUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_WAIT_SECONDS = 180; // 3 minutes free wait per trip

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages wait-timer state for an active ride — backend-driven design.
 *
 * Design:
 *   - `currentSeconds`        → live timer value, seeded from backend's
 *                               `totalWaitingSeconds` and incremented every second.
 *   - `totalWaitingSeconds`   → snapshot of the backend value at wait-start;
 *                               drives billing threshold decisions.
 *   - `formattedWaitingTime`  → HH:mm:ss string; prefers the backend-supplied
 *                               `formattedWaitingTime` when freshly synced,
 *                               otherwise computed locally from `currentSeconds`.
 *   - `isFreeTimeExceeded`    → true when totalWaitingSeconds ≥ FREE_WAIT_SECONDS.
 *
 * Session lifecycle:
 *   startWaiting(n)         → seed currentSeconds = n → start 1-s interval
 *   syncFromBackend(n, fmt) → re-seed currentSeconds without stopping timer
 *                             (use on screen focus / app foreground to prevent drift)
 *   stopWaiting()           → pause interval; currentSeconds frozen for display
 *   resetTimer()            → full teardown (call at trip end)
 *
 * Guarantees:
 *   - Only ONE interval ever runs. startWaiting clears any stale interval first.
 *   - Timer never starts without an explicit startWaiting(n) call.
 *   - syncFromBackend is a no-op when not waiting (safe to call unconditionally).
 *
 * Extensibility:
 *   - totalWaitingSeconds feeds dynamic surcharge calculations.
 *   - Replace interval with server-side polling for multi-device sync.
 */
export function useWaitTimer() {
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

  /**
   * Begin a wait session starting from `initialSeconds`.
   * `initialSeconds` MUST come from the backend's `totalWaitingSeconds`.
   * Only call after a successful postWaiting + getWaitingTimer response.
   */
  const startWaiting = useCallback(
    (initialSeconds: number, backendFmt?: string) => {
      if (isWaiting) return;
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

  /** Stop the current wait session. currentSeconds is preserved for display. */
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

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    isWaiting,
    timerRunning,
    /** Live timer seconds — seeded from backend, increments every second. */
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
    /** mm:ss formatted string — kept for WaitTimerDisplay (legacy). */
    formattedTime,
    /** HH:mm:ss formatted string — preferred for display. */
    formattedWaitingTime,
    startWaiting,
    syncFromBackend,
    stopWaiting,
    resetTimer,
    /** Alias kept for any existing callers. */
    reset: resetTimer,
  };
}
