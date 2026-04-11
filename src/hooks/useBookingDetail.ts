import { useState, useEffect } from 'react';
import { fetchBookingDetail, mapBookingDetailToRide } from '../services/bookingService';
import { ActiveRide } from '../types/ride';

// bookingVehicleId comes from the route param in driver-home, not the detail API
export type RideDetailData = Omit<ActiveRide, 'status' | 'bookingVehicleId'>;

interface UseBookingDetailState {
    ride: RideDetailData | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * Fetches booking detail for the given bookingId and maps it to ride data.
 * driver-home merges bookingVehicleId (= bookingId route param) before initRide.
 */
export function useBookingDetail(bookingId: string | undefined): UseBookingDetailState {
    const [ride, setRide] = useState<RideDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookingId) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const detail = await fetchBookingDetail(bookingId!);
                if (cancelled) return;
                setRide(mapBookingDetailToRide(detail));
            } catch (err: unknown) {
                if (cancelled) return;
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load booking details.';
                setError(message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        load();

        return () => { cancelled = true; };
    }, [bookingId]);

    return { ride, isLoading, error };
}
