// ─── Additional Charges ───────────────────────────────────────────────────────

/**
 * Breakdown of extra charges applied during the trip.
 * Mirrors the additionalCharges object from GET /booking/vehicle/{id}.
 *
 * Extensibility:
 *  - Add `driverAllowance?: number` for future earnings breakdown.
 *  - Add `gstAmount?: number` when tax integration is needed.
 */
export interface AdditionalCharges {
  mcFare: number;
  waitingCharge: number;
  parkingCharge: number;
  tollCharge?: number;
  extraKmCharge?: number;
  extraTimeCharge?: number;
  totalWaitingCharge?: number;
}

// ─── Booking Billing ──────────────────────────────────────────────────────────

/**
 * Full billing response from GET /booking/vehicle/{bookingVehicleId}.
 *
 * Only balanceAmount, additionalCharges, and totalAdditionalAmount
 * are currently surfaced in the UI. The remaining fields are retained
 * here for future use (invoice view, driver earnings, reconciliation).
 *
 * Extensibility:
 *  - paymentMode?: 'cash' | 'online' | 'wallet'
 *  - invoiceId?: string  for audit trail linking
 *  - driverEarnings?: number  for driver pay breakdown
 */
export interface BookingBilling {
  baseFare: number;
  actualFare: number;
  advanceAmount: number;
  balanceAmount: number;
  additionalCharges: AdditionalCharges;
  totalAdditionalAmount: number;
}
