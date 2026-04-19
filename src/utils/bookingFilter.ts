import { Booking } from '../types/booking';
import { sortBookings as sortBookingsImpl } from './bookingSorter';

// ─── Tab Types ─────────────────────────────────────────────────────────────────

export type BookingTab = 'current' | 'upcoming' | 'past';

// ─── Sort ─────────────────────────────────────────────────────────────────────

/**
 * Sorts API-fetched bookings for display.
 * Delegates to bookingSorter: today's bookings first (ascending), then all
 * other bookings (ascending). The _tab parameter is retained for backward
 * compatibility but is not used — all tabs share the same ordering.
 */
export function sortBookings(bookings: Booking[], _tab: BookingTab): Booking[] {
  return sortBookingsImpl(bookings);
}
