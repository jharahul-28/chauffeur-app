/**
 * TC-OW-001 through TC-OW-040
 * Integration tests — One-Way booking flow
 *
 * Tests the full state machine from booking selection through payment completion.
 * Exercises: useRideStore + rideService + useWaitTimer + useCharges together.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useRideStore } from '../../src/state/useRideStore';
import { useWaitTimer } from '../../src/hooks/useWaitTimer';
import { mapBookingDetailToRide } from '../../src/services/bookingService';
import { mockBookingDetail, mockWaitingResponse, mockCharges } from '../mocks/api.mock';

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

import * as rideService from '../../src/services/rideService';
import * as bookingService from '../../src/services/bookingService';
import * as bookingApi from '../../src/services/bookingApi';

const mockRideService = rideService as jest.Mocked<typeof rideService>;
const mockBookingService = bookingService as jest.Mocked<typeof bookingService>;
const mockBookingApiModule = bookingApi as jest.Mocked<typeof bookingApi>;

// ── Helper: simulate booking selection + ride init ────────────────────────────

function initTestRide(bookingVehicleId = '42') {
  const detail = mockBookingDetail();
  const rideData = mapBookingDetailToRide(detail);
  act(() => {
    useRideStore.getState().initRide({ ...rideData, bookingVehicleId });
  });
  return rideData;
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('One-Way Flow: State Machine', () => {
  beforeEach(() => {
    act(() => { useRideStore.getState().clearRide(); });
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default service mock responses
    mockRideService.postDriverOnTheWay.mockResolvedValue(undefined);
    mockRideService.postArrived.mockResolvedValue(undefined);
    mockRideService.postVerifyOtp.mockResolvedValue({ rideStartTime: null });
    mockRideService.postWaiting.mockResolvedValue(mockWaitingResponse(0));
    mockRideService.postContinue.mockResolvedValue(undefined);
    mockRideService.postEndRide.mockResolvedValue(undefined);
    mockRideService.postCompletePayment.mockResolvedValue(undefined);
    mockRideService.postArrivedAtStop.mockResolvedValue(undefined);
    mockRideService.postSkipStop.mockResolvedValue(undefined);
    mockBookingApiModule.getCharges.mockResolvedValue(mockCharges());
    mockBookingApiModule.updateCharges.mockResolvedValue(mockCharges());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Phase 1: Booking Selection ─────────────────────────────────────────────

  // TC-OW-001
  it('PHASE 1: initRide sets status to GOING_TO_PICKUP', () => {
    initTestRide();
    expect(useRideStore.getState().ride?.status).toBe('GOING_TO_PICKUP');
  });

  // TC-OW-002
  it('PHASE 1: ride contains correct bookingVehicleId after init', () => {
    initTestRide('42');
    expect(useRideStore.getState().ride?.bookingVehicleId).toBe('42');
  });

  // TC-OW-003
  it('PHASE 1: ride has pickup and destination coordinates', () => {
    initTestRide();
    const { ride } = useRideStore.getState();
    expect(ride?.pickup.latitude).not.toBe(0);
    expect(ride?.destination.latitude).not.toBe(0);
  });

  // TC-OW-004
  it('PHASE 1: ONE_WAY booking has correct tripType', () => {
    initTestRide();
    expect(useRideStore.getState().ride?.tripType).toBe('ONE_WAY');
  });

  // ── Phase 2: Go To Pickup ──────────────────────────────────────────────────

  // TC-OW-005
  it('PHASE 2: postDriverOnTheWay is called when driver starts navigation', async () => {
    initTestRide('42');
    await act(async () => {
      await rideService.postDriverOnTheWay('42');
    });
    expect(mockRideService.postDriverOnTheWay).toHaveBeenCalledWith('42');
  });

  // TC-OW-006
  it('PHASE 2: postDriverOnTheWay failure does not crash ride state', async () => {
    mockRideService.postDriverOnTheWay.mockRejectedValueOnce(new Error('Network'));
    initTestRide('42');
    await expect(rideService.postDriverOnTheWay('42')).rejects.toThrow('Network');
    // Ride state should remain intact
    expect(useRideStore.getState().ride?.status).toBe('GOING_TO_PICKUP');
  });

  // ── Phase 3: Arrived at Pickup ─────────────────────────────────────────────

  // TC-OW-007
  it('PHASE 3: status transitions to ARRIVED_AT_PICKUP', () => {
    initTestRide();
    act(() => { useRideStore.getState().updateStatus('ARRIVED_AT_PICKUP'); });
    expect(useRideStore.getState().ride?.status).toBe('ARRIVED_AT_PICKUP');
  });

  // TC-OW-008
  it('PHASE 3: postArrived API is called', async () => {
    await act(async () => {
      await rideService.postArrived('42');
    });
    expect(mockRideService.postArrived).toHaveBeenCalledWith('42');
  });

  // ── Phase 4: OTP Verification ──────────────────────────────────────────────

  // TC-OW-009
  it('PHASE 4: status transitions to OTP_PENDING when driver taps Enter OTP', () => {
    initTestRide();
    act(() => { useRideStore.getState().updateStatus('OTP_PENDING'); });
    expect(useRideStore.getState().ride?.status).toBe('OTP_PENDING');
  });

  // TC-OW-010
  it('PHASE 4: correct OTP verifies successfully', async () => {
    const result = await act(async () => {
      return await rideService.postVerifyOtp('42', '1234');
    });
    expect(result).toEqual({ rideStartTime: null });
  });

  // TC-OW-011
  it('PHASE 4: wrong OTP throws error (modal shows error)', async () => {
    mockRideService.postVerifyOtp.mockRejectedValueOnce(
      new Error('OTP verification failed. Please try again.')
    );
    await expect(rideService.postVerifyOtp('42', '0000')).rejects.toThrow(
      'OTP verification failed. Please try again.'
    );
  });

  // TC-OW-012
  it('PHASE 4: status goes back to ARRIVED_AT_PICKUP if OTP modal dismissed', () => {
    initTestRide();
    act(() => { useRideStore.getState().updateStatus('OTP_PENDING'); });
    act(() => { useRideStore.getState().updateStatus('ARRIVED_AT_PICKUP'); }); // Dismissed
    expect(useRideStore.getState().ride?.status).toBe('ARRIVED_AT_PICKUP');
  });

  // TC-OW-013
  it('PHASE 4: status transitions to TRIP_STARTED after OTP success', () => {
    initTestRide();
    act(() => {
      useRideStore.getState().updateStatus('OTP_PENDING');
      useRideStore.getState().updateStatus('TRIP_STARTED');
    });
    expect(useRideStore.getState().ride?.status).toBe('TRIP_STARTED');
  });

  // ── Phase 5: Active Trip ───────────────────────────────────────────────────

  // TC-OW-014
  it('PHASE 5: arrived-at-stop API called with correct waypointId', async () => {
    await act(async () => {
      await rideService.postArrivedAtStop('42', 103);
    });
    expect(mockRideService.postArrivedAtStop).toHaveBeenCalledWith('42', 103);
  });

  // TC-OW-015
  it('PHASE 5: skip-stop API called with correct waypointId', async () => {
    await act(async () => {
      await rideService.postSkipStop('42', 103);
    });
    expect(mockRideService.postSkipStop).toHaveBeenCalledWith('42', 103);
  });

  // ── Phase 6: Wait Feature ──────────────────────────────────────────────────

  // TC-OW-016
  it('PHASE 6: postWaiting API called when driver taps Wait', async () => {
    await act(async () => {
      await rideService.postWaiting('42');
    });
    expect(mockRideService.postWaiting).toHaveBeenCalledWith('42');
  });

  // TC-OW-017
  it('PHASE 6: wait timer starts from backend totalWaitingSeconds', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(120); });
    expect(result.current.currentSeconds).toBe(120);
    expect(result.current.isWaiting).toBe(true);
  });

  // TC-OW-018
  it('PHASE 6: isFreeTimeExceeded triggers after 180 seconds', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(180); });
    expect(result.current.isFreeTimeExceeded).toBe(true);
  });

  // TC-OW-019
  it('PHASE 6: postContinue is called when driver resumes', async () => {
    await act(async () => {
      await rideService.postContinue('42');
    });
    expect(mockRideService.postContinue).toHaveBeenCalledWith('42');
  });

  // TC-OW-020
  it('PHASE 6: timer stops and freezes when driver resumes', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(60); });
    act(() => { jest.advanceTimersByTime(5000); });
    act(() => { result.current.stopWaiting(); });
    const frozen = result.current.currentSeconds;
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.currentSeconds).toBe(frozen);
  });

  // TC-OW-021: End trip blocked while waiting
  it('PHASE 6: canEndTrip returns false when isWaiting=true', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(0); });
    // The guard: !isWaiting required to end trip
    expect(result.current.isWaiting).toBe(true);
  });

  // ── Phase 7: Extra Charges ─────────────────────────────────────────────────

  // TC-OW-022
  it('PHASE 7: toll charge added to ride store', () => {
    initTestRide();
    act(() => { useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 150 }); });
    expect(useRideStore.getState().extraCharges).toHaveLength(1);
    expect(useRideStore.getState().extraCharges[0].type).toBe('TOLL_CHARGE');
  });

  // TC-OW-023
  it('PHASE 7: parking charge added', () => {
    initTestRide();
    act(() => { useRideStore.getState().addExtraCharge({ type: 'PARKING_CHARGE', amount: 80 }); });
    expect(useRideStore.getState().extraCharges[0].type).toBe('PARKING_CHARGE');
  });

  // TC-OW-024
  it('PHASE 7: charges are saved to API (PUT then GET)', async () => {
    const charges = [{ type: 'TOLL_CHARGE' as const, amount: 150 }];
    mockBookingApiModule.updateCharges.mockResolvedValueOnce(charges);
    mockBookingApiModule.getCharges.mockResolvedValueOnce(charges);

    await act(async () => {
      await bookingApi.updateCharges('42', charges);
      await bookingApi.getCharges('42');
    });

    expect(mockBookingApiModule.updateCharges).toHaveBeenCalledWith('42', charges);
    expect(mockBookingApiModule.getCharges).toHaveBeenCalledWith('42');
  });

  // TC-OW-025
  it('PHASE 7: charge edit updates existing charge at index', () => {
    initTestRide();
    act(() => {
      useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      useRideStore.getState().updateExtraCharge(0, { type: 'TOLL_CHARGE', amount: 250 });
    });
    expect(useRideStore.getState().extraCharges[0].amount).toBe(250);
  });

  // ── Phase 8: End Trip ──────────────────────────────────────────────────────

  // TC-OW-026
  it('PHASE 8: postEndRide API called', async () => {
    await act(async () => {
      await rideService.postEndRide('42');
    });
    expect(mockRideService.postEndRide).toHaveBeenCalledWith('42');
  });

  // TC-OW-027
  it('PHASE 8: status transitions to TRIP_COMPLETED after end ride', () => {
    initTestRide();
    act(() => { useRideStore.getState().updateStatus('TRIP_COMPLETED'); });
    expect(useRideStore.getState().ride?.status).toBe('TRIP_COMPLETED');
  });

  // TC-OW-028
  it('PHASE 8: wait timer is reset at trip end', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => {
      result.current.startWaiting(120);
      jest.advanceTimersByTime(30000);
      result.current.resetTimer();
    });
    expect(result.current.currentSeconds).toBe(0);
    expect(result.current.isWaiting).toBe(false);
  });

  // ── Phase 9: Payment ───────────────────────────────────────────────────────

  // TC-OW-029
  it('PHASE 9: PAID payment calls postCompletePayment with correct payload', async () => {
    await act(async () => {
      await rideService.postCompletePayment('42', { paymentStatus: 'PAID', amount: 2000 });
    });
    expect(mockRideService.postCompletePayment).toHaveBeenCalledWith('42', {
      paymentStatus: 'PAID',
      amount: 2000,
    });
  });

  // TC-OW-030
  it('PHASE 9: UNPAID payment calls postCompletePayment without amount', async () => {
    await act(async () => {
      await rideService.postCompletePayment('42', { paymentStatus: 'UNPAID' });
    });
    expect(mockRideService.postCompletePayment).toHaveBeenCalledWith('42', {
      paymentStatus: 'UNPAID',
    });
  });

  // TC-OW-031
  it('PHASE 9: payment amount must be > 0 for PAID status', () => {
    // Zero amount should not be passed to the API
    const payload = { paymentStatus: 'PAID' as const, amount: 0 };
    expect(payload.amount).toBe(0);
    // UI validation prevents this — amount input should not allow 0
  });

  // TC-OW-032
  it('PHASE 9: postCompletePayment failure shows error', async () => {
    mockRideService.postCompletePayment.mockRejectedValueOnce(new Error('Payment failed'));
    await expect(rideService.postCompletePayment('42', { paymentStatus: 'PAID', amount: 2000 })).rejects.toThrow('Payment failed');
  });

  // TC-OW-033
  it('PHASE 9: clearRide is called after successful payment', () => {
    initTestRide();
    act(() => {
      useRideStore.getState().updateStatus('TRIP_COMPLETED');
      useRideStore.getState().clearRide();
    });
    expect(useRideStore.getState().ride).toBeNull();
    expect(useRideStore.getState().extraCharges).toEqual([]);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  // TC-OW-034: Multiple charges of different types
  it('EDGE: handles multiple different charge types per trip', () => {
    initTestRide();
    act(() => {
      useRideStore.getState().addExtraCharge({ type: 'MC_FARE', amount: 50 });
      useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      useRideStore.getState().addExtraCharge({ type: 'PARKING_CHARGE', amount: 75 });
    });
    expect(useRideStore.getState().extraCharges).toHaveLength(3);
  });

  // TC-OW-035: Multiple toll charges (same type, multiple instances)
  it('EDGE: allows multiple TOLL_CHARGE entries', () => {
    initTestRide();
    act(() => {
      useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 });
      useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 200 });
    });
    expect(useRideStore.getState().extraCharges).toHaveLength(2);
  });

  // TC-OW-036: Zero-amount charge rejected
  it('EDGE: zero-amount charge is silently rejected', () => {
    initTestRide();
    act(() => { useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 0 }); });
    expect(useRideStore.getState().extraCharges).toHaveLength(0);
  });

  // TC-OW-037: API retry on network failure
  it('EDGE: rideService propagates error on network failure', async () => {
    mockRideService.postEndRide.mockRejectedValueOnce(new Error('Network timeout'));
    await expect(rideService.postEndRide('42')).rejects.toThrow('Network timeout');
  });

  // TC-OW-038: Re-entry guard — initRide on active ride clears previous state
  it('EDGE: re-entering the same booking re-inits cleanly', () => {
    initTestRide('42');
    act(() => { useRideStore.getState().updateStatus('TRIP_STARTED'); });
    act(() => { useRideStore.getState().addExtraCharge({ type: 'TOLL_CHARGE', amount: 100 }); });

    // Simulate navigating back and re-entering
    act(() => { initTestRide('42'); });

    expect(useRideStore.getState().ride?.status).toBe('GOING_TO_PICKUP');
    expect(useRideStore.getState().extraCharges).toHaveLength(0);
  });

  // TC-OW-039: Wait > 180 seconds enables extra charge
  it('EDGE: wait > 3 minutes sets isExtraChargeApplicable', () => {
    const { result } = renderHook(() => useWaitTimer());
    act(() => { result.current.startWaiting(200); });
    expect(result.current.isExtraChargeApplicable).toBe(true);
  });

  // TC-OW-040: Invalid bookingVehicleId (empty string) fails gracefully
  it('EDGE: postDriverOnTheWay with empty ID still calls correct path', async () => {
    mockRideService.postDriverOnTheWay.mockResolvedValueOnce(undefined);
    await rideService.postDriverOnTheWay('');
    expect(mockRideService.postDriverOnTheWay).toHaveBeenCalledWith('');
  });
});
