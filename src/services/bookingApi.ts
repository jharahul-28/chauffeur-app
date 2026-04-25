import apiClient from './apiClient';
import { Charge } from '../types/charge';
import { BookingBilling } from '../types/bookingBilling';

export const getCharges = (bookingVehicleId: string): Promise<Charge[]> =>
  apiClient
    .get<Charge[]>(`/booking/vehicles/${bookingVehicleId}/charges`)
    .then((res) => res.data);

export const updateCharges = (
  bookingVehicleId: string,
  charges: Charge[],
): Promise<Charge[]> =>
  apiClient
    .put<Charge[]>(`/booking/vehicles/${bookingVehicleId}/charges`, charges)
    .then((res) => res.data);

export const getBookingDetails = (bookingVehicleId: string): Promise<BookingBilling> =>
  apiClient
    .get<BookingBilling>(`/booking/vehicle/${bookingVehicleId}`)
    .then((res) => res.data);
