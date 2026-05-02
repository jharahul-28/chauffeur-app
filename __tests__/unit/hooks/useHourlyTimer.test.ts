/**
 * TC-HTIMER-001 through TC-HTIMER-020
 * Unit tests for useHourlyTimer hook and its helpers
 */

import { renderHook, act } from '@testing-library/react';
import {
  useHourlyTimer,
  parseRideStartTime,
  formatHourlyDuration,
} from '../../../src/hooks/useHourlyTimer';

// ── parseRideStartTime ────────────────────────────────────────────────────────

describe('parseRideStartTime', () => {
  // TC-HTIMER-001
  it('parses "YYYY-MM-DD HH:mm:ss" format into a Date', () => {
    const d = parseRideStartTime('2026-05-02 09:30:00');
    expect(d).toBeInstanceOf(Date);
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(4); // 0-indexed
    expect(d?.getDate()).toBe(2);
    expect(d?.getHours()).toBe(9);
    expect(d?.getMinutes()).toBe(30);
  });

  // TC-HTIMER-002
  it('returns null for null input', () => {
    expect(parseRideStartTime(null)).toBeNull();
  });

  // TC-HTIMER-003
  it('returns null for undefined input', () => {
    expect(parseRideStartTime(undefined)).toBeNull();
  });

  // TC-HTIMER-004
  it('returns null for empty string', () => {
    expect(parseRideStartTime('')).toBeNull();
  });

  // TC-HTIMER-005
  it('returns null for malformed date string', () => {
    expect(parseRideStartTime('not-a-date')).toBeNull();
  });

  // TC-HTIMER-006
  it('handles leading/trailing whitespace', () => {
    const d = parseRideStartTime('  2026-05-02 09:30:00  ');
    expect(d).toBeInstanceOf(Date);
  });
});

// ── formatHourlyDuration ──────────────────────────────────────────────────────

describe('formatHourlyDuration', () => {
  // TC-HTIMER-007
  it('formats duration > 10 minutes as HH:mm', () => {
    const elevenMins = 11 * 60 * 1000; // 11 minutes
    expect(formatHourlyDuration(elevenMins)).toBe('00:11');
  });

  // TC-HTIMER-008
  it('formats 2 hours 30 minutes as "02:30" (HH:mm)', () => {
    const ms = (2 * 60 + 30) * 60 * 1000;
    expect(formatHourlyDuration(ms)).toBe('02:30');
  });

  // TC-HTIMER-009
  it('formats exactly 10 minutes as mm:ss', () => {
    const tenMins = 10 * 60 * 1000;
    expect(formatHourlyDuration(tenMins)).toBe('10:00');
  });

  // TC-HTIMER-010
  it('formats < 10 minutes as mm:ss', () => {
    const sevenMinThirty = (7 * 60 + 30) * 1000;
    expect(formatHourlyDuration(sevenMinThirty)).toBe('07:30');
  });

  // TC-HTIMER-011
  it('handles negative ms (overrun) using Math.abs', () => {
    const overrunMs = -(5 * 60 * 1000); // 5 min overrun
    expect(formatHourlyDuration(overrunMs)).toBe('05:00');
  });

  // TC-HTIMER-012
  it('formats 0ms as "00:00"', () => {
    expect(formatHourlyDuration(0)).toBe('00:00');
  });
});

// ── useHourlyTimer hook ───────────────────────────────────────────────────────

describe('useHourlyTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Pin "now" to a known time
    jest.setSystemTime(new Date('2026-05-02T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // TC-HTIMER-013
  it('returns "—" when rideStartTime is null', () => {
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: null, hours: 4 })
    );
    expect(result.current.formattedTime).toBe('—');
    expect(result.current.isExpired).toBe(false);
    expect(result.current.endTime).toBeNull();
  });

  // TC-HTIMER-014
  it('returns "—" when hours is null', () => {
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 09:00:00', hours: null })
    );
    expect(result.current.formattedTime).toBe('—');
  });

  // TC-HTIMER-015
  it('computes endTime = rideStartTime + hours', () => {
    // Start at 09:00, 2 hours → endTime = 11:00
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 09:00:00', hours: 2 })
    );
    // "now" = 10:00 → 1 hour remaining
    expect(result.current.rawMilliseconds).toBeCloseTo(60 * 60 * 1000, -3);
    expect(result.current.isExpired).toBe(false);
  });

  // TC-HTIMER-016
  it('isExpired = true when current time is past endTime', () => {
    // rideStart 08:00, hours = 1 → endTime 09:00; now = 10:00 → expired
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 08:00:00', hours: 1 })
    );
    expect(result.current.isExpired).toBe(true);
    expect(result.current.rawMilliseconds).toBeLessThan(0);
  });

  // TC-HTIMER-017
  it('decrements every second via the interval', () => {
    // rideStart 09:00, 2 hours → endTime 11:00; now = 10:00 → 3600s left
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 09:00:00', hours: 2 })
    );

    const initialMs = result.current.rawMilliseconds;

    act(() => {
      jest.advanceTimersByTime(5000); // 5 seconds
    });

    expect(result.current.rawMilliseconds).toBeLessThan(initialMs);
  });

  // TC-HTIMER-018
  it('shows HH:mm format when > 10 minutes remaining', () => {
    // now = 10:00, endTime = 14:00 → 4 hours remaining
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    // 4:00:00 remaining — should be HH:mm
    expect(result.current.formattedTime).toBe('04:00');
  });

  // TC-HTIMER-019
  it('switches to mm:ss format when ≤ 10 minutes remaining', () => {
    // now = 10:00, rideStart = 10:00 - (1h - 5min) = 08:55, hours = 1
    // endTime = 09:55; but we want 5 min left
    // Set now to 13:55, rideStart = 10:00, hours = 4 → endTime 14:00, 5 min left
    jest.setSystemTime(new Date('2026-05-02T13:55:00'));

    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    expect(result.current.formattedTime).toBe('05:00');
  });

  // TC-HTIMER-020
  it('interval is cleared on unmount — no memory leak', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 09:00:00', hours: 2 })
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
