import { useState, useEffect } from 'react';
import { fetchBookingDetail } from '../services/bookingService';
import { BookingDetailResponse } from '../types/bookingDetail';

interface State {
  data: BookingDetailResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useRawBookingDetail(bookingId: string | undefined): State {
  const [data, setData] = useState<BookingDetailResponse | null>(null);
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
        if (!cancelled) setData(detail);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load booking details.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bookingId]);

  return { data, isLoading, error };
}
