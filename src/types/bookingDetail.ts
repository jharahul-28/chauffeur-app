// ─── Booking Detail API Response ─────────────────────────────────────────────
// GET /bookings/:bookingId

export type WaypointType = 'PICKUP' | 'STOP' | 'DROP';

export interface Waypoint {
  id?: number;
  waypointSequence?: number;
  /** Some API versions return `type` instead of `waypointType` */
  waypointType?: WaypointType;
  type?: WaypointType;
  latitude: number;
  longitude: number;
  address: string;
  arrivedAt?: string | null;
  status?: string;
}

export interface BookingDetailResponse {
  id: number;
  bookingReference: string;
  bookingConfirmationDate: string;
  status: string;
  customerId: number | null;
  metadata: {
    customerName: string;
    customerContact: string;
    customerType: string;
    /** Optional driver notes / special instructions from the customer. */
    specialRemarks?: string;
  };
  /** Structured special request — top-level field in the API response. */
  specialRequest?: {
    other?: string;
    beverages?: string[];
  };
  rideDate: string | null;
  pickupTime: string | null;
  bookingSource: string;
  tripType: string;
  kmRide: number | null;
  estimatedFare: number | null;
  actualFare: number | null;
  additionalCharges: {
    mcFare: number | null;
    waitingCharge: number | null;
    parkingCharge: number | null;
  } | null;
  totalAdditionalAmount: number | null;
  totalFare: number | null;
  advanceAmount: number | null;
  balanceAmount: number | null;
  paymentMode: string | null;
  paymentStatus: string;
  waypoints: Waypoint[];
}
