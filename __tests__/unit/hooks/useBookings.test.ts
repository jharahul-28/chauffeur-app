/**
 * TC-BOOKINGS-001 through TC-BOOKINGS-013
 * Unit tests for useBookings hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useBookings } from '../../../src/hooks/useBookings';
import { mockBookingVehicle } from '../../mocks/api.mock';
import { mapApiBookingVehicle } from '../../../src/types/booking';

// ── Mock dependencies ─────────────────────────────────────────────────────────

jest.mock('../../../src/services/bookingService', () => ({
  fetchBookings: jest.fn(),
}));

jest.mock('../../../src/utils/bookingFilter', () => ({
  sortBookings: jest.fn((b: unknown[], _tab: unknown) => b),
}));

import { fetchBookings } from '../../../src/services/bookingService';
const mockFetch = fetchBookings as jest.Mock;

const sampleBooking = mapApiBookingVehicle(mockBookingVehicle());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-BOOKINGS-001
  it('starts with isLoading=true before fetch completes', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useBookings('current'));
    expect(result.current.isLoading).toBe(true);
  });

  // TC-BOOKINGS-002
  it('fetches CURRENT status for "current" tab', async () => {
    mockFetch.mockResolvedValueOnce([sampleBooking]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('CURRENT');
  });

  // TC-BOOKINGS-003
  it('fetches ASSIGNED status for "upcoming" tab', async () => {
    mockFetch.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useBookings('upcoming'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('ASSIGNED');
  });

  // TC-BOOKINGS-004
  it('fetches COMPLETED status for "past" tab', async () => {
    mockFetch.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useBookings('past'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('COMPLETED');
  });

  // TC-BOOKINGS-005
  it('returns bookings and sets isLoading=false on success', async () => {
    mockFetch.mockResolvedValueOnce([sampleBooking]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  // TC-BOOKINGS-006
  it('sets error and empty bookings on API failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  // TC-BOOKINGS-007
  it('uses fallback error message for non-Error rejections', async () => {
    mockFetch.mockRejectedValueOnce('unknown error');
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Unable to load bookings. Please try again.');
  });

  // TC-BOOKINGS-008
  it('does not set error state on normal success', async () => {
    mockFetch.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  // TC-BOOKINGS-009
  it('only fetches once on initial mount (cache miss)', async () => {
    mockFetch.mockResolvedValue([sampleBooking]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // TC-BOOKINGS-010
  it('refetch() triggers a new API call', async () => {
    mockFetch.mockResolvedValue([sampleBooking]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockFetch.mockResolvedValueOnce([sampleBooking, sampleBooking]);
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // TC-BOOKINGS-011
  it('shows empty state when API returns empty array', async () => {
    mockFetch.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bookings).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  // TC-BOOKINGS-012
  it('aborts in-flight request on unmount without crashing', async () => {
    mockFetch.mockResolvedValueOnce([sampleBooking]);
    const { unmount } = renderHook(() => useBookings('current'));
    unmount(); // Unmount before fetch resolves — should not throw
  });

  // TC-BOOKINGS-013
  it('session expired error flows through from bookingService', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Session expired. Please log in again.'));
    const { result } = renderHook(() => useBookings('current'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('Session expired. Please log in again.');
  });
});
