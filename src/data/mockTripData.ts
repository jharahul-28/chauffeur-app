import { ActiveRide } from '../types/ride';

// ─── Mock OTP ─────────────────────────────────────────────────────────────────

/**
 * Mock OTP used for development/testing.
 * In production this is never stored on the client — the backend verifies it.
 *
 * To swap in a real API:
 *   1. Remove this constant
 *   2. POST the entered OTP to your verification endpoint
 *   3. Resolve/reject based on the API response
 */
export const MOCK_OTP = '1234';

// ─── Mock Active Ride ─────────────────────────────────────────────────────────

/**
 * Simulates the active-ride payload that a real booking API would return.
 *
 * Coordinates are in Bengaluru:
 *   Pickup      → Indiranagar Metro Station
 *   Stop 1      → Ulsoor Lake entrance
 *   Stop 2      → Old Madras Road junction
 *   Destination → Phoenix Marketcity, Whitefield
 *
 * Status is intentionally omitted here; `useRideStore` initialises it to
 * GOING_TO_PICKUP so the state machine always starts from scratch.
 */
export const MOCK_ACTIVE_RIDE: Omit<ActiveRide, 'status'> = {
  id: 'ride-001',
  riderName: 'Arjun Sharma',
  pickupText: 'Indiranagar Metro Station, Bengaluru',
  destinationText: 'Phoenix Marketcity, Whitefield',
  pickup: { latitude: 12.9716, longitude: 77.5946 },
  destination: { latitude: 12.9969, longitude: 77.6937 },
  stoppages: [
    {
      id: 'stop-1',
      label: 'Ulsoor Lake',
      latitude: 12.9799,
      longitude: 77.6189,
    },
    {
      id: 'stop-2',
      label: 'Old Madras Rd',
      latitude: 12.9887,
      longitude: 77.6401,
    },
  ],
  fare: '₹480',
};
