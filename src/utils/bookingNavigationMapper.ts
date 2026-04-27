import { BookingStatus } from '../types/booking';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingAction {
  /** Label shown on the CTA button */
  buttonText: string;
  /** Expo Router pathname */
  navigationTarget: string;
  /** Route params forwarded to the target screen */
  params: Record<string, string>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Returns the CTA action for a booking based on its current status.
 *
 * Returns `null` for COMPLETED bookings — no button should be shown.
 *
 * Params forwarded to driver-home:
 *   bookingId         — booking ID for GET /bookings/:bookingId (detail fetch)
 *   bookingVehicleId  — assignment ID for /chauffeur/:id/... action endpoints
 *   bookingStatus     — booking status so driver-home can restore ride state
 *   tripType          — "ONE_WAY" | "HOURLY_RENTALS" for post-OTP branching
 */
export function getActionForBooking(
  bookingId: string,
  bookingVehicleId: string,
  status: BookingStatus,
  tripType?: string,
): BookingAction | null {
  const isHourly = tripType === 'HOURLY_RENTALS';
  const base = { bookingId, bookingVehicleId, bookingStatus: status, tripType: tripType ?? '' };

  switch (status) {
    case 'ASSIGNED':
    case 'DRIVER_ON_THE_WAY':
      return {
        buttonText: 'Go To Pickup',
        navigationTarget: '/(driver)/driver-home',
        params: base,
      };

    case 'ARRIVED':
      return {
        buttonText: 'Enter OTP',
        navigationTarget: '/(driver)/driver-home',
        params: base,
      };

    case 'OTP_VERIFIED':
    case 'IN_PROGRESS':
      return {
        buttonText: isHourly ? 'View Hourly Ride' : 'Go To Destination',
        navigationTarget: '/(driver)/driver-home',
        params: base,
      };

    case 'WAITING':
      return {
        buttonText: 'Go To Destination',
        navigationTarget: '/(driver)/driver-home',
        params: base,
      };

    case 'COMPLETED':
      return null;

    default:
      return null;
  }
}
