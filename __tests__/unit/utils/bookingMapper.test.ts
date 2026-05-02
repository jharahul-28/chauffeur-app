/**
 * TC-MAP-001 through TC-MAP-020
 * Unit tests for mapApiBookingVehicle mapper
 */

import { mapApiBookingVehicle } from '../../../src/types/booking';
import { mockBookingVehicle, mockHourlyBookingVehicle } from '../../mocks/api.mock';

describe('mapApiBookingVehicle', () => {
  // TC-MAP-001
  it('maps id as string', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle({ id: 42 }));
    expect(b.id).toBe('42');
    expect(typeof b.id).toBe('string');
  });

  // TC-MAP-002
  it('maps booking.id as bookingId string', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.bookingId).toBe('7');
  });

  // TC-MAP-003
  it('maps categoryName from metadata', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.categoryName).toBe('Sedan');
  });

  // TC-MAP-004
  it('maps status directly', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle({ status: 'IN_PROGRESS' }));
    expect(b.status).toBe('IN_PROGRESS');
  });

  // TC-MAP-005
  it('maps balanceAmount', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle({ balanceAmount: 1500 }));
    expect(b.balanceAmount).toBe(1500);
  });

  // TC-MAP-006
  it('maps paymentStatus from booking', () => {
    const raw = mockBookingVehicle();
    raw.booking.paymentStatus = 'PAID';
    const b = mapApiBookingVehicle(raw);
    expect(b.paymentStatus).toBe('PAID');
  });

  // TC-MAP-007
  it('formats dateTime as "Today, ..." for today bookings', () => {
    const today = new Date();
    const rideDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const raw = mockBookingVehicle({ rideDate, pickupTime: '09:30:00' });
    const b = mapApiBookingVehicle(raw);
    expect(b.dateTime).toMatch(/^Today,/);
  });

  // TC-MAP-008
  it('returns dateTime = "TBD" when rideDate or pickupTime is null', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle({ rideDate: null, pickupTime: null }));
    expect(b.dateTime).toBe('TBD');
  });

  // TC-MAP-009
  it('maps tripType from booking.tripType', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.tripType).toBe('ONE_WAY');
  });

  // TC-MAP-010
  it('maps waypoints in sorted order: PICKUP → DROP', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.waypoints[0].type).toBe('PICKUP');
    expect(b.waypoints[1].type).toBe('DROP');
  });

  // TC-MAP-011
  it('excludes waypoints with invalid coordinates', () => {
    const raw = mockBookingVehicle();
    raw.booking.waypoints = [
      { type: 'PICKUP', latitude: 0, longitude: 0, address: 'Invalid', waypointSequence: 0 },
      { type: 'DROP', latitude: 12.9716, longitude: 77.5946, address: 'MG Road', waypointSequence: 1 },
    ];
    const b = mapApiBookingVehicle(raw);
    // PICKUP has zero coords — filtered
    expect(b.waypoints.find((w) => w.type === 'PICKUP')).toBeUndefined();
  });

  // TC-MAP-012
  it('maps specialRemarks from metadata', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.specialRemarks).toBe('Please be on time');
  });

  // TC-MAP-013
  it('maps beverages as comma-separated string', () => {
    const raw = mockBookingVehicle();
    raw.metadata.specialRequest = { beverages: ['Water', 'Juice'] };
    const b = mapApiBookingVehicle(raw);
    expect(b.beverages).toBe('Water, Juice');
  });

  // TC-MAP-014
  it('returns beverages as undefined when list is empty', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.beverages).toBeUndefined();
  });

  // TC-MAP-015
  it('maps passengers from specialRequest', () => {
    const raw = mockBookingVehicle();
    raw.metadata.specialRequest = { passengers: { adults: 2, children: 1 } };
    const b = mapApiBookingVehicle(raw);
    expect(b.passengers).toEqual({ adults: 2, children: 1 });
  });

  // TC-MAP-016
  it('maps hourlyPackage for hourly bookings', () => {
    const b = mapApiBookingVehicle(mockHourlyBookingVehicle());
    expect(b.hourlyPackage).toBeDefined();
    expect(b.hourlyHours).toBe(4);
  });

  // TC-MAP-017
  it('hourlyPackage is undefined for ONE_WAY trips', () => {
    const b = mapApiBookingVehicle(mockBookingVehicle());
    expect(b.hourlyPackage).toBeUndefined();
    expect(b.hourlyHours).toBeUndefined();
  });

  // TC-MAP-018
  it('maps bookingReference from metadata (preferred) over booking', () => {
    const raw = mockBookingVehicle();
    raw.metadata.bookingReference = 'META-REF';
    raw.booking.bookingReference = 'BOOKING-REF';
    const b = mapApiBookingVehicle(raw);
    expect(b.bookingReference).toBe('META-REF');
  });

  // TC-MAP-019
  it('falls back to booking.bookingReference when metadata has none', () => {
    const raw = mockBookingVehicle();
    raw.metadata.bookingReference = undefined;
    raw.booking.bookingReference = 'BOOKING-REF';
    const b = mapApiBookingVehicle(raw);
    expect(b.bookingReference).toBe('BOOKING-REF');
  });

  // TC-MAP-020
  it('defaults baseFare and totalFare to 0 when absent', () => {
    const raw = mockBookingVehicle({ baseFare: undefined, actualFare: undefined });
    raw.booking.totalFare = undefined;
    const b = mapApiBookingVehicle(raw);
    expect(b.baseFare).toBe(0);
    expect(b.totalFare).toBe(0);
  });
});
