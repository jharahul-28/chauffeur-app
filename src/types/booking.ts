// ─── API Status values sent as ?status= query param ──────────────────────────
export type ApiBookingStatus = 'CURRENT' | 'ASSIGNED' | 'COMPLETED';

// ─── Status values returned inside the response body ─────────────────────────
export type BookingStatus = 'IN_PROGRESS' | 'ASSIGNED' | 'COMPLETED';

// ─── Raw shape returned by GET /chauffeur/:id/bookings ────────────────────────
export interface ApiBooking {
  id: number;
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
  };
}

// ─── UI model used by all components ─────────────────────────────────────────
export interface Booking {
  id: string;
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

  return {
    id: String(raw.id),
    categoryName: raw.metadata.categoryName,
    vehicleInfo: `${raw.metadata.vehicleBrand} ${raw.metadata.vehicleModel}`,
    vehicleNumber: raw.vehicleNumber,
    date: raw.rideDate ?? '',
    dateTime: hasSchedule ? formatDateTime(raw.rideDate!, raw.pickupTime!) : 'TBD',
    status: raw.status,
  };
}
