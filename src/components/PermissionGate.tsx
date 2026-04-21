import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationPermission } from '../hooks/useLocationPermission';

// ─── Screens ──────────────────────────────────────────────────────────────────

// Shown while the initial permission check runs (native dialog is open on top).
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

// ─── Gate ─────────────────────────────────────────────────────────────────────

const PermissionGate = memo(function PermissionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, ask } = useLocationPermission();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'denied') return <AskScreen onAsk={ask} />;

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
});
