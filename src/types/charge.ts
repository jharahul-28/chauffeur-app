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
