/**
 * Jest module mocks for all service modules.
 * Use jest.mock('../../src/services/rideService', () => mockRideService)
 * or call setupServiceMocks() inside beforeEach for full isolation.
 */

import {
  mockLocationUpdateResponse,
  mockWaitingResponse,
  mockBookingDetail,
  mockCharges,
  mockAuthResponse,
} from './api.mock';

// ── rideService ───────────────────────────────────────────────────────────────

export const mockRideService = {
  postDriverOnTheWay: jest.fn().mockResolvedValue(undefined),
  postArrived: jest.fn().mockResolvedValue(undefined),
  postVerifyOtp: jest.fn().mockResolvedValue({ rideStartTime: null }),
  postWaiting: jest.fn().mockResolvedValue(mockWaitingResponse(0)),
  postContinue: jest.fn().mockResolvedValue(undefined),
  postArrivedAtStop: jest.fn().mockResolvedValue(undefined),
  postSkipStop: jest.fn().mockResolvedValue(undefined),
  postEndRide: jest.fn().mockResolvedValue(undefined),
  postCompletePayment: jest.fn().mockResolvedValue(undefined),
  updateDriverLocation: jest.fn().mockResolvedValue(mockLocationUpdateResponse()),
};

// ── bookingService ────────────────────────────────────────────────────────────

export const mockBookingService = {
  fetchBookings: jest.fn().mockResolvedValue([]),
  fetchBookingDetail: jest.fn().mockResolvedValue(mockBookingDetail()),
  mapBookingDetailToRide: jest.fn(),
};

// ── bookingApi ────────────────────────────────────────────────────────────────

export const mockBookingApi = {
  getCharges: jest.fn().mockResolvedValue(mockCharges()),
  updateCharges: jest.fn().mockResolvedValue(mockCharges()),
  getBookingDetails: jest.fn().mockResolvedValue({ balanceAmount: 2000 }),
};

// ── locationService ───────────────────────────────────────────────────────────

export const mockLocationService = {
  requestLocationPermission: jest.fn().mockResolvedValue(true),
  getCurrentLocation: jest.fn().mockResolvedValue({ latitude: 12.9716, longitude: 77.5946 }),
  watchLocation: jest.fn().mockReturnValue({ remove: jest.fn() }),
};

// ── tokenStorage ─────────────────────────────────────────────────────────────

export const mockTokenStorage = {
  getAccessToken: jest.fn().mockResolvedValue('test-auth-token-xyz'),
  setAccessToken: jest.fn().mockResolvedValue(undefined),
  removeAccessToken: jest.fn().mockResolvedValue(undefined),
  getChauffeurId: jest.fn().mockResolvedValue('99'),
  setChauffeurId: jest.fn().mockResolvedValue(undefined),
  getActiveBookingVehicleId: jest.fn().mockResolvedValue('42'),
  setActiveBookingVehicleId: jest.fn().mockResolvedValue(undefined),
  removeActiveBookingVehicleId: jest.fn().mockResolvedValue(undefined),
};

// ── apiClient ─────────────────────────────────────────────────────────────────

export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

// ── Auth service ──────────────────────────────────────────────────────────────

export const mockAuthService = {
  sendOtp: jest.fn().mockResolvedValue(undefined),
  verifyOtp: jest.fn().mockResolvedValue(mockAuthResponse()),
};

// ── Helpers: reset all mocks ──────────────────────────────────────────────────

export function resetAllServiceMocks() {
  Object.values(mockRideService).forEach((fn) => (fn as jest.Mock).mockClear());
  Object.values(mockBookingService).forEach((fn) => (fn as jest.Mock).mockClear());
  Object.values(mockBookingApi).forEach((fn) => (fn as jest.Mock).mockClear());
  Object.values(mockLocationService).forEach((fn) => (fn as jest.Mock).mockClear());
  Object.values(mockTokenStorage).forEach((fn) => (fn as jest.Mock).mockClear());
  Object.values(mockAuthService).forEach((fn) => (fn as jest.Mock).mockClear());
}
