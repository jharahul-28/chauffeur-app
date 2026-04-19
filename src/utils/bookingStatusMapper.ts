import { BookingStatus } from '../types/booking';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingStatusAction {
  /** Label on the booking list CTA button */
  buttonText: string;
  /** Expo Router pathname */
  navigationTarget: string;
  /** Label on the map screen primary CTA */
  mapCTA: string;
  /** Whether to show the "Wait" button (driver requests wait) */
  showWait: boolean;
  /** Whether to show the "Resume" button (driver resumes after wait) */
  showResume: boolean;
  /** Whether to show the extra charges control */
  showCharges: boolean;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Maps a BookingStatus to the full set of UI flags for both the booking list
 * and the map screen. This is the single source of truth for status-driven UI.
 *
 * Returns `null` for COMPLETED — no action or controls shown.
 *
 * Extensibility:
 *  - Backend-driven statuses: replace the switch with a lookup table fetched
 *    from a pricing/config API.
 *  - Add `showInvoice` flag for completed bookings with invoice access.
 */
export function getBookingAction(status: BookingStatus): BookingStatusAction | null {
  switch (status) {
    case 'ASSIGNED':
    case 'DRIVER_ON_THE_WAY':
      return {
        buttonText: 'Go To Pickup',
        navigationTarget: '/(driver)/driver-home',
        mapCTA: 'Arrived at Pickup',
        showWait: false,
        showResume: false,
        showCharges: false,
      };

    case 'ARRIVED':
      return {
        buttonText: 'Enter OTP',
        navigationTarget: '/(driver)/driver-home',
        mapCTA: 'Enter OTP',
        showWait: false,
        showResume: false,
        showCharges: false,
      };

    case 'OTP_VERIFIED':
    case 'IN_PROGRESS':
      return {
        buttonText: 'Go To Destination',
        navigationTarget: '/(driver)/driver-home',
        mapCTA: 'End Trip',
        showWait: true,
        showResume: false,
        showCharges: true,
      };

    case 'WAITING':
      return {
        buttonText: 'Go To Destination',
        navigationTarget: '/(driver)/driver-home',
        mapCTA: 'End Trip',
        showWait: false,
        showResume: true,
        showCharges: true,
      };

    case 'COMPLETED':
      return null;

    default:
      return null;
  }
}
