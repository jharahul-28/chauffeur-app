import apiClient from './apiClient';
import { getChauffeurId } from '../storage/tokenStorage';
import {
    ApiBookingStatus,
    ApiBookingsResponse,
    ApiBookingVehicle,
    Booking,
    mapApiBookingVehicle,
} from '../types/booking';
import { BookingDetailResponse, Waypoint } from '../types/bookingDetail';
import { ActiveRide, Stoppage } from '../types/ride';
import { Coordinate } from '../components/MapViewContainer';
import { RawWaypoint } from '../utils/waypointUtils';

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
    const raw: ApiBookingVehicle[] = Array.isArray(response.data)
        ? (response.data as unknown as ApiBookingVehicle[])
        : (response.data as ApiBookingsResponse).data ?? [];

    console.log('[bookingService] Fetched', raw.length, 'bookings for status:', status);

    return raw.map(mapApiBookingVehicle);
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

/** Resolves whichever field the API chose to use for the waypoint type. */
function wpType(wp: Waypoint): string {
    return (wp.waypointType ?? wp.type ?? '').toUpperCase();
}

function pickupWaypoint(waypoints: Waypoint[]): Waypoint {
    const wp = waypoints.find((w) => wpType(w) === 'PICKUP');
    if (!wp) throw new Error('Booking has no PICKUP waypoint');
    return wp;
}

function dropWaypoint(waypoints: Waypoint[]): Waypoint | null {
    return waypoints.find((w) => wpType(w) === 'DROP') ?? null;
}

function toCoord(wp: Waypoint): Coordinate {
    const lat = typeof wp.latitude === 'number' && isFinite(wp.latitude) ? wp.latitude : 0;
    const lng = typeof wp.longitude === 'number' && isFinite(wp.longitude) ? wp.longitude : 0;
    if (lat === 0 && lng === 0) {
        console.warn('[bookingService] Waypoint has invalid/zero coordinates', { type: wpType(wp) });
    }
    return { latitude: lat, longitude: lng };
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
    const TYPE_ORDER: Record<string, number> = { PICKUP: 0, STOP: 1, DROP: 2 };
    const sorted = [...detail.waypoints].sort((a, b) => {
        const seqA = a.waypointSequence ?? TYPE_ORDER[wpType(a)] ?? 99;
        const seqB = b.waypointSequence ?? TYPE_ORDER[wpType(b)] ?? 99;
        return seqA - seqB;
    });

    const pickup = pickupWaypoint(sorted);
    const drop = dropWaypoint(sorted); // null for HOURLY_RENTALS

    const stoppages: Stoppage[] = sorted
        .filter((w) => wpType(w) === 'STOP')
        .map((w, i) => ({
            id: String(w.id ?? `stop-${i}`),
            label: w.address,
            latitude: w.latitude,
            longitude: w.longitude,
        }));

    const rawWaypoints: RawWaypoint[] = sorted.map((w, i) => ({
        id: w.waypointId ?? w.id ?? i,
        waypointId: w.waypointId ?? w.id ?? i,
        waypointSequence: w.waypointSequence ?? i,
        waypointType: wpType(w) as RawWaypoint['waypointType'],
        latitude: w.latitude,
        longitude: w.longitude,
        address: w.address,
        placeId: w.placeId || undefined,
        arrivedAt: w.arrivedAt ?? null,
        status: w.status || undefined,
    }));

    return {
        id: String(detail.id),
        bookingReference: detail.bookingReference,
        riderName: detail.metadata?.customerName ?? 'Unknown Rider',
        customerContact: detail.metadata?.customerContact || undefined,
        pickupText: pickup.address,
        destinationText: drop?.address ?? '',
        pickup: toCoord(pickup),
        destination: drop ? toCoord(drop) : { latitude: 0, longitude: 0 },
        stoppages,
        fare: formatFare(detail.totalFare),
        totalFare: detail.totalFare ?? 0,
        balanceAmount: detail.balanceAmount ?? 0,
        rawWaypoints,
        specialRemarks: detail.metadata?.specialRemarks || undefined,
        specialRequest: detail.specialRequest || undefined,
        tripType: detail.tripType || undefined,
        rideDate: detail.rideDate ?? null,
        pickupTime: detail.pickupTime ?? null,
        hourlyPackage: detail.hourlyPackage ?? undefined,
    };
}
