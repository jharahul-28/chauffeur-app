import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MapViewContainer, { Coordinate } from '../../src/components/MapViewContainer';
import RideInfoPanel from '../../src/components/RideInfoPanel';
import PickupDrawer from '../../src/components/PickupDrawer';
import OTPModal from '../../src/components/OTPModal';
import ChargeModal from '../../src/components/ChargeModal';
import { useDriverLocation } from '../../src/hooks/useDriverLocation';
import { useLocationSync } from '../../src/hooks/useLocationSync';
import { RouteInfo } from '../../src/components/DrivingRoute';
import { formatEta, formatDistance } from '../../src/utils/routeUtils';
import { useRideStore } from '../../src/state/useRideStore';
import { useWaitTimer } from '../../src/hooks/useWaitTimer';
import { useBookingDetail, RideDetailData } from '../../src/hooks/useBookingDetail';
import {
  postDriverOnTheWay,
  postArrived,
  postVerifyOtp,
  postWaiting,
  postContinue,
  postComplete,
} from '../../src/services/rideService';
import { ExtraCharge } from '../../src/types/charge';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Search params passed from Bookings → "Go to Pickup". */
interface PickupParams {
  bookingId?: string;
}

// ─── Top-bar label per ride status ────────────────────────────────────────────

const STATUS_HEADER: Record<string, string> = {
  GOING_TO_PICKUP: 'En Route to Pickup',
  ARRIVED_AT_PICKUP: 'Arrived at Pickup',
  OTP_PENDING: 'Arrived at Pickup',
  TRIP_STARTED: 'Trip in Progress',
  TRIP_COMPLETED: 'Trip Completed',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [chargeModalVisible, setChargeModalVisible] = useState(false);

  const { location, hasPermission, isLoading, error } = useDriverLocation();

  // Background location sync — active whenever the driver is on this screen
  // (treated as "logged in" state). Stops on unmount automatically.
  useLocationSync(true);

  // ── Navigation params ──────────────────────────────────────────────────────
  const { bookingId } = useLocalSearchParams<PickupParams>();
  const isPickupMode = Boolean(bookingId);

  // ── Booking detail fetch ──────────────────────────────────────────────────
  const {
    ride: bookingDetailRide,
    isLoading: isDetailLoading,
    error: detailError,
  } = useBookingDetail(bookingId);

  // ── Ride state machine ────────────────────────────────────────────────────
  const { ride, extraCharges, initRide, updateStatus, addExtraCharge, clearRide } = useRideStore();

  // ── Wait timer (cumulative per trip) ──────────────────────────────────────
  const {
    isWaiting,
    remainingFreeWaitTime,
    isFreeTimeExceeded,
    startWaiting,
    stopWaiting,
    reset: resetWaitTimer,
  } = useWaitTimer();

  // Initialise ride once booking detail loads, then notify backend
  useEffect(() => {
    if (isPickupMode && bookingDetailRide && !ride) {
      // Merge bookingVehicleId (route param = bookings list id) into ride data
      const rideData: Omit<RideDetailData & { bookingVehicleId: string }, never> = {
        ...bookingDetailRide,
        bookingVehicleId: bookingId!,
      };
      initRide(rideData);
      postDriverOnTheWay(bookingId!).catch((err) =>
        console.error('[driver-home] postDriverOnTheWay failed:', err)
      );
    }
  }, [bookingDetailRide]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (ride?.bookingVehicleId) {
      postArrived(ride.bookingVehicleId).catch((err) =>
        console.error('[driver-home] postArrived failed:', err)
      );
    }
  }, [updateStatus, ride]);

  const handleEnterOTP = useCallback(() => {
    updateStatus('OTP_PENDING');
    setOtpModalVisible(true);
  }, [updateStatus]);

  const handleOTPSuccess = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('TRIP_STARTED');
    setRouteInfo(null);
  }, [updateStatus]);

  // Async OTP verifier passed to OTPModal — throws on wrong OTP so modal shows error
  const handleVerifyOtp = useCallback(async (otp: string) => {
    if (!ride?.bookingVehicleId) throw new Error('No active ride');
    await postVerifyOtp(ride.bookingVehicleId, otp);
  }, [ride]);

  const handleOTPDismiss = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus]);

  const handleEndTrip = useCallback(() => {
    if (!ride) return;
    stopWaiting();
    resetWaitTimer();
    updateStatus('TRIP_COMPLETED');
    // Fire-and-forget: don't block navigation on API call
    postComplete(ride.bookingVehicleId).catch((err) =>
      console.error('[driver-home] postComplete failed:', err)
    );
    router.push({
      pathname: '/(driver)/feedback',
      params: {
        rideId: ride.id,
        riderName: ride.riderName,
        pickupText: ride.pickupText,
        destinationText: ride.destinationText,
        fare: ride.fare,
      },
    });
  }, [ride, stopWaiting, resetWaitTimer, updateStatus, router]);

  const handleWait = useCallback(() => {
    startWaiting();
    if (ride?.bookingVehicleId) {
      postWaiting(ride.bookingVehicleId).catch((err) =>
        console.error('[driver-home] postWaiting failed:', err)
      );
    }
  }, [startWaiting, ride]);

  const handleResumeTrip = useCallback(() => {
    stopWaiting();
    if (ride?.bookingVehicleId) {
      postContinue(ride.bookingVehicleId).catch((err) =>
        console.error('[driver-home] postContinue failed:', err)
      );
    }
  }, [stopWaiting, ride]);

  // ── Extra charge handlers ─────────────────────────────────────────────────

  const handleChargeSubmit = useCallback((charge: ExtraCharge) => {
    addExtraCharge(charge);
    setChargeModalVisible(false);
  }, [addExtraCharge]);

  // ── Permission denied fallback ─────────────────────────────────────────────
  // Note: PermissionGate in the driver layout already blocks before this screen
  // mounts. This is a secondary in-screen fallback for edge cases.
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
  const headerSubtitle = ride?.riderName ?? (isDetailLoading ? 'Loading…' : '');

  // Show full-screen loading while booking detail is being fetched
  if (isPickupMode && isDetailLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#EDB96D" />
        <Text style={styles.loadingLabel}>Loading booking…</Text>
      </View>
    );
  }

  // Show full-screen error if detail fetch failed
  if (isPickupMode && detailError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.permissionIcon}>⚠️</Text>
        <Text style={styles.permissionTitle}>Failed to load booking</Text>
        <Text style={styles.permissionBody}>{detailError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              {headerSubtitle ? (
                <Text style={styles.pickupHeaderSub}>{headerSubtitle}</Text>
              ) : null}
            </View>
            {/* Extra charge badge — shown when charges exist */}
            {extraCharges.length > 0 && (
              <View style={styles.chargeBadge}>
                <Ionicons name="receipt-outline" size={12} color="#EDB96D" />
                <Text style={styles.chargeBadgeText}>{extraCharges.length}</Text>
              </View>
            )}
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
          bookingReference={ride.bookingReference}
          customerContact={ride.customerContact}
          fare={ride.fare}
          pickupLocationText={ride.pickupText}
          estimatedTime={routeInfo ? formatEta(routeInfo.durationSeconds) : '—'}
          distance={routeInfo ? formatDistance(routeInfo.distanceMeters) : undefined}
          rideStatus={ride.status}
          destinationText={ride.destinationText}
          stoppages={ride.stoppages}
          onArrivedAtPickup={handleArrivedAtPickup}
          onEnterOTP={handleEnterOTP}
          onEndTrip={handleEndTrip}
          onWait={handleWait}
          onResumeTrip={handleResumeTrip}
          onCharge={() => setChargeModalVisible(true)}
          isWaiting={isWaiting}
          remainingWaitTime={remainingFreeWaitTime}
          isFreeTimeExceeded={isFreeTimeExceeded}
        />
      ) : (
        <RideInfoPanel />
      )}

      {/* ── OTP Modal ───────────────────────────────────────────────────────── */}
      {ride && (
        <OTPModal
          visible={otpModalVisible}
          riderName={ride.riderName}
          onVerify={handleVerifyOtp}
          onSuccess={handleOTPSuccess}
          onDismiss={handleOTPDismiss}
        />
      )}

      {/* ── Charge Modal ─────────────────────────────────────────────────────── */}
      <ChargeModal
        visible={chargeModalVisible}
        onSubmit={handleChargeSubmit}
        onDismiss={() => setChargeModalVisible(false)}
      />
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
  chargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(237, 185, 109, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.3)',
  },
  chargeBadgeText: {
    color: '#EDB96D',
    fontSize: 12,
    fontWeight: '700',
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

  // Permission denied / loading / error full-screen states
  centeredContainer: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  permissionBody: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingLabel: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 4,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDB96D',
  },
  retryText: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
  },
});
