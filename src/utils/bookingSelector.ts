import { Booking } from '../types/booking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date string in "YYYY-MM-DD" format using the device local time. */
function localTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a booking's rideDateTime into a numeric timestamp for comparison.
 * Bookings without a scheduled date return -Infinity so they sort last.
 */
function toTimestamp(booking: Booking): number {
  if (!booking.rideDateTime) return -Infinity;
  const ts = Date.parse(booking.rideDateTime);
  return isNaN(ts) ? -Infinity : ts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns all bookings whose rideDate matches today's local date.
 * Safe against null/undefined dates and invalid date strings.
 */
export function getTodayBookings(bookings: Booking[]): Booking[] {
  if (!bookings.length) return [];
  const today = localTodayStr();
  return bookings.filter((b) => b.date === today);
}

/**
 * Returns the booking with the minimum pickupTime among the provided array,
 * i.e. the one scheduled earliest in the day.
 * Returns null for an empty array.
 */
export function getEarliestBooking(bookings: Booking[]): Booking | null {
  if (!bookings.length) return null;

  return bookings.reduce<Booking | null>((earliest, b) => {
    if (!b.rideDateTime) return earliest;
    if (!earliest) return b;
    return b.rideDateTime < earliest.rideDateTime! ? b : earliest;
  }, null) ?? bookings[0];
}

/**
 * Returns the booking with the latest rideDate + pickupTime combination,
 * i.e. the most recently scheduled booking overall.
 * Returns null for an empty array.
 */
export function getMostRecentBooking(bookings: Booking[]): Booking | null {
  if (!bookings.length) return null;

  return bookings.reduce<Booking>((latest, b) => {
    return toTimestamp(b) > toTimestamp(latest) ? b : latest;
  }, bookings[0]);
}

/**
 * Selects the single booking to display in the Current tab.
 *
 * Logic:
 *   1. If there are bookings for today → return the earliest one (min pickupTime).
 *   2. If there are no today bookings  → return the most recent booking overall.
 *   3. Empty array → null.
 */
export function getCurrentTabBooking(bookings: Booking[]): Booking | null {
  if (!bookings.length) return null;

  const todayBookings = getTodayBookings(bookings);

  if (todayBookings.length > 0) {
    return getEarliestBooking(todayBookings);
  }

  return getMostRecentBooking(bookings);
}
