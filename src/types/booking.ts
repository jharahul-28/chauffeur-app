export type BookingStatus = 'UPCOMING' | 'COMPLETED';

export interface Booking {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropLocation: string;
  dateTime: string;
  cost: number;
  expectedTime: string;
  expectedDistance: number;
  status: BookingStatus;
}
