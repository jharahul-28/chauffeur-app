import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import {
  DriverLocation,
  requestLocationPermission,
  getCurrentLocation,
  watchLocation,
} from '../services/locationService';

interface UseDriverLocationReturn {
  location: DriverLocation | null;
  hasPermission: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export const useDriverLocation = (): UseDriverLocationReturn => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const granted = await requestLocationPermission();
        if (!mounted) return;

        setHasPermission(granted);

        if (!granted) {
          setError('Location permission denied');
          setIsLoading(false);
          return;
        }

        const initialLocation = await getCurrentLocation();
        if (!mounted) return;

        if (initialLocation) {
          setLocation(initialLocation);
        }

        subscriptionRef.current = await watchLocation((updated) => {
          if (mounted) setLocation(updated);
        });
      } catch {
        if (mounted) setError('Failed to get location');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return { location, hasPermission, isLoading, error };
};
