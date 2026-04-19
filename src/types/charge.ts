// ─── Charge Types ─────────────────────────────────────────────────────────────

export type ChargeType = 'MCD' | 'Toll' | 'Parking';

/**
 * Represents an extra charge added by the driver during a trip.
 *
 * Extensibility:
 *  - Add `description?: string` for driver notes
 *  - Add `timestamp: string` for audit trail
 *  - Sync to backend via a mutation in useRideStore.addExtraCharge
 */
export interface ExtraCharge {
  amount: number;
  type: ChargeType;
}

// ─── API Payload ──────────────────────────────────────────────────────────────

/**
 * Payload sent to POST /booking/vehicles/{bookingVehicleId}/charges on each save.
 *
 * Mapping:
 *  - mcFare        → sum of all MCD charges
 *  - tollCharge    → sum of all Toll charges
 *  - parkingCharge → sum of all Parking charges
 *
 * Extensibility:
 *  - Backend can apply dynamic pricing rules per field.
 *  - Add `auditTrail?: ExtraCharge[]` for invoice-level detail.
 */
export interface Charges {
  mcFare: number;
  tollCharge: number;
  parkingCharge: number;
}
