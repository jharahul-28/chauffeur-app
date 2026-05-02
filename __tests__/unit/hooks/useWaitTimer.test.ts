/**
 * TC-WAIT-001 through TC-WAIT-020
 * Unit tests for useWaitTimer hook
 */

import { renderHook, act } from '@testing-library/react';
import { useWaitTimer } from '../../../src/hooks/useWaitTimer';

describe('useWaitTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  // TC-WAIT-001
  it('initialises with isWaiting=false, currentSeconds=0, totalWaitingSeconds=0', () => {
    const { result } = renderHook(() => useWaitTimer());
    expect(result.current.isWaiting).toBe(false);
    expect(result.current.currentSeconds).toBe(0);
    expect(result.current.totalWaitingSeconds).toBe(0);
    expect(result.current.isFreeTimeExceeded).toBe(false);
  });

  // TC-WAIT-002
  it('formattedTime shows "00:00" initially', () => {
    const { result } = renderHook(() => useWaitTimer());
    expect(result.current.formattedTime).toBe('00:00');
  });

  // TC-WAIT-003
  it('startWaiting(0) sets isWaiting=true and starts the interval', () => {
    const { result } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(0); });
    expect(result.current.isWaiting).toBe(true);

    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.currentSeconds).toBe(3);
  });

  // TC-WAIT-004
  it('startWaiting(n) initialises currentSeconds from backend value', () => {
    const { result } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(120); });
    expect(result.current.currentSeconds).toBe(120);
    expect(result.current.totalWaitingSeconds).toBe(120);

    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.currentSeconds).toBe(125);
  });

  // TC-WAIT-005
  it('startWaiting is idempotent — calling twice does not stack intervals', () => {
    const { result } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(0); });
    act(() => { result.current.startWaiting(0); }); // Second call ignored

    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.currentSeconds).toBe(1); // Only 1, not 2
  });

  // TC-WAIT-006
  it('stopWaiting sets isWaiting=false and freezes currentSeconds', () => {
    const { result } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(0); });
    act(() => { jest.advanceTimersByTime(10000); });
    act(() => { result.current.stopWaiting(); });

    const frozenSeconds = result.current.currentSeconds;
    expect(result.current.isWaiting).toBe(false);

    // Timer should NOT continue after stop
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.currentSeconds).toBe(frozenSeconds);
  });

  // TC-WAIT-007
  it('stopWaiting is a no-op when not waiting', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.stopWaiting(); }); // Should not throw
    expect(result.current.isWaiting).toBe(false);
  });

  // TC-WAIT-008
  it('resetTimer clears everything back to initial state', () => {
    const { result } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(150); });
    act(() => { jest.advanceTimersByTime(20000); });
    act(() => { result.current.resetTimer(); });

    expect(result.current.isWaiting).toBe(false);
    expect(result.current.currentSeconds).toBe(0);
    expect(result.current.totalWaitingSeconds).toBe(0);
  });

  // TC-WAIT-009
  it('isFreeTimeExceeded is false when totalWaitingSeconds < 180', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(179); });
    expect(result.current.isFreeTimeExceeded).toBe(false);
  });

  // TC-WAIT-010
  it('isFreeTimeExceeded is true at exactly 180 seconds', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(180); });
    expect(result.current.isFreeTimeExceeded).toBe(true);
  });

  // TC-WAIT-011
  it('isFreeTimeExceeded is true when totalWaitingSeconds > 180', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(200); });
    expect(result.current.isFreeTimeExceeded).toBe(true);
  });

  // TC-WAIT-012
  it('isExtraChargeApplicable mirrors isFreeTimeExceeded', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(200); });
    expect(result.current.isExtraChargeApplicable).toBe(result.current.isFreeTimeExceeded);
  });

  // TC-WAIT-013
  it('remainingFreeWaitTime counts down from 180 correctly', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(100); });
    expect(result.current.remainingFreeWaitTime).toBe(80);
  });

  // TC-WAIT-014
  it('remainingFreeWaitTime does not go below 0 when exceeded', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(250); });
    expect(result.current.remainingFreeWaitTime).toBe(0);
  });

  // TC-WAIT-015
  it('elapsedTime alias returns same value as currentSeconds', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(60); });
    expect(result.current.elapsedTime).toBe(result.current.currentSeconds);
  });

  // TC-WAIT-016
  it('reset alias is equivalent to resetTimer', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(100); });
    act(() => { result.current.reset(); });
    expect(result.current.currentSeconds).toBe(0);
    expect(result.current.isWaiting).toBe(false);
  });

  // TC-WAIT-017
  it('formattedTime formats 125 seconds as "02:05"', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(125); });
    expect(result.current.formattedTime).toBe('02:05');
  });

  // TC-WAIT-018
  it('formattedTime increments every second during active wait', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(0); });
    act(() => { jest.advanceTimersByTime(65000); });
    expect(result.current.formattedTime).toBe('01:05');
  });

  // TC-WAIT-019
  it('interval is cleared on component unmount — no memory leak', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { result, unmount } = renderHook(() => useWaitTimer());

    act(() => { result.current.startWaiting(0); });
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  // TC-WAIT-020
  it('can restart after stop — new session picks up from new backend value', () => {
    const { result } = renderHook(() => useWaitTimer());

    // First wait session
    act(() => { result.current.startWaiting(60); });
    act(() => { jest.advanceTimersByTime(30000); }); // 30 more seconds
    act(() => { result.current.stopWaiting(); });

    // Driver resumes — backend returns cumulative 120 seconds
    act(() => { result.current.startWaiting(120); });
    expect(result.current.isWaiting).toBe(true);
    expect(result.current.currentSeconds).toBe(120);
    expect(result.current.totalWaitingSeconds).toBe(120);
  });
});
