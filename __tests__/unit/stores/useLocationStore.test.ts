/**
 * TC-LOCSTORE-001 through TC-LOCSTORE-012
 * Unit tests for useLocationStore (Zustand)
 */

import { act } from '@testing-library/react';
import { useLocationStore } from '../../../src/state/useLocationStore';

function getState() {
  return useLocationStore.getState();
}

describe('useLocationStore', () => {
  beforeEach(() => {
    act(() => { useLocationStore.getState().clearLocationState(); });
  });

  // TC-LOCSTORE-001
  it('initialises with null waypoint, 0 distance, null rideStartTime, false arrived', () => {
    const state = getState();
    expect(state.nextWaypoint).toBeNull();
    expect(state.distanceMeters).toBe(0);
    expect(state.rideStartTime).toBeNull();
    expect(state.arrived).toBe(false);
  });

  // TC-LOCSTORE-002
  it('setNextWaypoint stores the given waypoint', () => {
    const waypoint = { type: 'PICKUP' as const, latitude: 13.1986, longitude: 77.7066, address: 'Airport' };
    act(() => { getState().setNextWaypoint(waypoint); });
    expect(getState().nextWaypoint).toEqual(waypoint);
  });

  // TC-LOCSTORE-003
  it('setNextWaypoint can be set to null', () => {
    act(() => {
      getState().setNextWaypoint({ type: 'DROP', latitude: 1, longitude: 1, address: 'X' });
      getState().setNextWaypoint(null);
    });
    expect(getState().nextWaypoint).toBeNull();
  });

  // TC-LOCSTORE-004
  it('setSyncResponse updates all fields from a location-update response', () => {
    const waypoint = { type: 'STOP' as const, latitude: 13.0, longitude: 77.6, address: 'Hebbal' };
    act(() => {
      getState().setSyncResponse({
        waypoint,
        distanceMeters: 3200,
        rideStartTime: '2026-05-02 09:30:00',
        arrived: true,
      });
    });

    const state = getState();
    expect(state.nextWaypoint).toEqual(waypoint);
    expect(state.distanceMeters).toBe(3200);
    expect(state.rideStartTime).toBe('2026-05-02 09:30:00');
    expect(state.arrived).toBe(true);
  });

  // TC-LOCSTORE-005
  it('setSyncResponse defaults arrived to false when omitted', () => {
    act(() => {
      getState().setSyncResponse({
        waypoint: null,
        distanceMeters: 100,
      });
    });
    expect(getState().arrived).toBe(false);
  });

  // TC-LOCSTORE-006
  it('setSyncResponse treats undefined rideStartTime as null', () => {
    act(() => {
      getState().setSyncResponse({ waypoint: null, distanceMeters: 0, rideStartTime: undefined });
    });
    expect(getState().rideStartTime).toBeNull();
  });

  // TC-LOCSTORE-007
  it('setRideStartTime persists the time string', () => {
    act(() => { getState().setRideStartTime('2026-05-02 10:00:00'); });
    expect(getState().rideStartTime).toBe('2026-05-02 10:00:00');
  });

  // TC-LOCSTORE-008
  it('setRideStartTime can clear to null', () => {
    act(() => {
      getState().setRideStartTime('2026-05-02 10:00:00');
      getState().setRideStartTime(null);
    });
    expect(getState().rideStartTime).toBeNull();
  });

  // TC-LOCSTORE-009
  it('clearLocationState resets all fields to initial values', () => {
    act(() => {
      getState().setSyncResponse({
        waypoint: { type: 'DROP', latitude: 12.9716, longitude: 77.5946, address: 'MG Road' },
        distanceMeters: 1000,
        rideStartTime: '2026-05-02 11:00:00',
        arrived: true,
      });
      getState().clearLocationState();
    });

    const state = getState();
    expect(state.nextWaypoint).toBeNull();
    expect(state.distanceMeters).toBe(0);
    expect(state.rideStartTime).toBeNull();
    expect(state.arrived).toBe(false);
  });

  // TC-LOCSTORE-010
  it('distanceMeters is overwritten on each setSyncResponse (not accumulated)', () => {
    act(() => {
      getState().setSyncResponse({ waypoint: null, distanceMeters: 5000 });
      getState().setSyncResponse({ waypoint: null, distanceMeters: 3000 });
    });
    expect(getState().distanceMeters).toBe(3000);
  });

  // TC-LOCSTORE-011
  it('arrived flag transitions from false → true → false across updates', () => {
    act(() => { getState().setSyncResponse({ waypoint: null, distanceMeters: 10, arrived: true }); });
    expect(getState().arrived).toBe(true);

    act(() => { getState().setSyncResponse({ waypoint: null, distanceMeters: 0, arrived: false }); });
    expect(getState().arrived).toBe(false);
  });

  // TC-LOCSTORE-012
  it('waypoint type can be PICKUP, STOP, or DROP', () => {
    const types: Array<'PICKUP' | 'STOP' | 'DROP'> = ['PICKUP', 'STOP', 'DROP'];
    for (const type of types) {
      act(() => {
        getState().setNextWaypoint({ type, latitude: 12.9, longitude: 77.5, address: 'X' });
      });
      expect(getState().nextWaypoint?.type).toBe(type);
    }
  });
});
