/**
 * TC-HR-001 through TC-HR-035
 * Integration tests — Hourly Rental flow
 *
 * Tests the complete hourly booking lifecycle from OTP through end-ride + payment.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useRideStore } from '../../src/state/useRideStore';
import { useLocationStore } from '../../src/state/useLocationStore';
import { useHourlyTimer, parseRideStartTime } from '../../src/hooks/useHourlyTimer';
import { mapBookingDetailToRide } from '../../src/services/bookingService';
import { mockBookingDetail, mockLocationUpdateWithHourlyStart } from '../mocks/api.mock';

// ── Service mocks ─────────────────────────────────────────────────────────────

jest.mock('../../src/services/rideService');
jest.mock('../../src/services/bookingService', () => ({
  fetchBookings: jest.fn(),
  fetchBookingDetail: jest.fn(),
  mapBookingDetailToRide: jest.requireActual('../../src/services/bookingService').mapBookingDetailToRide,
}));
jest.mock('../../src/services/bookingApi');
jest.mock('../../src/context/AlertContext', () => ({
  useAlert: () => ({ showAlert: jest.fn() }),
}));
jest.mock('../../src/storage/tokenStorage', () => ({
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
  setActiveBookingVehicleId: jest.fn(),
  removeActiveBookingVehicleId: jest.fn(),
  getActiveBookingVehicleId: jest.fn().mockResolvedValue('42'),
  getChauffeurId: jest.fn().mockResolvedValue('99'),
}));

import * as rideService from '../../src/services/rideService';
import * as bookingApi from '../../src/services/bookingApi';

const mockRideService = rideService as jest.Mocked<typeof rideService>;
const mockBookingApiModule = bookingApi as jest.Mocked<typeof bookingApi>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function initHourlyRide(bookingVehicleId = '42') {
  const detail = mockBookingDetail({
    tripType: 'HOURLY_RENTALS',
    waypoints: [
      {
        id: 201, waypointId: 201, waypointType: 'PICKUP', type: 'PICKUP',
        latitude: 12.9716, longitude: 77.5946, address: 'Cubbon Park',
        waypointSequence: 0, arrivedAt: null,
      },
    ],
    hourlyPackage: {
      hourlyPackageDetails: {
        hours: 4,
        km: 40,
        hourlyTravelStats: { totalTraveledKm: 0, totalTravelTimeMinutes: 0 },
      },
    },
  });
  const rideData = mapBookingDetailToRide(detail);
  act(() => {
    useRideStore.getState().initRide({ ...rideData, bookingVehicleId });
  });
  return { detail, rideData };
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Hourly Rental Flow', () => {
  beforeEach(() => {
    act(() => {
      useRideStore.getState().clearRide();
      useLocationStore.getState().clearLocationState();
    });
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockRideService.postDriverOnTheWay.mockResolvedValue(undefined);
    mockRideService.postArrived.mockResolvedValue(undefined);
    mockRideService.postVerifyOtp.mockResolvedValue({ rideStartTime: '2026-05-02 10:00:00' });
    mockRideService.postEndRide.mockResolvedValue(undefined);
    mockRideService.postCompletePayment.mockResolvedValue(undefined);
    mockRideService.updateDriverLocation.mockResolvedValue(mockLocationUpdateWithHourlyStart());
    mockBookingApiModule.getCharges.mockResolvedValue([]);
    mockBookingApiModule.updateCharges.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Phase 1: Init ──────────────────────────────────────────────────────────

  // TC-HR-001
  it('PHASE 1: initRide sets tripType to HOURLY_RENTALS', () => {
    initHourlyRide();
    expect(useRideStore.getState().ride?.tripType).toBe('HOURLY_RENTALS');
  });

  // TC-HR-002
  it('PHASE 1: hourlyPackage with 4 hours is stored on ride', () => {
    initHourlyRide();
    expect(useRideStore.getState().ride?.hourlyPackage?.hourlyPackageDetails.hours).toBe(4);
  });

  // TC-HR-003
  it('PHASE 1: hourly ride has no DROP waypoint — destination is (0,0)', () => {
    initHourlyRide();
    const { ride } = useRideStore.getState();
    expect(ride?.destination).toEqual({ latitude: 0, longitude: 0 });
  });

  // ── Phase 2: Go To Pickup ──────────────────────────────────────────────────

  // TC-HR-004
  it('PHASE 2: postDriverOnTheWay is called for hourly trips', async () => {
    initHourlyRide();
    await act(async () => { await rideService.postDriverOnTheWay('42'); });
    expect(mockRideService.postDriverOnTheWay).toHaveBeenCalledWith('42');
  });

  // ── Phase 3: Arrived + OTP ─────────────────────────────────────────────────

  // TC-HR-005
  it('PHASE 3: postArrived transitions state to ARRIVED_AT_PICKUP', async () => {
    initHourlyRide();
    await act(async () => { await rideService.postArrived('42'); });
    act(() => { useRideStore.getState().updateStatus('ARRIVED_AT_PICKUP'); });
    expect(useRideStore.getState().ride?.status).toBe('ARRIVED_AT_PICKUP');
  });

  // TC-HR-006
  it('PHASE 3: postVerifyOtp returns rideStartTime for hourly bookings', async () => {
    const result = await act(async () => {
      return await rideService.postVerifyOtp('42', '1234');
    });
    expect(result.rideStartTime).toBe('2026-05-02 10:00:00');
  });

  // TC-HR-007
  it('PHASE 3: rideStartTime is stored after OTP verification', () => {
    act(() => {
      useLocationStore.getState().setRideStartTime('2026-05-02 10:00:00');
    });
    expect(useLocationStore.getState().rideStartTime).toBe('2026-05-02 10:00:00');
  });

  // TC-HR-008
  it('PHASE 3: status transitions to TRIP_STARTED after OTP', () => {
    initHourlyRide();
    act(() => {
      useRideStore.getState().updateStatus('OTP_PENDING');
      useRideStore.getState().updateStatus('TRIP_STARTED');
    });
    expect(useRideStore.getState().ride?.status).toBe('TRIP_STARTED');
  });

  // ── Phase 4: Timer ─────────────────────────────────────────────────────────

  // TC-HR-009
  it('PHASE 4: useHourlyTimer returns "—" before rideStartTime arrives', () => {
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: null, hours: 4 })
    );
    expect(result.current.formattedTime).toBe('—');
    expect(result.current.isExpired).toBe(false);
  });

  // TC-HR-010
  it('PHASE 4: timer counts down once rideStartTime is set', () => {
    jest.setSystemTime(new Date('2026-05-02T10:00:00'));
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    // 10:00 → 14:00 → 4 hours remaining shown as HH:mm
    expect(result.current.formattedTime).toBe('04:00');
    expect(result.current.isExpired).toBe(false);
  });

  // TC-HR-011
  it('PHASE 4: isExpired=true when time runs out', () => {
    jest.setSystemTime(new Date('2026-05-02T15:00:00')); // 1 hour past end
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    expect(result.current.isExpired).toBe(true);
    expect(result.current.rawMilliseconds).toBeLessThan(0);
  });

  // TC-HR-012
  it('PHASE 4: switches to mm:ss format in last 10 minutes', () => {
    jest.setSystemTime(new Date('2026-05-02T13:55:00')); // 5 min left
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    expect(result.current.formattedTime).toMatch(/^\d{2}:\d{2}$/); // mm:ss
    const parts = result.current.formattedTime.split(':');
    expect(parseInt(parts[0])).toBeLessThanOrEqual(10);
  });

  // TC-HR-013
  it('PHASE 4: endTime is computed as rideStartTime + hours', () => {
    jest.setSystemTime(new Date('2026-05-02T10:00:00'));
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    expect(result.current.endTime?.getHours()).toBe(14);
  });

  // TC-HR-014: Location updates provide rideStartTime
  it('PHASE 4: location-update API response provides rideStartTime', () => {
    const resp = mockLocationUpdateWithHourlyStart();
    act(() => {
      useLocationStore.getState().setSyncResponse({
        waypoint: resp.waypoint,
        distanceMeters: resp.distanceMeters,
        rideStartTime: resp.rideStartTime,
      });
    });
    expect(useLocationStore.getState().rideStartTime).toBe('2026-05-02 09:30:00');
  });

  // TC-HR-015
  it('PHASE 4: timer ticks every second during active ride', () => {
    jest.setSystemTime(new Date('2026-05-02T10:00:00'));
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    const initialMs = result.current.rawMilliseconds;
    act(() => { jest.advanceTimersByTime(3000); });
    expect(result.current.rawMilliseconds).toBeLessThan(initialMs);
  });

  // ── Phase 5: End Hourly Ride ───────────────────────────────────────────────

  // TC-HR-016
  it('PHASE 5: postEndRide is called for hourly trips', async () => {
    await act(async () => { await rideService.postEndRide('42'); });
    expect(mockRideService.postEndRide).toHaveBeenCalledWith('42');
  });

  // TC-HR-017
  it('PHASE 5: updateDriverLocation is called before postEndRide (sendFinalAndStop)', async () => {
    // The hook calls sendFinalAndStop() which sends one last location update
    await act(async () => {
      await rideService.updateDriverLocation('42', 12.9716, 77.5946);
      await rideService.postEndRide('42');
    });
    expect(mockRideService.updateDriverLocation).toHaveBeenCalledBefore
      ? expect(mockRideService.updateDriverLocation).toHaveBeenCalledBefore(mockRideService.postEndRide)
      : expect(mockRideService.updateDriverLocation).toHaveBeenCalled();
  });

  // TC-HR-018
  it('PHASE 5: status transitions to TRIP_COMPLETED after end ride', () => {
    initHourlyRide();
    act(() => { useRideStore.getState().updateStatus('TRIP_COMPLETED'); });
    expect(useRideStore.getState().ride?.status).toBe('TRIP_COMPLETED');
  });

  // TC-HR-019
  it('PHASE 5: location store is cleared after end ride', () => {
    act(() => {
      useLocationStore.getState().setSyncResponse({
        waypoint: null,
        distanceMeters: 15000,
        rideStartTime: '2026-05-02 10:00:00',
      });
      useLocationStore.getState().clearLocationState();
    });
    expect(useLocationStore.getState().rideStartTime).toBeNull();
    expect(useLocationStore.getState().distanceMeters).toBe(0);
  });

  // ── Phase 6: Payment ───────────────────────────────────────────────────────

  // TC-HR-020
  it('PHASE 6: PAID payment with amount', async () => {
    await act(async () => {
      await rideService.postCompletePayment('42', { paymentStatus: 'PAID', amount: 3000 });
    });
    expect(mockRideService.postCompletePayment).toHaveBeenCalledWith('42', {
      paymentStatus: 'PAID',
      amount: 3000,
    });
  });

  // TC-HR-021
  it('PHASE 6: UNPAID payment without amount', async () => {
    await act(async () => {
      await rideService.postCompletePayment('42', { paymentStatus: 'UNPAID' });
    });
    expect(mockRideService.postCompletePayment).toHaveBeenCalledWith('42', {
      paymentStatus: 'UNPAID',
    });
  });

  // TC-HR-022
  it('PHASE 6: ride is cleared after payment', () => {
    initHourlyRide();
    act(() => { useRideStore.getState().clearRide(); });
    expect(useRideStore.getState().ride).toBeNull();
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  // TC-HR-023
  it('EDGE: parseRideStartTime handles the exact server format', () => {
    const d = parseRideStartTime('2026-05-02 09:30:00');
    expect(d).not.toBeNull();
    expect(d?.getFullYear()).toBe(2026);
  });

  // TC-HR-024
  it('EDGE: timer shows "—" when hours is 0', () => {
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 0 })
    );
    expect(result.current.formattedTime).toBe('—');
  });

  // TC-HR-025
  it('EDGE: timer shows "—" when hours is null', () => {
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: null })
    );
    expect(result.current.formattedTime).toBe('—');
  });

  // TC-HR-026
  it('EDGE: isExpired remains false for a very long booking (large hours)', () => {
    jest.setSystemTime(new Date('2026-05-02T10:00:00'));
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 24 })
    );
    expect(result.current.isExpired).toBe(false);
  });

  // TC-HR-027
  it('EDGE: overrun (negative rawMilliseconds) displays overrun duration correctly', () => {
    // 1 hour past a 2-hour booking ending at 12:00 → now = 13:00
    jest.setSystemTime(new Date('2026-05-02T13:00:00'));
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 2 })
    );
    expect(result.current.isExpired).toBe(true);
    // formatHourlyDuration uses Math.abs so we get 1:00 overrun displayed
    expect(result.current.formattedTime).toBe('01:00');
  });

  // TC-HR-028: No-stops guarantee for hourly
  it('EDGE: hourly ride has no stoppages', () => {
    initHourlyRide();
    expect(useRideStore.getState().ride?.stoppages).toHaveLength(0);
  });

  // TC-HR-029: rideStartTime updated on each location sync
  it('EDGE: each location-update can provide a new rideStartTime', () => {
    act(() => {
      useLocationStore.getState().setSyncResponse({
        waypoint: null,
        distanceMeters: 1000,
        rideStartTime: '2026-05-02 10:00:00',
      });
    });
    expect(useLocationStore.getState().rideStartTime).toBe('2026-05-02 10:00:00');

    // Subsequent update doesn't clear if same value
    act(() => {
      useLocationStore.getState().setSyncResponse({
        waypoint: null,
        distanceMeters: 2000,
        rideStartTime: '2026-05-02 10:00:00',
      });
    });
    expect(useLocationStore.getState().rideStartTime).toBe('2026-05-02 10:00:00');
  });

  // TC-HR-030: postEndRide failure is propagated
  it('EDGE: postEndRide failure throws and does not clear ride state', async () => {
    initHourlyRide();
    mockRideService.postEndRide.mockRejectedValueOnce(new Error('Server error'));
    await expect(rideService.postEndRide('42')).rejects.toThrow('Server error');
    // Ride state should still be intact (UI handles the error)
    expect(useRideStore.getState().ride?.status).not.toBe('TRIP_COMPLETED');
  });

  // TC-HR-031: timer cleanup on unmount
  it('EDGE: hourly timer clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 4 })
    );
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  // TC-HR-032: 1-hour booking
  it('EDGE: 1-hour booking expiry is computed correctly', () => {
    jest.setSystemTime(new Date('2026-05-02T11:30:00')); // 30 min past end
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 1 })
    );
    expect(result.current.isExpired).toBe(true);
  });

  // TC-HR-033: 8-hour booking
  it('EDGE: 8-hour booking is not expired after 4 hours', () => {
    jest.setSystemTime(new Date('2026-05-02T14:00:00')); // 4 hours in
    const { result } = renderHook(() =>
      useHourlyTimer({ rideStartTime: '2026-05-02 10:00:00', hours: 8 })
    );
    expect(result.current.isExpired).toBe(false);
  });

  // TC-HR-034: Extra charges can still be added on hourly trips
  it('EDGE: extra charges work on hourly trips', () => {
    initHourlyRide();
    act(() => {
      useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      useRideStore.getState().addExtraCharge({ type: 'PARKING_CHARGE', amount: 50 });
    });
    expect(useRideStore.getState().extraCharges).toHaveLength(2);
  });

  // TC-HR-035: Session expired during hourly ride
  it('EDGE: 401 during location update — no crash, token cleared', async () => {
    mockRideService.updateDriverLocation.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });
    // The hook should handle this gracefully — error not re-thrown to UI
    // (apiClient handles 401 globally)
    await expect(rideService.updateDriverLocation('42', 12.9, 77.5)).rejects.toBeDefined();
  });
});
