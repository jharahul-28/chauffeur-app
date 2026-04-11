import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationPermission } from '../hooks/useLocationPermission';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PermissionGateProps {
  children: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Opens the native app settings page so the user can grant location access. */
function openAppSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

// ─── Blocking screen ──────────────────────────────────────────────────────────

function PermissionScreen({ onRetry }: { onRetry: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.blockScreen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="location-outline" size={48} color="#EDB96D" />
      </View>

      <Text style={styles.title}>Location Required</Text>

      <Text style={styles.body}>
        Velvet uses your real-time location to navigate to pickups, track trips,
        and keep passengers informed. Please enable location access and GPS to
        continue.
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#EDB96D" />
          <Text style={styles.infoText}>Your location is only shared during active trips</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="eye-off-outline" size={16} color="#EDB96D" />
          <Text style={styles.infoText}>Never stored beyond trip completion</Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButtonWrapper}
        onPress={() => {
          openAppSettings();
          // Re-check when user returns from Settings (handled by AppState in hook)
        }}
      >
        <LinearGradient
          colors={['#E5B566', '#B5783C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Ionicons name="settings-outline" size={18} color="#000" />
          <Text style={styles.primaryButtonText}>Open Settings</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>I've enabled it — check again</Text>
      </Pressable>
    </View>
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

/**
 * Wraps the driver area and blocks rendering until location permission
 * and GPS services are both available.
 *
 * - Shows a loading spinner while the initial check is in progress.
 * - Shows a blocking permission screen if permission is denied OR GPS is off.
 * - Renders `children` normally once both conditions are satisfied.
 * - Automatically rechecks when the app returns to the foreground via AppState.
 *
 * Extensibility:
 *  - Add role-based bypass (e.g. admin users skip the gate) via a prop.
 *  - Show different messaging depending on whether it's permission vs GPS issue.
 */
const PermissionGate = memo(function PermissionGate({ children }: PermissionGateProps) {
  const { permissionGranted, gpsEnabled, isChecking, recheck } = useLocationPermission();

  // Still performing initial check
  if (isChecking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#EDB96D" />
        <Text style={styles.loadingText}>Checking location access…</Text>
      </View>
    );
  }

  // Block if permission denied or GPS disabled
  if (!permissionGranted || !gpsEnabled) {
    return <PermissionScreen onRetry={recheck} />;
  }

  return <>{children}</>;
});

export default PermissionGate;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },

  blockScreen: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 185, 109, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: '#8E8E93',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: '#D1D1D6',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  primaryButtonWrapper: {
    width: '100%',
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
