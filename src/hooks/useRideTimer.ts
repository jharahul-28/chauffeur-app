import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RideTimerResult {
  /** Positive = time remaining (ms). Negative = extra time past end (ms). */
  timeLeftMs: number;
  /** True when the booked time window has been exhausted. */
  isExhausted: boolean;
  /** Absolute end time derived from schedule + hours. Null when inputs missing. */
  endTime: Date | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Combine a date string "YYYY-MM-DD" and a time string "HH:mm" or "HH:mm:ss"
 * into a JS Date. Returns null for any missing / unparseable input.
 */
export function combineDateTime(rideDate: string | null | undefined, pickupTime: string | null | undefined): Date | null {
  if (!rideDate || !pickupTime) return null;

  // Normalise time to HH:mm:ss so the ISO string is unambiguous
  const timeParts = pickupTime.split(':');
  if (timeParts.length < 2) return null;
  const hh = timeParts[0].padStart(2, '0');
  const mm = timeParts[1].padStart(2, '0');
  const ss = (timeParts[2] ?? '00').padStart(2, '0');

  const iso = `${rideDate}T${hh}:${mm}:${ss}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a duration (milliseconds) according to the spec:
 *  - > 10 min  →  "HH:mm"
 *  - ≤ 10 min  →  "mm:ss"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes > 10) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  const mins = totalMinutes;
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseRideTimerParams {
  /** ISO date string "YYYY-MM-DD" */
  rideDate: string | null | undefined;
  /** Time string "HH:mm" or "HH:mm:ss" */
  pickupTime: string | null | undefined;
  /** Number of hours purchased */
  hours: number | null | undefined;
}

/**
 * Tracks time remaining / extra time for an hourly rental.
 *
 * - Ticks every second via setInterval.
 * - Cleaned up on unmount.
 * - Returns timeLeftMs < 0 once the booked window is exhausted.
 */
export function useRideTimer({ rideDate, pickupTime, hours }: UseRideTimerParams): RideTimerResult {
  const computeEndTime = useCallback((): Date | null => {
    if (!hours || hours <= 0) return null;
    const start = combineDateTime(rideDate, pickupTime);
    if (!start) return null;
    return new Date(start.getTime() + hours * 60 * 60 * 1000);
  }, [rideDate, pickupTime, hours]);

  const endTimeRef = useRef<Date | null>(computeEndTime());

  const getTimeLeft = useCallback((): number => {
    if (!endTimeRef.current) return 0;
    return endTimeRef.current.getTime() - Date.now();
  }, []);

  const [timeLeftMs, setTimeLeftMs] = useState<number>(getTimeLeft);

  // Recompute end time when inputs change (e.g. rideDate/pickupTime arrive late)
  useEffect(() => {
    endTimeRef.current = computeEndTime();
    setTimeLeftMs(getTimeLeft());
  }, [computeEndTime, getTimeLeft]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeftMs(getTimeLeft());
    }, 1000);
    return () => clearInterval(id);
  }, [getTimeLeft]);

  return {
    timeLeftMs,
    isExhausted: timeLeftMs <= 0,
    endTime: endTimeRef.current,
  };
}
