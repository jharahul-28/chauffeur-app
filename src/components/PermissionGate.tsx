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

// Opens the device's app-settings page so the user can manually grant permission.
function openSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

// ─── Screens ──────────────────────────────────────────────────────────────────

// Shown while the initial permission check runs (native dialog may already be open on top).
function LoadingScreen() {
  return <View style={styles.screen} />;
}

// Shown after the user taps "Don't Allow" — button re-fires the native OS dialog.
function AskScreen({ onAsk }: { onAsk: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons name="location" size={40} color="#EDB96D" />
        </View>

        <Text style={styles.heading}>Allow Location Access</Text>

        <Text style={styles.sub}>
          Velvet needs your location to navigate to pickups and track active trips.
          Please allow location access to continue.
        </Text>

        <Pressable onPress={onAsk} style={styles.allowBtn}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.allowBtnInner}
          >
            <Ionicons name="locate" size={18} color="#000" />
            <Text style={styles.allowBtnText}>Grant Permission</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// Shown only when the OS has permanently blocked the permission (canAskAgain = false).
// This is the ONLY case where we fall back to the Settings redirect.
function BlockedScreen({ onRecheck }: { onRecheck: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons name="location-outline" size={40} color="#EDB96D" />
        </View>

        <Text style={styles.heading}>Location Access Blocked</Text>

        <Text style={styles.sub}>
          Location permission was permanently denied. Open your device Settings and
          enable location access for Velvet to continue.
        </Text>

        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={15} color="#EDB96D" />
          <Text style={styles.hintText}>
            Settings → Privacy & Security → Location Services → Velvet
          </Text>
        </View>

        <Pressable onPress={openSettings} style={styles.allowBtn}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.allowBtnInner}
          >
            <Ionicons name="settings-outline" size={18} color="#000" />
            <Text style={styles.allowBtnText}>Open Settings</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onRecheck} style={styles.recheckBtn}>
          <Text style={styles.recheckText}>I've enabled it — check again</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

const PermissionGate = memo(function PermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, ask, recheck } = useLocationPermission();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'denied') return <AskScreen onAsk={ask} />;
  if (status === 'blocked') return <BlockedScreen onRecheck={recheck} />;

  // status === 'granted'
  return <>{children}</>;
});

export default PermissionGate;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 18,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(237,185,109,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(237,185,109,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  hintText: {
    flex: 1,
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 18,
  },
  allowBtn: {
    width: '100%',
    marginTop: 4,
  },
  allowBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  allowBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  recheckBtn: {
    paddingVertical: 10,
  },
  recheckText: {
    color: '#8E8E93',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
