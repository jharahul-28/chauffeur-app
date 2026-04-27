import { Booking } from '../types/booking';
import { BookingDetailResponse } from '../types/bookingDetail';

export function isHourlyBooking(booking: Booking | BookingDetailResponse): boolean {
  return booking.tripType === 'HOURLY_RENTALS';
}
