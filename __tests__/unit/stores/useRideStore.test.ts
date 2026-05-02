/**
 * TC-STORE-001 through TC-STORE-020
 * Unit tests for useRideStore (Zustand)
 */

import { act } from '@testing-library/react';
import { useRideStore } from '../../../src/state/useRideStore';
import type { ActiveRide } from '../../../src/types/ride';
import type { Charge } from '../../../src/types/charge';

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseRideData = (): Omit<ActiveRide, 'status'> => ({
  id: '7',
  bookingVehicleId: '42',
  bookingReference: 'VLV-20260502-ABCD1',
  riderName: 'John Doe',
  customerContact: '9876543210',
  pickupText: 'Bangalore Airport',
  destinationText: 'MG Road',
  pickup: { latitude: 13.1986, longitude: 77.7066 },
  destination: { latitude: 12.9716, longitude: 77.5946 },
  stoppages: [],
  fare: '₹2,000',
  totalFare: 2000,
  balanceAmount: 2000,
  rawWaypoints: [],
  tripType: 'ONE_WAY',
});

function getState() {
  return useRideStore.getState();
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('useRideStore', () => {
  beforeEach(() => {
    act(() => {
      useRideStore.getState().clearRide();
    });
  });

  // TC-STORE-001
  it('initialises with null ride and empty charges', () => {
    const state = getState();
    expect(state.ride).toBeNull();
    expect(state.extraCharges).toEqual([]);
  });

  // TC-STORE-002
  it('initRide sets status to GOING_TO_PICKUP and clears prior charges', () => {
    act(() => {
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      getState().initRide(baseRideData());
    });

    const { ride, extraCharges } = getState();
    expect(ride?.status).toBe('GOING_TO_PICKUP');
    expect(ride?.bookingVehicleId).toBe('42');
    expect(extraCharges).toEqual([]);
  });

  // TC-STORE-003
  it('initRide preserves all ride fields from input', () => {
    act(() => {
      getState().initRide(baseRideData());
    });

    const { ride } = getState();
    expect(ride?.riderName).toBe('John Doe');
    expect(ride?.fare).toBe('₹2,000');
    expect(ride?.tripType).toBe('ONE_WAY');
    expect(ride?.pickup).toEqual({ latitude: 13.1986, longitude: 77.7066 });
  });

  // TC-STORE-004
  it('updateStatus transitions through all valid states', () => {
    act(() => { getState().initRide(baseRideData()); });

    const statuses: Array<ActiveRide['status']> = [
      'ARRIVED_AT_PICKUP',
      'OTP_PENDING',
      'TRIP_STARTED',
      'TRIP_COMPLETED',
    ];

    for (const status of statuses) {
      act(() => { getState().updateStatus(status); });
      expect(getState().ride?.status).toBe(status);
    }
  });

  // TC-STORE-005
  it('updateStatus is a no-op when ride is null', () => {
    act(() => { getState().updateStatus('TRIP_STARTED'); });
    expect(getState().ride).toBeNull();
  });

  // TC-STORE-006
  it('updateRide merges partial data without overwriting other fields', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().updateRide({ riderName: 'Jane Doe', balanceAmount: 1500 });
    });

    const { ride } = getState();
    expect(ride?.riderName).toBe('Jane Doe');
    expect(ride?.balanceAmount).toBe(1500);
    // Other fields preserved
    expect(ride?.fare).toBe('₹2,000');
    expect(ride?.status).toBe('GOING_TO_PICKUP');
  });

  // TC-STORE-007
  it('updateRide is a no-op when ride is null', () => {
    act(() => { getState().updateRide({ riderName: 'Ghost' }); });
    expect(getState().ride).toBeNull();
  });

  // TC-STORE-008
  it('addExtraCharge appends a valid charge', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 150 });
    });

    expect(getState().extraCharges).toEqual([{ type: 'TOLL_CHARGE', amount: 150 }]);
  });

  // TC-STORE-009
  it('addExtraCharge rejects charge with zero amount', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 0 });
    });
    expect(getState().extraCharges).toHaveLength(0);
  });

  // TC-STORE-010
  it('addExtraCharge rejects charge with negative amount', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'MC_FARE', amount: -50 });
    });
    expect(getState().extraCharges).toHaveLength(0);
  });

  // TC-STORE-011
  it('addExtraCharge allows multiple charges of the same type', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 200 });
    });
    expect(getState().extraCharges).toHaveLength(2);
    expect(getState().extraCharges[1].amount).toBe(200);
  });

  // TC-STORE-012
  it('addExtraCharge allows all three charge types', () => {
    const charges: Charge[] = [
      { type: 'MC_FARE', amount: 50 },
      { type: 'TOLL_CHARGE', amount: 100 },
      { type: 'PARKING_CHARGE', amount: 75 },
    ];
    act(() => {
      getState().initRide(baseRideData());
      charges.forEach((c) => getState().addExtraCharge(c));
    });
    expect(getState().extraCharges).toHaveLength(3);
  });

  // TC-STORE-013
  it('updateExtraCharge replaces charge at given index', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      getState().addExtraCharge({ type: 'PARKING_CHARGE', amount: 50 });
      getState().updateExtraCharge(0, { type: 'TOLL_CHARGE', amount: 250 });
    });
    const { extraCharges } = getState();
    expect(extraCharges[0].amount).toBe(250);
    expect(extraCharges[1].amount).toBe(50); // Unchanged
  });

  // TC-STORE-014
  it('updateExtraCharge rejects update with zero amount', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      getState().updateExtraCharge(0, { type: 'TOLL_CHARGE', amount: 0 });
    });
    expect(getState().extraCharges[0].amount).toBe(100); // Unchanged
  });

  // TC-STORE-015
  it('updateExtraCharge rejects update with negative amount', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'PARKING_CHARGE', amount: 80 });
      getState().updateExtraCharge(0, { type: 'PARKING_CHARGE', amount: -10 });
    });
    expect(getState().extraCharges[0].amount).toBe(80); // Unchanged
  });

  // TC-STORE-016
  it('clearRide resets both ride and extraCharges to initial values', () => {
    act(() => {
      getState().initRide(baseRideData());
      getState().addExtraCharge({ type: 'MC_FARE', amount: 200 });
      getState().updateStatus('TRIP_STARTED');
      getState().clearRide();
    });
    const { ride, extraCharges } = getState();
    expect(ride).toBeNull();
    expect(extraCharges).toEqual([]);
  });

  // TC-STORE-017: Multiple rides sequentially (re-init)
  it('initRide on an existing ride fully replaces the previous ride', () => {
    const firstRide = baseRideData();
    const secondRide = { ...baseRideData(), bookingVehicleId: '99', riderName: 'Alice' };

    act(() => {
      getState().initRide(firstRide);
      getState().updateStatus('ARRIVED_AT_PICKUP');
      getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      getState().initRide(secondRide);
    });

    const { ride, extraCharges } = getState();
    expect(ride?.bookingVehicleId).toBe('99');
    expect(ride?.riderName).toBe('Alice');
    expect(ride?.status).toBe('GOING_TO_PICKUP');
    expect(extraCharges).toEqual([]);
  });

  // TC-STORE-018: Hourly trip type stored correctly
  it('stores HOURLY_RENTALS tripType', () => {
    act(() => {
      getState().initRide({ ...baseRideData(), tripType: 'HOURLY_RENTALS' });
    });
    expect(getState().ride?.tripType).toBe('HOURLY_RENTALS');
  });

  // TC-STORE-019: updateRide with rideStartTime (hourly)
  it('updateRide persists rideStartTime for hourly timer', () => {
    act(() => {
      getState().initRide({ ...baseRideData(), tripType: 'HOURLY_RENTALS' });
      getState().updateRide({ rideStartTime: '2026-05-02 09:30:00' });
    });
    expect(getState().ride?.rideStartTime).toBe('2026-05-02 09:30:00');
  });

  // TC-STORE-020: State isolation between store instances
  it('store is a singleton — changes are visible across multiple getState() calls', () => {
    act(() => { getState().initRide(baseRideData()); });
    // Second access returns same store state
    expect(useRideStore.getState().ride?.bookingVehicleId).toBe('42');
  });
});
