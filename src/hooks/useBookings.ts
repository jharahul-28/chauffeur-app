import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBookings } from '../services/bookingService';
import { Booking, ApiBookingStatus } from '../types/booking';
import { BookingTab, sortBookings } from '../utils/bookingFilter';

// ─── Tab → API status mapping ─────────────────────────────────────────────────

const TAB_TO_STATUS: Record<BookingTab, ApiBookingStatus> = {
    current: 'CURRENT',
    upcoming: 'ASSIGNED',
    past: 'COMPLETED',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseBookingsState {
    bookings: Booking[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches bookings for the given tab, with per-tab in-memory caching.
 * Cache is busted on explicit `refetch()` or when the component remounts.
 *
 * Caching strategy:
 *  - Each tab result is stored for the lifetime of the parent screen.
 *  - Switching tabs reuses the cached result instantly; no spinner shown.
 *  - Pull-to-refresh / refetch() clears only that tab's cache entry.
 */
export function useBookings(tab: BookingTab): UseBookingsState {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true); // true = show spinner immediately on mount
    const [error, setError] = useState<string | null>(null);

    // Per-instance cache: tab → Booking[]. Survives tab switches, cleared on unmount.
    const cacheRef = useRef<Partial<Record<BookingTab, Booking[]>>>({});
    const abortRef = useRef<AbortController | null>(null);

    const load = useCallback(
        async (bustCache = false) => {
            // Cancel any in-flight request before starting a new one
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            if (bustCache) {
                delete cacheRef.current[tab];
            }

            const cached = cacheRef.current[tab];
            if (cached) {
                console.log('[useBookings] Cache hit for tab:', tab, '— items:', cached.length);
                setBookings(cached);
                setError(null);
                setIsLoading(false);
                return;
            }

            console.log('[useBookings] Fetching tab:', tab, '— status:', TAB_TO_STATUS[tab]);
            setIsLoading(true);
            setError(null);

            try {
                const status = TAB_TO_STATUS[tab];
                const result = await fetchBookings(status);

                // Ignore stale responses if the request was aborted
                if (abortRef.current?.signal.aborted) return;

                const sorted = sortBookings(result, tab);
                cacheRef.current[tab] = sorted;
                setBookings(sorted);
            } catch (err: unknown) {
                if (abortRef.current?.signal.aborted) return;

                const message =
                    err instanceof Error
                        ? err.message
                        : 'Unable to load bookings. Please try again.';
                setError(message);
                setBookings([]);
            } finally {
                if (!abortRef.current?.signal.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [tab]
    );

    useEffect(() => {
        load();

        return () => {
            abortRef.current?.abort();
        };
    }, [load]);

    const refetch = useCallback(() => load(true), [load]);

    return { bookings, isLoading, error, refetch };
}
