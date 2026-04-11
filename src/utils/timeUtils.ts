// ─── Time Utilities ───────────────────────────────────────────────────────────

/**
 * Format a duration in seconds to mm:ss string.
 * e.g. 125 → "02:05", 0 → "00:00"
 */
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
