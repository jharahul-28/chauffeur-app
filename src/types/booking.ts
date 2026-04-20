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
  | 'COMPLETED';

// ─── Raw shape returned by GET /chauffeur/:id/bookings ────────────────────────
export interface ApiBooking {
  /** Booking-vehicle assignment ID — used for chauffeur action endpoints (/chauffeur/:id/...). */
  id: number;
  /** Actual booking ID — used for the booking detail endpoint (GET /bookings/:bookingId). */
  bookingId: number;
  vehicleCategoryId: number;
  vehicleId: number;
  chauffeurId: number;
  vehicleNumber: string;
  /** ISO date string "YYYY-MM-DD", null when not yet scheduled */
  rideDate: string | null;
  /** Time string "HH:mm:ss", null when not yet scheduled */
  pickupTime: string | null;
  status: BookingStatus;
  metadata: {
    categoryName: string;
    chauffeurName: string;
    chauffeurContact: string;
    vehicleBrand: string;
    vehicleModel: string;
    /** Customer full name. */
    customerName?: string;
    /** Pickup address text. */
    pickupAddress?: string;
    /** Booking reference code, e.g. "VLV-20260411-6D9B4". */
    bookingReference?: string;
    /** Structured special request from the customer. */
    specialRequest?: {
      other?: string;
      beverages?: string[];
    };
    /** Optional driver notes / special instructions from the customer. */
    specialRemarks?: string;
  };
}

// ─── API response envelope (array or wrapped) ─────────────────────────────────
export interface ApiBookingsResponse {
  data?: ApiBooking[];
}

// ─── UI model used by all components ─────────────────────────────────────────
export interface Booking {
  /** Booking-vehicle assignment ID — forwarded to chauffeur action endpoints. */
  id: string;
  /** Booking ID — used to fetch booking details (GET /bookings/:bookingId). */
  bookingId: string;
  /** e.g. "Velvet Premier" */
  categoryName: string;
  /** e.g. "Toyota Innova Crysta" */
  vehicleInfo: string;
  vehicleNumber: string;
  /** ISO date string "YYYY-MM-DD", empty string when unscheduled */
  date: string;
  /** Human-readable, e.g. "Today, 9:30 AM" or "TBD" when unscheduled */
  dateTime: string;
  status: BookingStatus;
  /** Customer full name, e.g. "Deepak Kumar". */
  customerName?: string;
  /** Pickup address text, e.g. "New Delhi". */
  pickupAddress?: string;
  /** Free-text special request from the customer (specialRequest.other). */
  specialRequest?: string;
  /** Comma-separated beverages list when beverages are requested. */
  beverages?: string;
  /** Free-text special instructions from the customer, if any. */
  specialRemarks?: string;
  /** Booking reference code, e.g. "VLV-20260411-6D9B4". */
  bookingReference?: string;
  /** Full ISO datetime "YYYY-MM-DDTHH:mm:ss" used for sort-key precision. Undefined for unscheduled bookings. */
  rideDateTime?: string;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function formatDateTime(rideDate: string, pickupTime: string): string {
  // rideDate: "2026-04-05", pickupTime: "09:30:00"
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

export function mapApiBooking(raw: ApiBooking): Booking {
  const hasSchedule = !!raw.rideDate && !!raw.pickupTime;
  const beverageList = raw.metadata.specialRequest?.beverages;

  return {
    id: String(raw.id),
    bookingId: String(raw.bookingId),
    categoryName: raw.metadata.categoryName,
    vehicleInfo: `${raw.metadata.vehicleBrand} ${raw.metadata.vehicleModel}`,
    vehicleNumber: raw.vehicleNumber,
    date: raw.rideDate ?? '',
    dateTime: hasSchedule ? formatDateTime(raw.rideDate!, raw.pickupTime!) : 'TBD',
    status: raw.status,
    customerName: raw.metadata.customerName || undefined,
    pickupAddress: raw.metadata.pickupAddress || undefined,
    specialRequest: raw.metadata.specialRequest?.other || undefined,
    beverages:
      beverageList && beverageList.length > 0
        ? beverageList.join(', ')
        : undefined,
    specialRemarks: raw.metadata.specialRemarks || undefined,
    bookingReference: raw.metadata.bookingReference || undefined,
    rideDateTime: hasSchedule ? `${raw.rideDate}T${raw.pickupTime}` : undefined,
  };
}
