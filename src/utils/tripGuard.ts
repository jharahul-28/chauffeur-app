/**
 * Centralised business-rule checks before performing trip-ending actions.
 *
 * Extensibility:
 *  - Add canCollectPayment(state) for payment-readiness checks
 *  - Add canStartNewTrip(state) for overlapping-booking prevention
 *  - Wire into an audit log for compliance tracking
 */

export interface TripGuardResult {
  allowed: boolean;
  /** Human-readable reason shown directly to the driver when blocked. */
  reason?: string;
}

/**
 * Returns whether the driver is allowed to end the trip.
 *
 * Blocked when the wait timer is active — the driver must resume the trip
 * before ending it, so that waiting time is correctly finalised on the backend.
 */
export function canEndTrip(isWaiting: boolean): TripGuardResult {
  if (isWaiting) {
    return {
      allowed: false,
      reason: 'Please resume the trip before ending it.',
    };
  }
  return { allowed: true };
}
