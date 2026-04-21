import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';

export type LocationStatus = 'loading' | 'granted' | 'denied';

export interface UseLocationPermissionReturn {
  status: LocationStatus;
  ask: () => Promise<void>;
  recheck: () => Promise<void>;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const isMounted = useRef(true);
  const isAsking = useRef(false);

  // Fire the native OS dialog and update status based on the response.
  const ask = async () => {
    if (isAsking.current) return;
    isAsking.current = true;
    try {
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted.current) return;
      if (s === 'granted') setStatus('granted');
      else setStatus('denied');
    } catch {
      if (isMounted.current) setStatus('denied');
    } finally {
      isAsking.current = false;
    }
  };

  // Silent status check — does NOT show a dialog.
  const recheck = async () => {
    try {
      const { status: s } = await Location.getForegroundPermissionsAsync();
      if (!isMounted.current) return;
      if (s === 'granted') setStatus('granted');
      else setStatus('denied');
    } catch {
      if (isMounted.current) setStatus('denied');
    }
  };

  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      const { status: s } = await Location.getForegroundPermissionsAsync().catch(() => ({
        status: 'denied' as const,
        canAskAgain: true,
        expires: 'never' as const,
        granted: false,
      }));

      if (!isMounted.current) return;

      if (s === 'granted') {
        // Already granted (e.g. app re-opened) — no dialog needed.
        setStatus('granted');
      } else {
        // First launch or status unknown — fire the native dialog immediately.
        await ask();
      }
    };

    init();

    // When the user returns from the OS Settings app, silently re-check.
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') recheck();
    });

    return () => {
      isMounted.current = false;
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, ask, recheck };
}
