import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MapViewContainer, { Coordinate } from '../../src/components/MapViewContainer';
import RideInfoPanel from '../../src/components/RideInfoPanel';
import PickupDrawer from '../../src/components/PickupDrawer';
import OTPModal from '../../src/components/OTPModal';
import { useDriverLocation } from '../../src/hooks/useDriverLocation';
import { RouteInfo } from '../../src/components/DrivingRoute';
import { formatEta, formatDistance } from '../../src/utils/routeUtils';
import { useRideStore } from '../../src/state/useRideStore';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Search params passed from Bookings → "Go to Pickup".
 * When present the screen enters pickup mode.
 */
interface PickupParams {
  riderName?: string;
  pickupText?: string;
}

// ─── Top-bar label per ride status ────────────────────────────────────────────

const STATUS_HEADER: Record<string, string> = {
  GOING_TO_PICKUP: 'En Route to Pickup',
  ARRIVED_AT_PICKUP: 'Arrived at Pickup',
  OTP_PENDING: 'Arrived at Pickup',
  TRIP_STARTED: 'Trip in Progress',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  const { location, hasPermission, isLoading, error } = useDriverLocation();

  // ── Navigation params ──────────────────────────────────────────────────────
  const { riderName, pickupText } = useLocalSearchParams<PickupParams>();
  const isPickupMode = Boolean(riderName);

  // ── Ride state machine ────────────────────────────────────────────────────
  const { ride, initRide, updateStatus, clearRide } = useRideStore();

  // Initialise ride when entering pickup mode (once per mount)
  useEffect(() => {
    if (isPickupMode && !ride) {
      initRide({
        riderName: riderName ?? 'Rider',
        pickupText: pickupText ?? 'Pickup Location',
      });
    }
  }, [isPickupMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear ride on unmount / navigating back to avoid stale state
  useEffect(() => {
    return () => {
      if (isPickupMode) clearRide();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route info (ETA + distance from Directions API) ───────────────────────
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const handleRouteUpdate = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
  }, []);

  // ── Map coordinates derived from ride state ───────────────────────────────
  const pickupCoordinate: Coordinate | undefined = ride?.pickup ?? undefined;

  const tripDestination: Coordinate | undefined =
    ride?.status === 'TRIP_STARTED' ? ride.destination : undefined;

  const tripWaypoints: Coordinate[] | undefined =
    ride?.status === 'TRIP_STARTED'
      ? ride.stoppages.map(({ latitude, longitude }) => ({ latitude, longitude }))
      : undefined;

  // ── Ride state transitions ────────────────────────────────────────────────

  const handleArrivedAtPickup = useCallback(() => {
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus]);

  const handleEnterOTP = useCallback(() => {
    updateStatus('OTP_PENDING');
    setOtpModalVisible(true);
  }, [updateStatus]);

  const handleOTPSuccess = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('TRIP_STARTED');
    // Route info resets — the new DrivingRoute will call onRouteUpdate for the new route
    setRouteInfo(null);
  }, [updateStatus]);

  const handleOTPDismiss = useCallback(() => {
    setOtpModalVisible(false);
    // Revert to ARRIVED_AT_PICKUP so driver can retry
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus]);

  // ── Permission denied fallback ─────────────────────────────────────────────
  if (hasPermission === false) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionIcon}>📍</Text>
        <Text style={styles.permissionTitle}>Location Required</Text>
        <Text style={styles.permissionBody}>
          Please enable location permissions in your device settings to use
          the driver app.
        </Text>
      </View>
    );
  }

  const headerTitle = ride ? (STATUS_HEADER[ride.status] ?? 'En Route to Pickup') : 'En Route to Pickup';

  return (
    <View style={styles.root}>
      {/* ── Full-screen map ──────────────────────────────────────────────────── */}
      <MapViewContainer
        driverLocation={location}
        pickupLocation={pickupCoordinate}
        tripDestination={tripDestination}
        tripWaypoints={tripWaypoints}
        onRouteUpdate={isPickupMode ? handleRouteUpdate : undefined}
      />

      {/* ── Top overlay ─────────────────────────────────────────────────────── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>

        {isPickupMode ? (
          /* ── Pickup mode: back button + ride label ── */
          <View style={styles.pickupHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={styles.pickupHeaderLabel}>
              <Text style={styles.pickupHeaderTitle}>{headerTitle}</Text>
              {riderName && (
                <Text style={styles.pickupHeaderSub}>{riderName}</Text>
              )}
            </View>
          </View>
        ) : (
          /* ── Normal mode: online/offline toggle ── */
          <View style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusIndicator,
                  isOnline ? styles.statusOnline : styles.statusOffline,
                ]}
              />
              <View>
                <Text style={styles.statusTitle}>
                  {isOnline ? 'You are Online' : 'You are Offline'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isOnline
                    ? 'Ready to receive rides'
                    : 'Go Online to start receiving rides'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#3A3A3C', true: '#FFC107' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#3A3A3C"
            />
          </View>
        )}

        {/* GPS loading badge */}
        {isLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#FFC107" />
            <Text style={styles.loadingText}>Acquiring GPS…</Text>
          </View>
        )}

        {/* Error badge */}
        {error && !isLoading && (
          <View style={[styles.loadingBadge, styles.errorBadge]}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}
      </View>

      {/* ── Bottom panel ────────────────────────────────────────────────────── */}
      {isPickupMode && ride ? (
        <PickupDrawer
          riderName={ride.riderName}
          pickupLocationText={ride.pickupText}
          estimatedTime={routeInfo ? formatEta(routeInfo.durationSeconds) : '—'}
          distance={routeInfo ? formatDistance(routeInfo.distanceMeters) : undefined}
          rideStatus={ride.status}
          destinationText={ride.destinationText}
          stoppages={ride.stoppages}
          onArrivedAtPickup={handleArrivedAtPickup}
          onEnterOTP={handleEnterOTP}
        />
      ) : (
        <RideInfoPanel />
      )}

      {/* ── OTP Modal ───────────────────────────────────────────────────────── */}
      {ride && (
        <OTPModal
          visible={otpModalVisible}
          riderName={ride.riderName}
          onSuccess={handleOTPSuccess}
          onDismiss={handleOTPDismiss}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },

  // Normal mode: status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 17, 17, 0.92)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOnline: {
    backgroundColor: '#30D158',
  },
  statusOffline: {
    backgroundColor: '#8E8E93',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 1,
  },

  // Pickup mode: header
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(17, 17, 17, 0.92)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupHeaderLabel: {
    flex: 1,
  },
  pickupHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pickupHeaderSub: {
    color: '#EDB96D',
    fontSize: 12,
    marginTop: 1,
  },

  // Badges
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17, 17, 17, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  loadingText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '500',
  },
  errorBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '500',
  },

  // Permission denied
  centeredContainer: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  permissionBody: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
