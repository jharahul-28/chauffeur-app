import { useState, useCallback } from 'react';
import { Charge } from '../types/charge';
import { getCharges, updateCharges } from '../services/bookingApi';
import { useAlert } from '../context/AlertContext';

export function useCharges(bookingVehicleId: string | undefined) {
  const { showAlert } = useAlert();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharges = useCallback(async () => {
    if (!bookingVehicleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCharges(bookingVehicleId);
      setCharges(data);
    } catch {
      setError('Failed to load charges');
    } finally {
      setIsLoading(false);
    }
  }, [bookingVehicleId]);

  /**
   * PUT the full updated charges array, then immediately re-fetch from backend.
   * Never updates UI state without API confirmation.
   * Returns true on success, false on failure.
   */
  const saveCharges = useCallback(async (updatedCharges: Charge[]): Promise<boolean> => {
    if (!bookingVehicleId) return false;
    try {
      await updateCharges(bookingVehicleId, updatedCharges);
      const fresh = await getCharges(bookingVehicleId);
      setCharges(fresh);
      return true;
    } catch {
      showAlert({ title: 'Error', message: 'Failed to save charges. Please try again.', buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
      return false;
    }
  }, [bookingVehicleId, showAlert]);

  return {
    charges,
    isLoading,
    error,
    fetchCharges,
    saveCharges,
    refreshCharges: fetchCharges,
  };
}
