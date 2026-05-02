/**
 * TC-TIME-001 through TC-TIME-010
 * Unit tests for timeUtils
 */

import { formatCountdown } from '../../../src/utils/timeUtils';

describe('formatCountdown', () => {
  // TC-TIME-001
  it('formats 0 seconds as "00:00"', () => {
    expect(formatCountdown(0)).toBe('00:00');
  });

  // TC-TIME-002
  it('formats 59 seconds as "00:59"', () => {
    expect(formatCountdown(59)).toBe('00:59');
  });

  // TC-TIME-003
  it('formats 60 seconds as "01:00"', () => {
    expect(formatCountdown(60)).toBe('01:00');
  });

  // TC-TIME-004
  it('formats 125 seconds as "02:05"', () => {
    expect(formatCountdown(125)).toBe('02:05');
  });

  // TC-TIME-005
  it('formats 3600 seconds as "60:00" (no hour coercion)', () => {
    expect(formatCountdown(3600)).toBe('60:00');
  });

  // TC-TIME-006
  it('clamps negative values to "00:00"', () => {
    expect(formatCountdown(-10)).toBe('00:00');
  });

  // TC-TIME-007
  it('floors fractional seconds', () => {
    expect(formatCountdown(61.9)).toBe('01:01');
  });

  // TC-TIME-008
  it('pads single-digit minutes and seconds with leading zero', () => {
    expect(formatCountdown(65)).toBe('01:05');
  });

  // TC-TIME-009
  it('formats 180 seconds (3 minutes free wait) as "03:00"', () => {
    expect(formatCountdown(180)).toBe('03:00');
  });

  // TC-TIME-010
  it('handles large values without overflowing', () => {
    expect(formatCountdown(7261)).toBe('121:01');
  });
});
