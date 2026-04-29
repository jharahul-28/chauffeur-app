// ─── API Status values sent as ?status= query param ──────────────────────────
export type ApiBookingStatus = 'CURRENT' | 'ASSIGNED' | 'COMPLETED';

// ─── Status values returned inside the response body ─────────────────────────
export type BookingStatus =
  | 'ASSIGNED'
  | 'DRIVER_ON_THE_WAY'
  | 'ARRIVED'
  | 'OTP_VERIFIED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'COMPLETED'
  | 'RIDE_END';

// ─── Hourly package ───────────────────────────────────────────────────────────

export interface HourlyTravelStats {
  totalTraveledKm: number;
  totalTravelTimeMinutes: number;
}

export interface HourlyPackageDetails {
  hours: number;
  km: number;
  hourlyTravelStats: HourlyTravelStats;
}

export interface HourlyPackage {
  hourlyPackageDetails: HourlyPackageDetails;
}

// ─── Waypoint inside booking.waypoints ───────────────────────────────────────
// NOTE: real API uses `type` (not `waypointType`), and no id/sequence/arrivedAt
export interface ApiWaypoint {
  type: 'PICKUP' | 'STOP' | 'DROP';
  latitude: number;
  longitude: number;
  address: string;
  status?: string;
  // Optional — present on detail endpoint but not on list endpoint
  id?: number;
  waypointSequence?: number;
  arrivedAt?: string | null;
}

// ─── Special request shape (rich — includes passengers, luggage, etc.) ────────
export interface ApiSpecialRequest {
  beverages?: string[];
  other?: string;
  vehicleCategory?: string;
  numberOfVehicles?: number;
  passengers?: {
    adults?: number;
    children?: number;
  };
  luggage?: {
    small?: number;
    medium?: number;
    large?: number;
  };
}

// ─── Top-level metadata ───────────────────────────────────────────────────────
export interface ApiBookingMetadata {
  categoryName?: string;
  chauffeurName?: string;
  chauffeurContact?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  customerName?: string;
  customerPhone?: string;
  customerContact?: string;
  pickupAddress?: string;
  bookingReference?: string;
  specialRequest?: ApiSpecialRequest;
  specialRemarks?: string;
  // Waiting config
  totalWaitingSeconds?: number;
  waitingFreeMinutes?: number;
  waitingChargeableIntervalMinutes?: number;
  waitingChargePerInterval?: number;
}

// ─── Nested booking object ────────────────────────────────────────────────────
export interface ApiNestedBooking {
  id: number;
  bookingReference?: string;
  bookingConfirmationDate?: string;
  status?: string;
  customerId?: number | null;
  metadata?: {
    customerName?: string;
    customerContact?: string;
    customerType?: string;
  };
  rideDate?: string | null;
  pickupTime?: string | null;
  bookingSource?: string;
  tripType?: string;
  kmRide?: number | null;
  estimatedFare?: number | null;
  actualFare?: number | null;
  totalAdditionalChargesOfVehicles?: number | null;
  totalFare?: number | null;
  advanceAmount?: number | null;
  balanceAmount?: number | null;
  paymentMode?: string | null;
  paymentStatus: string | null;
  specialRequest?: ApiSpecialRequest;
  waypoints: ApiWaypoint[];
  vehicles?: unknown[];
  hourlyPackage?: HourlyPackage;
}

// ─── Raw shape returned by GET /chauffeur/:id/bookings ────────────────────────
export interface ApiBookingVehicle {
  /** bookingVehicleId — path param for all /chauffeur/{id}/... endpoints */
  id: number;
  bookingId?: number;
  vehicleCategoryId?: number;
  vehicleId?: number;
  chauffeurId?: number;
  vehicleNumber?: string;
  /** ISO date string "YYYY-MM-DD", null when not yet scheduled */
  rideDate: string | null;
  /** Time string "HH:mm:ss", null when not yet scheduled */
  pickupTime: string | null;
  status: BookingStatus;
  baseFare?: number;
  actualFare?: number;
  advanceAmount?: number;
  /** Amount the customer owes at trip end */
  balanceAmount: number;
  additionalCharges?: unknown[];
  totalAdditionalAmount?: number;
  waitingTimeCharge?: number;
  metadata: ApiBookingMetadata;
  /** Full nested booking — source for waypoints and paymentStatus */
  booking: ApiNestedBooking;
}

// ─── API response envelope ────────────────────────────────────────────────────
export interface ApiBookingsResponse {
  data?: ApiBookingVehicle[];
}

// ─── Route stop for display ───────────────────────────────────────────────────
export interface BookingWaypoint {
  type: 'PICKUP' | 'STOP' | 'DROP';
  address: string;
  latitude: number;
  longitude: number;
}

