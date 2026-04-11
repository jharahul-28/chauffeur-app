import { Coordinate } from '../components/MapViewContainer';

// ─── Ride Status Machine ───────────────────────────────────────────────────────

/**
 * Linear state machine for a single ride lifecycle.
 *
 * Transitions:
 *   GOING_TO_PICKUP → ARRIVED_AT_PICKUP → OTP_PENDING → TRIP_STARTED → TRIP_COMPLETED
 */
export type RideStatus =
  | 'GOING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'OTP_PENDING'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED';

// ─── Stoppage ─────────────────────────────────────────────────────────────────

export interface Stoppage {
  id: string;
  /** Display label shown in the drawer (e.g. "Ulsoor Lake"). */
  label?: string;
  latitude: number;
  longitude: number;
}

// ─── Active Ride ──────────────────────────────────────────────────────────────

/**
 * Full representation of the ride the driver is currently executing.
 *
 * Populated from the booking detail API.
 * The `status` field is managed locally by `useRideStore`.
 */
export interface ActiveRide {
  id: string;
  /**
   * The `id` from the bookings list API — used as the path param for all
   * ride action endpoints (/chauffeur/{bookingVehicleId}/driver-on-the-way, etc.)
   */
  bookingVehicleId: string;
  /** e.g. "VLV-20260411-6D9B4" */
  bookingReference: string;
  riderName: string;
  /** Raw contact string from API, e.g. "98765 43210" */
  customerContact: string;
  pickupText: string;
  destinationText: string;
  pickup: Coordinate;
  destination: Coordinate;
  /** Ordered list of intermediate stops between pickup and destination. */
  stoppages: Stoppage[];
  status: RideStatus;
  /** Formatted fare string, e.g. "₹2,630". */
  fare: string;
  /** Raw fare number for calculations. */
  totalFare: number;
}
