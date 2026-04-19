import apiClient from './apiClient';
import { getChauffeurId } from '../storage/tokenStorage';
import {
    ApiBookingStatus,
    ApiBookingsResponse,
    Booking,
    mapApiBooking,
} from '../types/booking';
import { BookingDetailResponse, Waypoint } from '../types/bookingDetail';
import { ActiveRide, Stoppage } from '../types/ride';
import { Coordinate } from '../components/MapViewContainer';

/**
 * Fetches bookings for the authenticated chauffeur.
 *
 * @param status - API status filter: CURRENT | ASSIGNED | COMPLETED
 * @returns Mapped UI-ready Booking array
 * @throws Error with a user-facing message on failure
 */
export async function fetchBookings(status: ApiBookingStatus): Promise<Booking[]> {
    const chauffeurId = await getChauffeurId();

    console.log('[bookingService] fetchBookings', { status, chauffeurId });

    if (!chauffeurId) {
        console.warn('[bookingService] No chauffeurId in storage — user may not be logged in');
        throw new Error('Session expired. Please log in again.');
    }

    const response = await apiClient.get<ApiBookingsResponse>(
        `/chauffeur/${chauffeurId}/bookings`,
        { params: { status } }
    );

    // Handle both array response and { data: [] } wrapped response
    const raw = Array.isArray(response.data)
        ? (response.data as unknown as ApiBookingsResponse['data'])
        : (response.data as ApiBookingsResponse).data ?? [];

    console.log('[bookingService] Fetched', raw.length, 'bookings for status:', status);

    return raw.map(mapApiBooking);
}

// ─── Booking Detail ───────────────────────────────────────────────────────────

/**
 * Fetches the full detail for a single booking.
 * GET /bookings/:bookingId
 */
export async function fetchBookingDetail(bookingId: string): Promise<BookingDetailResponse> {
    console.log('[bookingService] fetchBookingDetail', { bookingId });
    const response = await apiClient.get<BookingDetailResponse>(`/bookings/${bookingId}`);
    return response.data;
}

// ─── Mapper: BookingDetail → ActiveRide ──────────────────────────────────────

function pickupWaypoint(waypoints: Waypoint[]): Waypoint {
    const wp = waypoints.find((w) => w.waypointType === 'PICKUP');
    if (!wp) throw new Error('Booking has no PICKUP waypoint');
    return wp;
}

function dropWaypoint(waypoints: Waypoint[]): Waypoint {
    const wp = waypoints.find((w) => w.waypointType === 'DROP');
    if (!wp) throw new Error('Booking has no DROP waypoint');
    return wp;
}

function toCoord(wp: Waypoint): Coordinate {
    return { latitude: wp.latitude, longitude: wp.longitude };
}

function formatFare(amount: number | null): string {
    if (!amount) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Converts a BookingDetailResponse into ride data ready for the store.
 * bookingVehicleId is NOT included here — it comes from the route param
 * (the booking list `id`) and is injected by driver-home before calling initRide.
 */
export function mapBookingDetailToRide(
    detail: BookingDetailResponse
): Omit<ActiveRide, 'status' | 'bookingVehicleId'> {
    const sorted = [...detail.waypoints].sort(
        (a, b) => a.waypointSequence - b.waypointSequence
    );

    const pickup = pickupWaypoint(sorted);
    const drop = dropWaypoint(sorted);

    const stoppages: Stoppage[] = sorted
        .filter((w) => w.waypointType === 'STOP')
        .map((w) => ({
            id: String(w.id),
            label: w.address,
            latitude: w.latitude,
            longitude: w.longitude,
        }));

    return {
        id: String(detail.id),
        bookingReference: detail.bookingReference,
        riderName: detail.metadata.customerName,
        customerContact: detail.metadata.customerContact,
        pickupText: pickup.address,
        destinationText: drop.address,
        pickup: toCoord(pickup),
        destination: toCoord(drop),
        stoppages,
        fare: formatFare(detail.totalFare),
        totalFare: detail.totalFare ?? 0,
        specialRemarks: detail.metadata.specialRemarks || undefined,
    };
}
