import { Booking } from '../types/booking';

// ─── Tab Types ─────────────────────────────────────────────────────────────────

export type BookingTab = 'current' | 'upcoming' | 'past';

// ─── Sort ─────────────────────────────────────────────────────────────────────

/**
 * Sorts API-fetched bookings for display within each tab.
 * Filtering is handled server-side via the status query param.
 *
 * Current  → ascending by scheduledAt (soonest first)
 * Upcoming → ascending by date (nearest trip first)
 * Past     → descending by date (most recent first)
 */
export function sortBookings(bookings: Booking[], tab: BookingTab): Booking[] {
  switch (tab) {
    case 'current':
    case 'upcoming':
      return [...bookings].sort((a, b) => a.date.localeCompare(b.date));

    case 'past':
      return [...bookings].sort((a, b) => b.date.localeCompare(a.date));

    default:
      return bookings;
  }
}
