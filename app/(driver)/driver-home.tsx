import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MapViewContainer, { Coordinate } from '../../src/components/MapViewContainer';
import RideInfoPanel from '../../src/components/RideInfoPanel';
import PickupDrawer from '../../src/components/PickupDrawer';
import OTPModal from '../../src/components/OTPModal';
import ChargeModal from '../../src/components/ChargeModal';
import ChargesSummaryModal from '../../src/components/ChargesSummaryModal';
import { useDriverLocation } from '../../src/hooks/useDriverLocation';
import { useLocationSync } from '../../src/hooks/useLocationSync';
import { RouteInfo } from '../../src/components/DrivingRoute';
import { formatEta, formatDistance } from '../../src/utils/routeUtils';
import { useRideStore } from '../../src/state/useRideStore';
import { useWaitTimer } from '../../src/hooks/useWaitTimer';
import { useBookingDetail } from '../../src/hooks/useBookingDetail';
import { logWaitEvent } from '../../src/utils/waitLogger';
import { ExtraCharge } from '../../src/types/charge';
import { BookingStatus } from '../../src/types/booking';
import {
  postDriverOnTheWay,
  postArrived,
  postVerifyOtp,
  postWaiting,
  postContinue,
  postComplete,
} from '../../src/services/rideService';
import { submitCharges } from '../../src/services/bookingApi';
import { aggregateCharges } from '../../src/utils/chargeAggregator';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PickupParams {
  bookingId?: string;
  bookingVehicleId?: string;
  /** Booking status passed from the bookings list — used to restore ride state. */
  bookingStatus?: BookingStatus;
}

// ─── Top-bar label per ride status ────────────────────────────────────────────

const STATUS_HEADER: Record<string, string> = {
  GOING_TO_PICKUP: 'En Route to Pickup',
  ARRIVED_AT_PICKUP: 'Arrived at Pickup',
  OTP_PENDING: 'Arrived at Pickup',
  TRIP_STARTED: 'Trip in Progress',
  TRIP_COMPLETED: 'Trip Completed',
};

// ─── Booking status → initial ride status mapping ─────────────────────────────

