/**
 * TC-SVC-001 through TC-SVC-025
 * Unit tests for rideService
 */

import {
  postDriverOnTheWay,
  postArrived,
  postVerifyOtp,
  postWaiting,
  postContinue,
  postArrivedAtStop,
  postSkipStop,
  postEndRide,
  postCompletePayment,
  updateDriverLocation,
} from '../../../src/services/rideService';
import {
  mockLocationUpdateResponse,
  mockWaitingResponse,
} from '../../mocks/api.mock';

// ── Mock apiClient ─────────────────────────────────────────────────────────────

jest.mock('../../../src/services/apiClient', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import apiClient from '../../../src/services/apiClient';
const mockPost = apiClient.post as jest.Mock;

const BV_ID = '42';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('rideService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // TC-SVC-001
  it('postDriverOnTheWay POSTs to correct endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postDriverOnTheWay(BV_ID);
    expect(mockPost).toHaveBeenCalledWith(`/chauffeur/${BV_ID}/driver-on-the-way`);
  });

  // TC-SVC-002
  it('postArrived POSTs to correct endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postArrived(BV_ID);
    expect(mockPost).toHaveBeenCalledWith(`/chauffeur/${BV_ID}/arrived`);
  });

  // TC-SVC-003
  it('postVerifyOtp POSTs with otp as query param', async () => {
    mockPost.mockResolvedValueOnce({ data: { rideStartTime: null } });
    const result = await postVerifyOtp(BV_ID, '1234');
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/verify-otp`,
      null,
      { params: { otp: '1234' } }
    );
    expect(result).toEqual({ rideStartTime: null });
  });

  // TC-SVC-004
  it('postVerifyOtp returns rideStartTime for hourly bookings', async () => {
    mockPost.mockResolvedValueOnce({ data: { rideStartTime: '2026-05-02 09:30:00' } });
    const result = await postVerifyOtp(BV_ID, '5678');
    expect(result.rideStartTime).toBe('2026-05-02 09:30:00');
  });

  // TC-SVC-005
  it('postVerifyOtp throws on wrong OTP (non-2xx status)', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Invalid OTP' } } });
    await expect(postVerifyOtp(BV_ID, '0000')).rejects.toBeDefined();
  });

  // TC-SVC-006
  it('postWaiting POSTs to correct endpoint and returns WaitingResponse', async () => {
    const waitingResp = mockWaitingResponse(120);
    mockPost.mockResolvedValueOnce({ data: waitingResp });
    const result = await postWaiting(BV_ID);
    expect(mockPost).toHaveBeenCalledWith(`/chauffeur/${BV_ID}/waiting`);
    expect(result.totalWaitingSeconds).toBe(120);
  });

  // TC-SVC-007
  it('postContinue POSTs to correct endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postContinue(BV_ID);
    expect(mockPost).toHaveBeenCalledWith(`/chauffeur/${BV_ID}/continue`);
  });

  // TC-SVC-008
  it('postArrivedAtStop sends waypointId as query param', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postArrivedAtStop(BV_ID, 103);
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/arrived-at-stop`,
      null,
      { params: { waypointId: 103 } }
    );
  });

  // TC-SVC-009
  it('postSkipStop sends waypointId as query param', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postSkipStop(BV_ID, 103);
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/skip-stop`,
      null,
      { params: { waypointId: 103 } }
    );
  });

  // TC-SVC-010
  it('postEndRide POSTs to correct endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postEndRide(BV_ID);
    expect(mockPost).toHaveBeenCalledWith(`/chauffeur/${BV_ID}/end-ride`);
  });

  // TC-SVC-011
  it('postCompletePayment sends PAID status with amount', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postCompletePayment(BV_ID, { paymentStatus: 'PAID', amount: 2000 });
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/complete`,
      { paymentStatus: 'PAID', amount: 2000 }
    );
  });

  // TC-SVC-012
  it('postCompletePayment sends UNPAID status without amount', async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await postCompletePayment(BV_ID, { paymentStatus: 'UNPAID' });
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/complete`,
      { paymentStatus: 'UNPAID' }
    );
  });

  // TC-SVC-013
  it('updateDriverLocation sends coordinates in request body', async () => {
    const resp = mockLocationUpdateResponse();
    mockPost.mockResolvedValueOnce({ data: resp });
    await updateDriverLocation(BV_ID, 13.1986, 77.7066);
    expect(mockPost).toHaveBeenCalledWith(
      `/chauffeur/${BV_ID}/location-update`,
      { currentLatitude: 13.1986, currentLongitude: 77.7066 }
    );
  });

  // TC-SVC-014
  it('updateDriverLocation returns LocationUpdateResponse', async () => {
    const resp = mockLocationUpdateResponse({ arrived: false, distanceMeters: 5200 });
    mockPost.mockResolvedValueOnce({ data: resp });
    const result = await updateDriverLocation(BV_ID, 13.1986, 77.7066);
    expect(result.arrived).toBe(false);
    expect(result.distanceMeters).toBe(5200);
  });

  // TC-SVC-015
  it('updateDriverLocation throws on API error (does not swallow)', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(updateDriverLocation(BV_ID, 0, 0)).rejects.toBeDefined();
  });

  // TC-SVC-016
  it('updateDriverLocation returns arrived=true when backend signals arrival', async () => {
    const resp = mockLocationUpdateResponse({ arrived: true, distanceMeters: 0 });
    mockPost.mockResolvedValueOnce({ data: resp });
    const result = await updateDriverLocation(BV_ID, 13.1986, 77.7066);
    expect(result.arrived).toBe(true);
  });

  // TC-SVC-017
  it('updateDriverLocation returns rideStartTime for hourly rides', async () => {
    const resp = mockLocationUpdateResponse({ rideStartTime: '2026-05-02 09:30:00' });
    mockPost.mockResolvedValueOnce({ data: resp });
    const result = await updateDriverLocation(BV_ID, 12.9716, 77.5946);
    expect(result.rideStartTime).toBe('2026-05-02 09:30:00');
  });

  // TC-SVC-018
  it('postWaiting returns totalWaitingSeconds = 0 for first wait session', async () => {
    mockPost.mockResolvedValueOnce({ data: mockWaitingResponse(0) });
    const result = await postWaiting(BV_ID);
    expect(result.totalWaitingSeconds).toBe(0);
  });

  // TC-SVC-019
  it('postWaiting returns cumulative seconds on second wait session', async () => {
    mockPost.mockResolvedValueOnce({ data: mockWaitingResponse(200) });
    const result = await postWaiting(BV_ID);
    expect(result.totalWaitingSeconds).toBe(200);
    expect(result.totalWaitingSeconds).toBeGreaterThanOrEqual(180); // Exceeded threshold
  });

  // TC-SVC-020: All endpoints use the correct bookingVehicleId in path
  it('all endpoints use bookingVehicleId correctly in URL path', async () => {
    const id = '99';
    mockPost.mockResolvedValue({ data: undefined });

    await postDriverOnTheWay(id);
    await postArrived(id);
    await postEndRide(id);

    const calls = mockPost.mock.calls.map((c) => c[0] as string);
    calls.forEach((url) => {
      expect(url).toContain(`/chauffeur/${id}/`);
    });
  });
});
