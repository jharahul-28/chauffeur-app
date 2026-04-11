import { useState, useCallback } from 'react';
import { ActiveRide, RideStatus } from '../types/ride';
import { ExtraCharge } from '../types/charge';

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages the local state of the active ride, including any extra charges
 * the driver adds during the trip (MCD, Toll, Parking).
 *
 * Usage:
 *   const { ride, extraCharges, initRide, updateStatus, addExtraCharge, clearRide } = useRideStore();
 *
 * Extensibility:
 *   - Replace `initRide` with an API call that populates real ride data
 *   - Replace `updateStatus` with a mutation that syncs state to the backend
 *   - Replace `addExtraCharge` with a mutation that posts charges to the backend
 *   - Add `removeExtraCharge(index)` for charge corrections
 */
export function useRideStore() {
  const [ride, setRide] = useState<ActiveRide | null>(null);
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>([]);

  /**
   * Initialise a new ride from real booking detail data.
   * Resets extra charges for the fresh trip.
   * Called when the driver taps "Go to Pickup".
   */
  const initRide = useCallback((rideData: Omit<ActiveRide, 'status'>) => {
    setRide({ ...rideData, status: 'GOING_TO_PICKUP' });
    setExtraCharges([]);
  }, []);

  /**
   * Advance the ride state machine to the next status.
   * Safe to call when `ride` is null (no-op).
   */
  const updateStatus = useCallback((status: RideStatus) => {
    setRide((prev) => (prev ? { ...prev, status } : null));
  }, []);

  /**
   * Append an extra charge to the current trip.
   * Called when the driver submits the ChargeModal.
   * Safe to call when `ride` is null (no-op).
   */
  const addExtraCharge = useCallback((charge: ExtraCharge) => {
    if (!charge.amount || charge.amount <= 0) return;
    setExtraCharges((prev) => [...prev, charge]);
  }, []);

  /**
   * Tear down the current ride and clear all charges.
   * Called after trip completion, cancellation, or navigating back.
   */
  const clearRide = useCallback(() => {
    setRide(null);
    setExtraCharges([]);
  }, []);

  return { ride, extraCharges, initRide, updateStatus, addExtraCharge, clearRide };
}
