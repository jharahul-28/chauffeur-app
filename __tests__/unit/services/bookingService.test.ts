/**
 * TC-BSVC-001 through TC-BSVC-020
 * Unit tests for bookingService
 */

import {
  fetchBookings,
  fetchBookingDetail,
  mapBookingDetailToRide,
} from '../../../src/services/bookingService';
import { mockBookingDetail } from '../../mocks/api.mock';

// ── Mock dependencies ─────────────────────────────────────────────────────────

jest.mock('../../../src/services/apiClient', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../../../src/storage/tokenStorage', () => ({
  getChauffeurId: jest.fn().mockResolvedValue('99'),
}));

import apiClient from '../../../src/services/apiClient';
import { getChauffeurId } from '../../../src/storage/tokenStorage';
const mockGet = apiClient.get as jest.Mock;
const mockGetChauffeurId = getChauffeurId as jest.Mock;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchBookings', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // TC-BSVC-001
  it('calls correct endpoint with chauffeurId and status param', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    await fetchBookings('CURRENT');
    expect(mockGet).toHaveBeenCalledWith('/chauffeur/99/bookings', { params: { status: 'CURRENT' } });
  });

  // TC-BSVC-002
  it('handles wrapped { data: [] } response format', async () => {
    const { mockBookingVehicle } = require('../../mocks/api.mock');
    mockGet.mockResolvedValueOnce({ data: { data: [mockBookingVehicle()] } });
    const result = await fetchBookings('CURRENT');
    expect(result).toHaveLength(1);
  });

  // TC-BSVC-003
  it('handles flat array response format', async () => {
    const { mockBookingVehicle } = require('../../mocks/api.mock');
    mockGet.mockResolvedValueOnce({ data: [mockBookingVehicle()] });
    const result = await fetchBookings('CURRENT');
    expect(result).toHaveLength(1);
  });

  // TC-BSVC-004
  it('throws "Session expired" error when chauffeurId is null', async () => {
    mockGetChauffeurId.mockResolvedValueOnce(null);
    await expect(fetchBookings('CURRENT')).rejects.toThrow('Session expired. Please log in again.');
  });

  // TC-BSVC-005
  it('maps all raw bookings through mapApiBookingVehicle', async () => {
    const { mockBookingVehicle } = require('../../mocks/api.mock');
    const raw = [mockBookingVehicle({ id: 1 }), mockBookingVehicle({ id: 2 })];
    mockGet.mockResolvedValueOnce({ data: { data: raw } });
    const result = await fetchBookings('CURRENT');
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  // TC-BSVC-006
  it('returns empty array when data is undefined', async () => {
    mockGet.mockResolvedValueOnce({ data: {} });
    const result = await fetchBookings('CURRENT');
    expect(result).toEqual([]);
  });

  // TC-BSVC-007
  it('propagates API errors to caller', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    await expect(fetchBookings('CURRENT')).rejects.toThrow('Network error');
  });
});

describe('fetchBookingDetail', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // TC-BSVC-008
  it('calls GET /bookings/:bookingId', async () => {
    mockGet.mockResolvedValueOnce({ data: mockBookingDetail() });
    await fetchBookingDetail('7');
    expect(mockGet).toHaveBeenCalledWith('/bookings/7');
  });

  // TC-BSVC-009
  it('returns the booking detail response', async () => {
    const detail = mockBookingDetail({ bookingReference: 'TEST-REF' });
    mockGet.mockResolvedValueOnce({ data: detail });
    const result = await fetchBookingDetail('7');
    expect(result.bookingReference).toBe('TEST-REF');
  });

  // TC-BSVC-010
  it('propagates API errors to caller', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(fetchBookingDetail('999')).rejects.toBeDefined();
  });
});

describe('mapBookingDetailToRide', () => {
  // TC-BSVC-011
  it('maps id and bookingReference from detail', () => {
    const detail = mockBookingDetail({ id: 7, bookingReference: 'VLV-TEST-001' });
    const ride = mapBookingDetailToRide(detail);
    expect(ride.id).toBe('7');
    expect(ride.bookingReference).toBe('VLV-TEST-001');
  });

  // TC-BSVC-012
  it('throws if no PICKUP waypoint exists', () => {
    const detail = mockBookingDetail();
    detail.waypoints = detail.waypoints.filter((w) => w.waypointType !== 'PICKUP' && w.type !== 'PICKUP');
    expect(() => mapBookingDetailToRide(detail)).toThrow('Booking has no PICKUP waypoint');
  });

  // TC-BSVC-013
  it('maps pickup coordinate from PICKUP waypoint', () => {
    const detail = mockBookingDetail();
    const ride = mapBookingDetailToRide(detail);
    expect(ride.pickup).toEqual({ latitude: 13.1986, longitude: 77.7066 });
  });

  // TC-BSVC-014
  it('maps destination coordinate from DROP waypoint', () => {
    const detail = mockBookingDetail();
    const ride = mapBookingDetailToRide(detail);
    expect(ride.destination).toEqual({ latitude: 12.9716, longitude: 77.5946 });
  });

  // TC-BSVC-015
  it('maps intermediate STOP waypoints as stoppages', () => {
    const detail = mockBookingDetail();
    const ride = mapBookingDetailToRide(detail);
    expect(ride.stoppages).toHaveLength(1);
    expect(ride.stoppages[0].label).toBe('Hebbal Flyover');
  });

  // TC-BSVC-016
  it('formats fare as "₹2,000" for 2000', () => {
    const detail = mockBookingDetail({ totalFare: 2000 });
    const ride = mapBookingDetailToRide(detail);
    expect(ride.fare).toBe('₹2,000');
  });

  // TC-BSVC-017
  it('formats fare as "—" when totalFare is 0 or null', () => {
    const detail = mockBookingDetail({ totalFare: undefined });
    const ride = mapBookingDetailToRide(detail);
    expect(ride.fare).toBe('—');
  });

  // TC-BSVC-018
  it('maps tripType for ONE_WAY', () => {
    const detail = mockBookingDetail({ tripType: 'ONE_WAY' });
    const ride = mapBookingDetailToRide(detail);
    expect(ride.tripType).toBe('ONE_WAY');
  });

  // TC-BSVC-019
  it('maps tripType for HOURLY_RENTALS', () => {
    const detail = mockBookingDetail({
      tripType: 'HOURLY_RENTALS',
      waypoints: [
        {
          id: 201, waypointId: 201, waypointType: 'PICKUP', type: 'PICKUP',
          latitude: 12.9716, longitude: 77.5946, address: 'Cubbon Park',
          waypointSequence: 0, arrivedAt: null,
        },
      ],
    });
    const ride = mapBookingDetailToRide(detail);
    expect(ride.tripType).toBe('HOURLY_RENTALS');
    // No DROP for hourly — destination defaults to zero
    expect(ride.destination).toEqual({ latitude: 0, longitude: 0 });
  });

  // TC-BSVC-020
  it('constructs rawWaypoints preserving waypointId for API calls', () => {
    const detail = mockBookingDetail();
    const ride = mapBookingDetailToRide(detail);
    const stopWp = ride.rawWaypoints.find((w) => w.waypointType === 'STOP');
    expect(stopWp?.waypointId).toBe(103); // from mockBookingDetail
  });
});