// ─── UI model used by all components ─────────────────────────────────────────
export interface Booking {
  /** bookingVehicleId — forwarded to all chauffeur action endpoints. */
  id: string;
  /** Nested booking id — used for booking detail fetch. */
  bookingId: string;
  categoryName: string;
  vehicleInfo: string;
  vehicleNumber: string;
  /** ISO date string "YYYY-MM-DD", empty string when unscheduled */
  date: string;
  /** Human-readable, e.g. "Today, 9:30 AM" or "TBD" when unscheduled */
  dateTime: string;
  status: BookingStatus;
  /** From booking.paymentStatus */
  paymentStatus: string | null;
  /** Amount to collect at trip end */
  balanceAmount: number;
  /** Fare amounts */
  baseFare: number;
  totalFare: number;
  // ── From metadata ──
  customerName?: string;
  pickupAddress?: string;
  bookingReference?: string;
  specialRemarks?: string;
  // ── Special request (flat) ──
  beverages?: string;
  specialRequest?: string;
  // ── Rich special request fields ──
  passengers?: { adults: number; children: number };
  luggage?: { small: number; medium: number; large: number };
  // ── Trip info ──
  tripType?: string;
  kmRide?: number | null;
  /** Ordered route waypoints for display (pickup → stops → drop) */
  waypoints: BookingWaypoint[];
  /** Full ISO datetime "YYYY-MM-DDTHH:mm:ss" used for sort-key precision. */
  rideDateTime?: string;
  /** Present only when tripType === 'HOURLY_RENTALS' */
  hourlyPackage?: HourlyPackage;
  /** Convenience shortcut: hours booked from the hourly package. */
  hourlyHours?: number;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function formatDateTime(rideDate: string, pickupTime: string): string {
  const date = new Date(`${rideDate}T${pickupTime}`);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function sortWaypoints(wps: ApiWaypoint[]): ApiWaypoint[] {
  const ORDER: Record<string, number> = { PICKUP: 0, STOP: 1, DROP: 2 };
  return [...wps].sort((a, b) => {
    const seqA = a.waypointSequence ?? ORDER[a.type] ?? 99;
    const seqB = b.waypointSequence ?? ORDER[b.type] ?? 99;
    return seqA - seqB;
  });
}

export function mapApiBookingVehicle(raw: ApiBookingVehicle): Booking {
  const hasSchedule = !!raw.rideDate && !!raw.pickupTime;
  const meta = raw.metadata ?? {};
  const booking = raw.booking ?? { id: 0, waypoints: [], paymentStatus: null };

  // Special request — prefer metadata over booking-level (metadata is richer)
  const sr = meta.specialRequest ?? booking.specialRequest;
  const beverageList = sr?.beverages ?? [];

  // Waypoints sorted for display
  const rawWaypoints: ApiWaypoint[] = booking.waypoints ?? [];
  const sortedWaypoints = sortWaypoints(rawWaypoints);
  const waypoints: BookingWaypoint[] = sortedWaypoints
    .filter((w) => typeof w.latitude === 'number' && typeof w.longitude === 'number')
    .map((w) => ({
      type: w.type,
      address: w.address,
      latitude: w.latitude,
      longitude: w.longitude,
    }));

  const passengers = sr?.passengers
    ? { adults: sr.passengers.adults ?? 0, children: sr.passengers.children ?? 0 }
    : undefined;

  const luggage = sr?.luggage
    ? { small: sr.luggage.small ?? 0, medium: sr.luggage.medium ?? 0, large: sr.luggage.large ?? 0 }
    : undefined;

  const hourlyPackage = (booking as ApiNestedBooking & { hourlyPackage?: HourlyPackage }).hourlyPackage;

  return {
    id: String(raw.id),
    bookingId: String(booking.id),
    categoryName: meta.categoryName ?? '',
    vehicleInfo: meta.vehicleBrand && meta.vehicleModel
      ? `${meta.vehicleBrand} ${meta.vehicleModel}`
      : '',
    vehicleNumber: raw.vehicleNumber ?? '',
    date: raw.rideDate ?? '',
    dateTime: hasSchedule ? formatDateTime(raw.rideDate!, raw.pickupTime!) : 'TBD',
    status: raw.status,
    paymentStatus: booking.paymentStatus ?? null,
    balanceAmount: raw.balanceAmount ?? 0,
    baseFare: raw.baseFare ?? 0,
    totalFare: booking.totalFare ?? raw.actualFare ?? 0,
    customerName: meta.customerName || undefined,
    pickupAddress: meta.pickupAddress || undefined,
    bookingReference: meta.bookingReference || booking.bookingReference || undefined,
    specialRemarks: meta.specialRemarks || undefined,
    beverages: beverageList.length > 0 ? beverageList.join(', ') : undefined,
    specialRequest: sr?.other || undefined,
    passengers,
    luggage,
    tripType: booking.tripType || undefined,
    kmRide: booking.kmRide ?? null,
    waypoints,
    rideDateTime: hasSchedule ? `${raw.rideDate}T${raw.pickupTime}` : undefined,
    hourlyPackage: hourlyPackage ?? undefined,
    hourlyHours: hourlyPackage?.hourlyPackageDetails?.hours ?? undefined,
  };
}

/** @deprecated Use mapApiBookingVehicle */
export const mapApiBooking = mapApiBookingVehicle as unknown as (raw: ApiBookingVehicle) => Booking;
