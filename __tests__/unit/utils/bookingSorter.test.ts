/**
 * TC-SORT-001 through TC-SORT-015
 * Unit tests for bookingSorter
 */

import { sortBookings } from '../../../src/utils/bookingSorter';
import type { Booking } from '../../../src/types/booking';

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const tomorrowStr = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const yesterdayStr = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
})();

const booking = (overrides: Partial<Booking>): Booking => ({
  id: '1',
  bookingId: '10',
  categoryName: 'Sedan',
  vehicleInfo: '',
  vehicleNumber: '',
  date: todayStr,
  dateTime: `Today, 9:00 AM`,
  status: 'ASSIGNED',
  paymentStatus: null,
  balanceAmount: 0,
  baseFare: 0,
  totalFare: 0,
  waypoints: [],
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('sortBookings', () => {
  // TC-SORT-001
  it('returns empty array for empty input', () => {
    expect(sortBookings([])).toEqual([]);
  });

  // TC-SORT-002
  it('places today bookings before future bookings', () => {
    const b1 = booking({ id: '1', date: tomorrowStr, rideDateTime: `${tomorrowStr}T09:00:00` });
    const b2 = booking({ id: '2', date: todayStr, rideDateTime: `${todayStr}T10:00:00` });

    const sorted = sortBookings([b1, b2]);
    expect(sorted[0].id).toBe('2'); // Today first
    expect(sorted[1].id).toBe('1');
  });

  // TC-SORT-003
  it('places today bookings before past bookings', () => {
    const b1 = booking({ id: '1', date: yesterdayStr, rideDateTime: `${yesterdayStr}T09:00:00` });
    const b2 = booking({ id: '2', date: todayStr, rideDateTime: `${todayStr}T10:00:00` });

    const sorted = sortBookings([b1, b2]);
    expect(sorted[0].id).toBe('2'); // Today first
  });

  // TC-SORT-004
  it('sorts today bookings by pickup time ascending', () => {
    const b1 = booking({ id: '1', date: todayStr, rideDateTime: `${todayStr}T14:00:00` });
    const b2 = booking({ id: '2', date: todayStr, rideDateTime: `${todayStr}T09:00:00` });
    const b3 = booking({ id: '3', date: todayStr, rideDateTime: `${todayStr}T11:30:00` });

    const sorted = sortBookings([b1, b2, b3]);
    expect(sorted.map((b) => b.id)).toEqual(['2', '3', '1']);
  });

  // TC-SORT-005
  it('sorts non-today bookings by pickup time ascending', () => {
    const b1 = booking({ id: '1', date: tomorrowStr, rideDateTime: `${tomorrowStr}T15:00:00` });
    const b2 = booking({ id: '2', date: tomorrowStr, rideDateTime: `${tomorrowStr}T08:00:00` });

    const sorted = sortBookings([b1, b2]);
    expect(sorted[0].id).toBe('2');
  });

  // TC-SORT-006
  it('places unscheduled bookings (no rideDateTime) at the end of their section', () => {
    const b1 = booking({ id: '1', date: todayStr, rideDateTime: `${todayStr}T09:00:00` });
    const b2 = booking({ id: '2', date: todayStr, rideDateTime: undefined }); // TBD

    const sorted = sortBookings([b2, b1]);
    expect(sorted[0].id).toBe('1'); // Scheduled first
    expect(sorted[1].id).toBe('2'); // Unscheduled last in section
  });

  // TC-SORT-007
  it('multiple unscheduled bookings remain stable relative to each other', () => {
    const b1 = booking({ id: '1', date: '', rideDateTime: undefined });
    const b2 = booking({ id: '2', date: '', rideDateTime: undefined });

    const sorted = sortBookings([b1, b2]);
    // Both unscheduled — order is stable
    expect(sorted).toHaveLength(2);
  });

  // TC-SORT-008
  it('handles a single booking', () => {
    const b = booking({ id: '1', date: todayStr, rideDateTime: `${todayStr}T09:00:00` });
    expect(sortBookings([b])).toHaveLength(1);
  });

  // TC-SORT-009
  it('does not mutate the input array', () => {
    const b1 = booking({ id: '1', date: tomorrowStr, rideDateTime: `${tomorrowStr}T09:00:00` });
    const b2 = booking({ id: '2', date: todayStr, rideDateTime: `${todayStr}T10:00:00` });
    const input = [b1, b2];

    sortBookings(input);
    expect(input[0].id).toBe('1'); // Original order preserved
  });

  // TC-SORT-010
  it('returns all input bookings without losing any', () => {
    const bookings = Array.from({ length: 5 }, (_, i) =>
      booking({ id: String(i + 1), date: todayStr, rideDateTime: `${todayStr}T${String(9 + i).padStart(2, '0')}:00:00` })
    );
    expect(sortBookings(bookings)).toHaveLength(5);
  });
});
