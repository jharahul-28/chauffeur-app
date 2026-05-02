/**
 * Centralised API mock factory.
 * Import these in tests to get typed, realistic API responses.
 */

import type { ApiBookingVehicle } from '../../src/types/booking';
import type { BookingDetailResponse } from '../../src/types/bookingDetail';
import type { Charge } from '../../src/types/charge';
import type { LocationUpdateResponse, WaitingResponse } from '../../src/services/rideService';

// ── Booking Vehicle (list API) ────────────────────────────────────────────────

export const mockBookingVehicle = (overrides?: Partial<ApiBookingVehicle>): ApiBookingVehicle => ({
  id: 42,
  bookingId: 7,
  vehicleNumber: 'KA-01-AB-1234',
  rideDate: '2026-05-02',
  pickupTime: '09:30:00',
  status: 'ASSIGNED',
  baseFare: 2000,
  actualFare: 2000,
  balanceAmount: 2000,
  metadata: {
    categoryName: 'Sedan',
    customerName: 'John Doe',
    customerContact: '9876543210',
    pickupAddress: 'Bangalore Airport, Terminal 1',
    bookingReference: 'VLV-20260502-ABCD1',
    specialRemarks: 'Please be on time',
  },
  booking: {
    id: 7,
    bookingReference: 'VLV-20260502-ABCD1',
    status: 'ASSIGNED',
    tripType: 'ONE_WAY',
    totalFare: 2000,
    balanceAmount: 2000,
    paymentStatus: null,
    rideDate: '2026-05-02',
    pickupTime: '09:30:00',
    waypoints: [
      {
        type: 'PICKUP',
        latitude: 13.1986,
        longitude: 77.7066,
        address: 'Bangalore Airport, Terminal 1',
        waypointSequence: 0,
        id: 101,
      },
      {
        type: 'DROP',
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'MG Road, Bangalore',
        waypointSequence: 1,
        id: 102,
      },
    ],
  },
  ...overrides,
});

export const mockHourlyBookingVehicle = (overrides?: Partial<ApiBookingVehicle>): ApiBookingVehicle =>
  mockBookingVehicle({
    status: 'OTP_VERIFIED',
    booking: {
      id: 8,
      bookingReference: 'VLV-20260502-HRLY1',
      status: 'OTP_VERIFIED',
      tripType: 'HOURLY_RENTALS',
      totalFare: 3000,
      balanceAmount: 3000,
      paymentStatus: null,
      rideDate: '2026-05-02',
      pickupTime: '10:00:00',
      waypoints: [
        {
          type: 'PICKUP',
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Cubbon Park, Bangalore',
          waypointSequence: 0,
          id: 201,
        },
      ],
      hourlyPackage: {
        hourlyPackageDetails: {
          hours: 4,
          km: 40,
          hourlyTravelStats: { totalTraveledKm: 0, totalTravelTimeMinutes: 0 },
        },
      },
    },
    ...overrides,
  });

// ── Booking Detail (detail API) ───────────────────────────────────────────────

export const mockBookingDetail = (overrides?: Partial<BookingDetailResponse>): BookingDetailResponse => ({
  id: 7,
  bookingReference: 'VLV-20260502-ABCD1',
  bookingConfirmationDate: '2026-05-01T10:00:00',
  status: 'ASSIGNED',
  customerId: 1,
  bookingSource: 'APP',
  tripType: 'ONE_WAY',
  kmRide: null,
  estimatedFare: 2000,
  actualFare: 2000,
  additionalCharges: null,
  totalAdditionalAmount: null,
  totalFare: 2000,
  advanceAmount: 0,
  balanceAmount: 2000,
  paymentMode: null,
  paymentStatus: 'PENDING',
  rideDate: '2026-05-02',
  pickupTime: '09:30:00',
  metadata: {
    customerName: 'John Doe',
    customerContact: '9876543210',
    customerType: 'INDIVIDUAL',
    specialRemarks: 'Please be on time',
  },
  waypoints: [
    {
      id: 101,
      waypointId: 101,
      waypointType: 'PICKUP',
      type: 'PICKUP',
      latitude: 13.1986,
      longitude: 77.7066,
      address: 'Bangalore Airport, Terminal 1',
      waypointSequence: 0,
      arrivedAt: null,
    },
    {
      id: 103,
      waypointId: 103,
      waypointType: 'STOP',
      type: 'STOP',
      latitude: 13.0,
      longitude: 77.6,
      address: 'Hebbal Flyover',
      waypointSequence: 1,
      arrivedAt: null,
    },
    {
      id: 102,
      waypointId: 102,
      waypointType: 'DROP',
      type: 'DROP',
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bangalore',
      waypointSequence: 2,
      arrivedAt: null,
    },
  ],
  ...overrides,
});

// ── Charges ───────────────────────────────────────────────────────────────────

export const mockCharges = (): Charge[] => [
  { type: 'TOLL_CHARGE', amount: 150 },
  { type: 'PARKING_CHARGE', amount: 80 },
];

export const mockEmptyCharges = (): Charge[] => [];

// ── Location Update Response ──────────────────────────────────────────────────

export const mockLocationUpdateResponse = (overrides?: Partial<LocationUpdateResponse>): LocationUpdateResponse => ({
  arrived: false,
  waypoint: {
    type: 'PICKUP',
    latitude: 13.1986,
    longitude: 77.7066,
    address: 'Bangalore Airport',
  },
  distanceMeters: 5200,
  rideStartTime: null,
  ...overrides,
});

export const mockLocationUpdateArrived = (): LocationUpdateResponse =>
  mockLocationUpdateResponse({ arrived: true, distanceMeters: 0 });

export const mockLocationUpdateWithHourlyStart = (): LocationUpdateResponse =>
  mockLocationUpdateResponse({
    arrived: false,
    rideStartTime: '2026-05-02 09:30:00',
    waypoint: null,
  });

// ── Waiting Response ──────────────────────────────────────────────────────────

export const mockWaitingResponse = (totalWaitingSeconds = 0): WaitingResponse => ({
  totalWaitingSeconds,
  formattedWaitingTime: '00:00:00',
});

export const mockWaitingResponseExceeded = (): WaitingResponse =>
  mockWaitingResponse(200); // > 180 threshold

// ── Auth ──────────────────────────────────────────────────────────────────────

export const mockAuthResponse = () => ({
  authToken: 'test-auth-token-xyz',
  user: {
    id: 99,
    phone: '9876543210',
    name: 'Test Chauffeur',
    email: 'chauffeur@velvet.com',
    gender: 'M',
    dob: '1990-01-01',
    status: 'ACTIVE',
  },
});
