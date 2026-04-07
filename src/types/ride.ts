import { Coordinate } from '../components/MapViewContainer';

// ─── Ride Status Machine ───────────────────────────────────────────────────────

/**
 * Linear state machine for a single ride lifecycle.
 *
 * Transitions:
 *   GOING_TO_PICKUP → ARRIVED_AT_PICKUP → OTP_PENDING → TRIP_STARTED
 *
 * Future states to add here:
 *   TRIP_STARTED → TRIP_COMPLETED | TRIP_CANCELLED
 */
export type RideStatus =
  | 'GOING_TO_PICKUP'
  | 'ARRIVED_AT_PICKUP'
  | 'OTP_PENDING'
  | 'TRIP_STARTED';

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
 * Populated from the booking API (currently mocked).
 * The `status` field is managed locally by `useRideStore`.
 */
export interface ActiveRide {
  id: string;
  riderName: string;
  pickupText: string;
  destinationText: string;
  pickup: Coordinate;
  destination: Coordinate;
  /** Ordered list of intermediate stops between pickup and destination. */
  stoppages: Stoppage[];
  status: RideStatus;
  /** Formatted fare string, e.g. "₹480". */
  fare: string;
}
