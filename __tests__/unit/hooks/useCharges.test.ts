/**
 * TC-CHARGES-001 through TC-CHARGES-018
 * Unit tests for useCharges hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useCharges } from '../../../src/hooks/useCharges';
import type { Charge } from '../../../src/types/charge';

// ── Mock dependencies ─────────────────────────────────────────────────────────

const mockShowAlert = jest.fn();

jest.mock('../../../src/context/AlertContext', () => ({
  useAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../../src/services/bookingApi', () => ({
  getCharges: jest.fn(),
  updateCharges: jest.fn(),
}));

import { getCharges, updateCharges } from '../../../src/services/bookingApi';
const mockGetCharges = getCharges as jest.Mock;
const mockUpdateCharges = updateCharges as jest.Mock;

const sampleCharges: Charge[] = [
  { type: 'TOLL_CHARGE', amount: 150 },
  { type: 'PARKING_CHARGE', amount: 80 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCharges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCharges.mockResolvedValue(sampleCharges);
    mockUpdateCharges.mockResolvedValue(sampleCharges);
  });

  // TC-CHARGES-001
  it('initialises with empty charges, isLoading=false, no error', () => {
    const { result } = renderHook(() => useCharges('42'));
    expect(result.current.charges).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // TC-CHARGES-002
  it('fetchCharges loads charges from API', async () => {
    const { result } = renderHook(() => useCharges('42'));
    await act(async () => { await result.current.fetchCharges(); });
    expect(result.current.charges).toEqual(sampleCharges);
    expect(result.current.isLoading).toBe(false);
  });

  // TC-CHARGES-003
  it('fetchCharges is a no-op when bookingVehicleId is undefined', async () => {
    const { result } = renderHook(() => useCharges(undefined));
    await act(async () => { await result.current.fetchCharges(); });
    expect(mockGetCharges).not.toHaveBeenCalled();
  });

  // TC-CHARGES-004
  it('fetchCharges sets error state on API failure', async () => {
    mockGetCharges.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useCharges('42'));
    await act(async () => { await result.current.fetchCharges(); });
    expect(result.current.error).toBe('Failed to load charges');
    expect(result.current.charges).toEqual([]);
  });

  // TC-CHARGES-005
  it('saveCharges calls updateCharges then getCharges', async () => {
    const { result } = renderHook(() => useCharges('42'));
    await act(async () => {
      await result.current.saveCharges([{ type: 'MC_FARE', amount: 200 }]);
    });

    expect(mockUpdateCharges).toHaveBeenCalledWith('42', [{ type: 'MC_FARE', amount: 200 }]);
    expect(mockGetCharges).toHaveBeenCalledWith('42'); // Re-fetch after save
  });

  // TC-CHARGES-006
  it('saveCharges returns true on success', async () => {
    const { result } = renderHook(() => useCharges('42'));
    let success: boolean = false;
    await act(async () => {
      success = await result.current.saveCharges(sampleCharges);
    });
    expect(success).toBe(true);
  });

  // TC-CHARGES-007
  it('saveCharges returns false and shows alert on API failure', async () => {
    mockUpdateCharges.mockRejectedValueOnce(new Error('Server error'));
    const { result } = renderHook(() => useCharges('42'));

    let success: boolean = true;
    await act(async () => {
      success = await result.current.saveCharges(sampleCharges);
    });

    expect(success).toBe(false);
    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        message: 'Failed to save charges. Please try again.',
      })
    );
  });

  // TC-CHARGES-008
  it('saveCharges is a no-op when bookingVehicleId is undefined', async () => {
    const { result } = renderHook(() => useCharges(undefined));
    let success: boolean = true;
    await act(async () => {
      success = await result.current.saveCharges(sampleCharges);
    });
    expect(success).toBe(false);
    expect(mockUpdateCharges).not.toHaveBeenCalled();
  });

  // TC-CHARGES-009
  it('refreshCharges is an alias for fetchCharges', async () => {
    const { result } = renderHook(() => useCharges('42'));
    await act(async () => { await result.current.refreshCharges(); });
    expect(mockGetCharges).toHaveBeenCalledWith('42');
  });

  // TC-CHARGES-010
  it('charges are updated to API-confirmed values after saveCharges (no optimistic update)', async () => {
    const serverResponse: Charge[] = [{ type: 'MC_FARE', amount: 999 }]; // Server may modify
    mockUpdateCharges.mockResolvedValueOnce(serverResponse);
    mockGetCharges.mockResolvedValueOnce(serverResponse);

    const { result } = renderHook(() => useCharges('42'));
    await act(async () => {
      await result.current.saveCharges([{ type: 'MC_FARE', amount: 200 }]);
    });

    // Charges should reflect what the server returned
    expect(result.current.charges).toEqual(serverResponse);
  });

  // TC-CHARGES-011
  it('isLoading is true during fetchCharges', async () => {
    let resolveGetCharges!: (value: any) => void;
    mockGetCharges.mockReturnValueOnce(
      new Promise((resolve) => { resolveGetCharges = resolve; })
    );

    const { result } = renderHook(() => useCharges('42'));
    act(() => { result.current.fetchCharges(); });

    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveGetCharges(sampleCharges); });
    expect(result.current.isLoading).toBe(false);
  });

  // TC-CHARGES-012
  it('can save MC_FARE, TOLL_CHARGE, and PARKING_CHARGE types', async () => {
    const allTypes: Charge[] = [
      { type: 'MC_FARE', amount: 50 },
      { type: 'TOLL_CHARGE', amount: 100 },
      { type: 'PARKING_CHARGE', amount: 75 },
    ];
    mockGetCharges.mockResolvedValueOnce(allTypes);
    const { result } = renderHook(() => useCharges('42'));
    await act(async () => { await result.current.saveCharges(allTypes); });
    expect(mockUpdateCharges).toHaveBeenCalledWith('42', allTypes);
  });
});
