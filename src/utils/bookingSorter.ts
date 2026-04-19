import { Booking } from '../types/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" using device local time (not UTC). */
function localTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ascending comparator by rideDateTime; unscheduled bookings go to the end. */
function ascendingByDateTime(a: Booking, b: Booking): number {
  if (!a.rideDateTime && b.rideDateTime) return 1;
  if (a.rideDateTime && !b.rideDateTime) return -1;
  if (!a.rideDateTime && !b.rideDateTime) return 0;
  return a.rideDateTime!.localeCompare(b.rideDateTime!);
}

// ─── Sorter ───────────────────────────────────────────────────────────────────

/**
 * Sorts bookings for display using today-first ordering:
 *
 * Section 1 — TODAY (device local date), ascending by pickup time.
 * Section 2 — All other bookings (past + future), ascending by pickup time.
 *
 * Unscheduled bookings (no date/time) are placed at the end of each section.
 * No visual section separation is applied — ordering only.
 */
export function sortBookings(bookings: Booking[]): Booking[] {
  const today = localTodayStr();

  const todayBookings = bookings.filter((b) => b.date === today);
  const otherBookings = bookings.filter((b) => b.date !== today);

  return [
    ...todayBookings.sort(ascendingByDateTime),
    ...otherBookings.sort(ascendingByDateTime),
  ];
}
