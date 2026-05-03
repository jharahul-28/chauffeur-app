import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HourlyTimerResult {
  /** Formatted display string — HH:mm when > 10 min, mm:ss when ≤ 10 min. */
  formattedTime: string;
  /** True when the booked window has been exhausted (timeLeftMs ≤ 0). */
  isExpired: boolean;
  /** Raw signed milliseconds: positive = remaining, negative = overrun. */
  rawMilliseconds: number;
  /** The computed end time, or null when inputs are missing/invalid. */
  endTime: Date | null;
}

// ─── Time parsing ─────────────────────────────────────────────────────────────

/**
 * Parse the backend rideStartTime string into a JS Date.
 *
 * Backend format: "YYYY-MM-DD HH:mm:ss"
 * JS Date() treats strings without a timezone as LOCAL time when they use
 * the space-separated format, but as UTC when they use the ISO 'T' separator.
 * We replace the space with 'T' to get an unambiguous local-time ISO string,
 * which is what we want — the server sends wall-clock time in the device's
 * local timezone.
 */
export function parseRideStartTime(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // "2026-04-28 09:30:00" → "2026-04-28T09:30:00" (local time)
  const iso = raw.trim().replace(' ', 'T');
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Duration formatting ──────────────────────────────────────────────────────

/**
 * Format an absolute duration (ms) per spec:
 *   > 10 minutes  →  HH:mm
 *   ≤ 10 minutes  →  mm:ss
 */
export function formatHourlyDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes > 10) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  const mins = totalMinutes % 60;
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ─── Start time computation ───────────────────────────────────────────────────

/**
 * Returns the correct hourly timer start time as:
 *   MAX(arrivedAt of pickup waypoint, scheduledPickupDateTime)
 *
 * Falls back to serverRideStartTime when local data is unavailable.
 * Returns null when no valid anchor can be derived.
 */
export function computeHourlyStartTime(params: {
  arrivedAt: string | null | undefined;
  rideDate: string | null | undefined;
  pickupTime: string | null | undefined;
  serverRideStartTime: string | null | undefined;
}): string | null {
  const { arrivedAt, rideDate, pickupTime, serverRideStartTime } = params;

  const scheduledStart =
    rideDate && pickupTime ? new Date(`${rideDate}T${pickupTime}`) : null;
  const actualStart = arrivedAt ? new Date(arrivedAt) : null;

  const isValidDate = (d: Date | null): d is Date => d !== null && !isNaN(d.getTime());

  if (isValidDate(scheduledStart) && isValidDate(actualStart)) {
    const anchor = actualStart > scheduledStart ? actualStart : scheduledStart;
    // Return in "YYYY-MM-DD HH:mm:ss" format matching parseRideStartTime expectations
    const iso = anchor.toISOString().replace('T', ' ').substring(0, 19);
    return iso;
  }

  if (isValidDate(actualStart)) {
    return actualStart.toISOString().replace('T', ' ').substring(0, 19);
  }

  if (isValidDate(scheduledStart)) {
    return scheduledStart.toISOString().replace('T', ' ').substring(0, 19);
  }

  return serverRideStartTime ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseHourlyTimerParams {
  /**
   * Server-side ride start time: "YYYY-MM-DD HH:mm:ss".
   * Used as the authoritative start point for the timer.
   */
  rideStartTime: string | null | undefined;
  /** Number of hours in the booked package. */
  hours: number | null | undefined;
}

/**
 * Accurate countdown/countup timer for hourly rentals.
 *
 * - Uses rideStartTime from the backend as the start anchor (not pickupTime).
 * - Ticks every second via a single setInterval.
 * - Cleans up on unmount.
 * - Re-anchors end time if rideStartTime or hours change (e.g. first API response).
 */
export function useHourlyTimer({ rideStartTime, hours }: UseHourlyTimerParams): HourlyTimerResult {
  const computeEndTime = useCallback((): Date | null => {
    if (!hours || hours <= 0) return null;
    const start = parseRideStartTime(rideStartTime);
    if (!start) return null;
    return new Date(start.getTime() + hours * 60 * 60 * 1000);
  }, [rideStartTime, hours]);

  const endTimeRef = useRef<Date | null>(computeEndTime());

  const getRawMs = useCallback((): number => {
    // Return a large positive value when end time is not yet known so the
    // timer shows "waiting" state rather than immediately showing as expired.
    if (!endTimeRef.current) return Number.MAX_SAFE_INTEGER;
    return endTimeRef.current.getTime() - Date.now();
  }, []);

  const [rawMilliseconds, setRawMilliseconds] = useState<number>(getRawMs);

  // Re-anchor whenever inputs arrive or change
  useEffect(() => {
    endTimeRef.current = computeEndTime();
    setRawMilliseconds(getRawMs());
  }, [computeEndTime, getRawMs]);

  // Single 1-second interval — only state setter called each tick, no re-render
  // of parent unless the formatted value or isExpired bucket actually changes.
  useEffect(() => {
    const id = setInterval(() => setRawMilliseconds(getRawMs()), 1000);
    return () => clearInterval(id);
  }, [getRawMs]);

  const hasEndTime = endTimeRef.current !== null;

  return {
    formattedTime: hasEndTime ? formatHourlyDuration(rawMilliseconds) : '—',
    isExpired: hasEndTime && rawMilliseconds <= 0,
    rawMilliseconds: hasEndTime ? rawMilliseconds : 0,
    endTime: endTimeRef.current,
  };
}
