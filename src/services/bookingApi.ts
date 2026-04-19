import apiClient from './apiClient';
import { Charges } from '../types/charge';
import { BookingBilling } from '../types/bookingBilling';

/**
 * Submit extra charges immediately when the driver saves from ChargeModal.
 *
 * Called on every add/edit save — the full current charges state is sent each
 * time (not a delta), so the backend always has the latest snapshot.
 *
 * Extensibility:
 *  - Backend can validate against pricing rules and return computed totals.
 *  - Response can be extended to include invoice ID for audit trail.
 */
export const submitCharges = (
  bookingVehicleId: string,
  charges: Charges,
): Promise<void> =>
  apiClient
    .put(`/booking/vehicles/${bookingVehicleId}/charges`, charges)
    .then(() => {
      console.log('[bookingApi] submitCharges ✓', bookingVehicleId, charges);
    });

/**
 * Fetch final billing details after a trip ends.
 *
 * Called once on Feedback screen mount — never re-fetched within the session.
 *
 * Extensibility:
 *  - Response can be extended with paymentMode, invoiceId, driverEarnings.
 */
export const getBookingDetails = (bookingVehicleId: string): Promise<BookingBilling> =>
  apiClient
    .get<BookingBilling>(`/booking/vehicle/${bookingVehicleId}`)
    .then((res) => {
      console.log('[bookingApi] getBookingDetails ✓', bookingVehicleId, res.data);
      return res.data;
    });