function bookingStatusToRideStatus(status: BookingStatus | undefined) {
  switch (status) {
    case 'ARRIVED':
      return 'ARRIVED_AT_PICKUP' as const;
    case 'OTP_VERIFIED':
    case 'IN_PROGRESS':
    case 'WAITING':
      return 'TRIP_STARTED' as const;
    default:
      return 'GOING_TO_PICKUP' as const;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  // ── Charge modal state ────────────────────────────────────────────────────
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [chargesSummaryVisible, setChargesSummaryVisible] = useState(false);
  /**
   * Index into extraCharges[] being edited, or null when adding a new charge.
   */
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);

  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isArrivedAtPickup, setIsArrivedAtPickup] = useState(false);

  const { location, hasPermission, isLoading, error } = useDriverLocation();

  // ── Navigation params ──────────────────────────────────────────────────────
  const { bookingId, bookingVehicleId, bookingStatus } = useLocalSearchParams<PickupParams>();

  const { startSync, stopSync } = useLocationSync(bookingVehicleId, () => setIsArrivedAtPickup(true));
  const isPickupMode = Boolean(bookingId);

  // ── Booking detail fetch ──────────────────────────────────────────────────
  const {
    ride: bookingDetailRide,
    isLoading: isDetailLoading,
    error: detailError,
  } = useBookingDetail(bookingId);

  // ── Ride state machine ────────────────────────────────────────────────────
  const {
    ride,
    extraCharges,
    initRide,
    updateStatus,
    addExtraCharge,
    updateExtraCharge,
    clearRide,
  } = useRideStore();

  // ── Wait timer ────────────────────────────────────────────────────────────
  const {
    isWaiting,
    elapsedTime,
    isFreeTimeExceeded,
    startWaiting,
    stopWaiting,
    resetTimer: resetWaitTimer,
  } = useWaitTimer();

  // Initialise ride once booking detail loads and restore status from booking
  useEffect(() => {
    if (isPickupMode && bookingDetailRide && !ride && bookingVehicleId) {
      initRide({ ...bookingDetailRide, bookingVehicleId });
      startSync();

      const initialRideStatus = bookingStatusToRideStatus(bookingStatus as BookingStatus | undefined);

      if (initialRideStatus === 'GOING_TO_PICKUP') {
        // Only notify backend when transitioning from ASSIGNED.
        // DRIVER_ON_THE_WAY is already set on the backend — re-calling would be a no-op at best.
        if (!bookingStatus || bookingStatus === 'ASSIGNED') {
          postDriverOnTheWay(bookingVehicleId).catch((err) =>
            console.error('[driver-home] postDriverOnTheWay failed:', err)
          );
        }
      } else {
        // Restore ride to the correct state without triggering API side effects
        updateStatus(initialRideStatus);

        if (bookingStatus === 'WAITING') {
          // WAITING → driver is already waiting; activate the timer so the
          // drawer shows "Resume" (not "Wait") and the wait timer is visible.
          // We don't have the prior elapsed seconds from the booking list, so
          // start from 0 — backend is the source of truth for wait fare.
          startWaiting(0);
        }
      }
    }
  }, [bookingDetailRide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear ride on unmount
  useEffect(() => {
    return () => {
      if (isPickupMode) clearRide();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route info ────────────────────────────────────────────────────────────
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const handleRouteUpdate = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
  }, []);

  // ── Map coordinates ───────────────────────────────────────────────────────
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

  const handleVerifyOtp = useCallback(async (otp: string) => {
    if (!ride?.bookingVehicleId) throw new Error('No active ride');
    await postVerifyOtp(ride.bookingVehicleId, otp);
  }, [ride]);

  const handleOTPDismiss = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus]);

  const handleEndTrip = useCallback(() => {
    if (!ride || isEndingTrip) return;

    Alert.alert(
      'End Trip?',
      'Are you sure you want to end the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            setIsEndingTrip(true);
            stopWaiting();

            try {
              await postComplete(ride.bookingVehicleId);
              stopSync();
              resetWaitTimer();
              updateStatus('TRIP_COMPLETED');
              clearRide();

              // Navigate to pending amount screen first, then feedback
              router.push({
                pathname: '/(driver)/pending-amount',
                params: {
                  rideId: ride.id,
                  bookingVehicleId: ride.bookingVehicleId,
                  riderName: ride.riderName,
                  pickupText: ride.pickupText,
                  destinationText: ride.destinationText,
                  fare: ride.fare,
                },
              });
            } catch (err) {
              console.error('[driver-home] endTrip failed:', err);
              Alert.alert('Failed to End Trip', 'Something went wrong. Please try again.');
              setIsEndingTrip(false);
            }
          },
        },
      ],
    );
  }, [ride, isEndingTrip, stopWaiting, resetWaitTimer, updateStatus, clearRide, router]);

  // ── Wait / Resume ────────────────────────────────────────────────────────

  const handleWait = useCallback(() => {
    Alert.alert(
      'Start Waiting?',
      'Do you want to start waiting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wait',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_START', ride.id);
              const data = await postWaiting(ride.bookingVehicleId);
              startWaiting(data.totalWaitingSeconds);
            } catch (err) {
              console.error('[driver-home] postWaiting failed:', err);
              Alert.alert('Error', 'Failed to start waiting. Please try again.');
            }
          },
        },
      ],
    );
  }, [ride, startWaiting]);

  const handleResumeTrip = useCallback(() => {
    Alert.alert(
      'Resume Trip?',
      'Do you want to resume the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_RESUME', ride.id);
              await postContinue(ride.bookingVehicleId);
              stopWaiting();
            } catch (err) {
              console.error('[driver-home] postContinue failed:', err);
              Alert.alert('Error', 'Failed to resume trip. Please try again.');
            }
          },
        },
      ],
    );
  }, [ride, stopWaiting]);

  // ── Extra charge handlers ─────────────────────────────────────────────────

  const handleOpenChargesSummary = useCallback(() => {
    setChargesSummaryVisible(true);
  }, []);

  const handleOpenAddCharge = useCallback(() => {
    setChargesSummaryVisible(false);
    setEditingChargeIndex(null);
    setChargeModalVisible(true);
  }, []);

  const handleOpenEditCharge = useCallback((index: number) => {
    setChargesSummaryVisible(false);
    setEditingChargeIndex(index);
    setChargeModalVisible(true);
  }, []);

  /**
   * Called when ChargeModal saves — updates local state then immediately
   * submits the full charges snapshot to the backend.
   */
  const handleChargeSubmit = useCallback(async (charge: ExtraCharge) => {
    let updatedCharges: ExtraCharge[];
    if (editingChargeIndex !== null) {
      updatedCharges = extraCharges.map((c, i) => (i === editingChargeIndex ? charge : c));
      updateExtraCharge(editingChargeIndex, charge);
    } else {
      updatedCharges = [...extraCharges, charge];
      addExtraCharge(charge);
    }
    setChargeModalVisible(false);
    setEditingChargeIndex(null);

    // Submit immediately after every save
    if (ride?.bookingVehicleId) {
      try {
        await submitCharges(ride.bookingVehicleId, aggregateCharges(updatedCharges));
      } catch (err) {
        console.error('[driver-home] submitCharges failed:', err);
        Alert.alert('Warning', 'Charge saved locally but failed to sync. It will be retried.');
      }
    }
  }, [editingChargeIndex, extraCharges, addExtraCharge, updateExtraCharge, ride]);

  const handleChargeDismiss = useCallback(() => {
    setChargeModalVisible(false);
    setEditingChargeIndex(null);
  }, []);

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
  const headerSubtitle = ride?.riderName ?? (isDetailLoading ? 'Loading…' : '');

  if (isPickupMode && isDetailLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#EDB96D" />
        <Text style={styles.loadingLabel}>Loading booking…</Text>
      </View>
    );
  }

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

  const chargeBeingEdited =
    editingChargeIndex !== null ? extraCharges[editingChargeIndex] : undefined;

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
          <View style={styles.pickupHeader}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View style={styles.pickupHeaderLabel}>
              <Text style={styles.pickupHeaderTitle}>{headerTitle}</Text>
              {headerSubtitle ? (
                <Text style={styles.pickupHeaderSub}>{headerSubtitle}</Text>
              ) : null}
            </View>
            {extraCharges.length > 0 && (
              <Pressable style={styles.chargeBadge} onPress={handleOpenChargesSummary}>
                <Ionicons name="receipt-outline" size={12} color="#EDB96D" />
                <Text style={styles.chargeBadgeText}>{extraCharges.length}</Text>
              </Pressable>
            )}
          </View>
        ) : (
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

        {isLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#FFC107" />
            <Text style={styles.loadingText}>Acquiring GPS…</Text>
          </View>
        )}

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
          chargeCount={extraCharges.length}
          specialRemarks={ride.specialRemarks}
          onArrivedAtPickup={handleArrivedAtPickup}
          onEnterOTP={handleEnterOTP}
          onEndTrip={handleEndTrip}
          onWait={handleWait}
          onResumeTrip={handleResumeTrip}
          onOpenChargesSummary={handleOpenChargesSummary}
          isWaiting={isWaiting}
          elapsedWaitTime={elapsedTime}
          isFreeTimeExceeded={isFreeTimeExceeded}
          isEndingTrip={isEndingTrip}
          arrivedAtPickup={isArrivedAtPickup}
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

      {/* ── Charges Summary Modal ────────────────────────────────────────────── */}
      <ChargesSummaryModal
        visible={chargesSummaryVisible}
        charges={extraCharges}
        onDismiss={() => setChargesSummaryVisible(false)}
        onAddCharge={handleOpenAddCharge}
        onEditCharge={handleOpenEditCharge}
      />

      {/* ── Charge Modal (ADD or EDIT mode) ─────────────────────────────────── */}
      <ChargeModal
        visible={chargeModalVisible}
        onSubmit={handleChargeSubmit}
        onDismiss={handleChargeDismiss}
        initialCharge={chargeBeingEdited}
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
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
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
