import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface LocationPermissionState {
  /** null while still checking; true/false after first check. */
  permissionGranted: boolean | null;
  /** null while still checking; true/false after first check. */
  gpsEnabled: boolean | null;
  /** True only during the very first async check. */
  isChecking: boolean;
  /** Manually re-trigger a permission + GPS status check. */
  recheck: () => Promise<void>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Monitors foreground location permission and GPS service state.
 *
 * - Performs an initial check on mount.
 * - Re-checks every time the app returns to the foreground (AppState 'active').
 * - Exposes `recheck` so the PermissionGate's "Open Settings" button can
 *   trigger an immediate re-evaluation after the user returns from Settings.
 *
 * Extensibility:
 *  - Add background permission check (`requestBackgroundPermissionsAsync`) when
 *    background location sync needs always-on permission.
 *  - Debounce the AppState listener if rapid toggling causes performance issues.
 */
export function useLocationPermission(): LocationPermissionState {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    try {
      const [{ status }, gps] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.hasServicesEnabledAsync(),
      ]);

      if (!mountedRef.current) return;
      setPermissionGranted(status === 'granted');
      setGpsEnabled(gps);
    } catch {
      // Fail open — don't block the app on a check error
      if (mountedRef.current) {
        setPermissionGranted(false);
        setGpsEnabled(false);
      }
    } finally {
      if (mountedRef.current) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    check();

    // Re-check whenever app comes back to foreground (e.g. returning from Settings)
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        check();
      }
    });

    return () => {
      mountedRef.current = false;
      sub.remove();
    };
  }, [check]);

  return { permissionGranted, gpsEnabled, isChecking, recheck: check };
}
