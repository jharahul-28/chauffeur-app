import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bgColors, themeColors } from '../../src/constants/colors';

import MapViewContainer from '../../src/components/MapViewContainer';
import RideInfoPanel from '../../src/components/RideInfoPanel';
import { useRoutePoints } from '../../src/utils/waypointUtils';
import PickupDrawer from '../../src/components/PickupDrawer';
import OTPModal from '../../src/components/OTPModal';
import ChargeModal from '../../src/components/ChargeModal';
import ChargesSummaryModal from '../../src/components/ChargesSummaryModal';
import { useDriverLocation } from '../../src/hooks/useDriverLocation';
import { useLocationSync } from '../../src/hooks/useLocationSync';
import { RouteInfo } from '../../src/components/DrivingRoute';
import { formatEta, formatDistance } from '../../src/utils/routeUtils';
import { useRideStore } from '../../src/state/useRideStore';
import { useCharges } from '../../src/hooks/useCharges';
import { useWaitTimer } from '../../src/hooks/useWaitTimer';
import { useBookingDetail } from '../../src/hooks/useBookingDetail';
import { logWaitEvent } from '../../src/utils/waitLogger';
import { Charge } from '../../src/types/charge';
import { BookingStatus } from '../../src/types/booking';
import {
  postDriverOnTheWay,
  postArrived,
  postVerifyOtp,
  postWaiting,
  postContinue,
  postEndRide,
} from '../../src/services/rideService';
import { canEndTrip } from '../../src/utils/tripGuard';
import { getErrorMessage } from '../../src/utils/apiErrorParser';
import { useAlert } from '../../src/context/AlertContext';

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
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);

  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isArrivingAtPickup, setIsArrivingAtPickup] = useState(false);

  const { showAlert } = useAlert();
  const { location, hasPermission, isLoading, error } = useDriverLocation();

  // ── Navigation params ──────────────────────────────────────────────────────
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;
  const bookingVehicleId = params.bookingVehicleId as string | undefined;
  const bookingStatus = params.bookingStatus as BookingStatus | undefined;
  const tripType = params.tripType as string | undefined;

  // ── Booking detail fetch ──────────────────────────────────────────────────
  const {
    ride: bookingDetailRide,
    isLoading: isDetailLoading,
    error: detailError,
    refetch: refetchBooking,
  } = useBookingDetail(bookingId);

  // ── Ride state machine ────────────────────────────────────────────────────
  const { ride, initRide, updateStatus, clearRide } = useRideStore();

  // ── Waypoint arrival handler (called by background sync) ───────────────
  const handleBackgroundArrival = useCallback(() => {
    console.log('[driver-home] 🎯 Background arrival detected!');
    // Only auto-transition if we're still in GOING_TO_PICKUP
    const currentRide = useRideStore.getState().ride;
    if (currentRide && currentRide.status === 'GOING_TO_PICKUP') {
      updateStatus('ARRIVED_AT_PICKUP');
      // Fire the API call too
      postArrived(currentRide.bookingVehicleId).catch((err) =>
        console.error('[driver-home] background postArrived failed:', err)
      );
    }
    // Refetch booking to sync with latest backend state
    refetchBooking();
  }, [updateStatus, refetchBooking]);

  const { startSync, stopSync, nextWaypoint } = useLocationSync(bookingVehicleId, {
    onArrived: handleBackgroundArrival,
  });
  const isPickupMode = Boolean(bookingId);

  // ── Charges — always sourced from API, never from local state ─────────────
  const { charges, fetchCharges, saveCharges } = useCharges(bookingVehicleId);

  // ── Wait timer ────────────────────────────────────────────────────────────
  const {
    isWaiting,
    elapsedTime,
    isFreeTimeExceeded,
    startWaiting,
    stopWaiting,
    resetTimer: resetWaitTimer,
  } = useWaitTimer();

  const initializedRideIdRef = useRef<string | null>(null);

  // Initialise ride once booking detail loads and restore status from booking
  useEffect(() => {
    const isDifferentRide = initializedRideIdRef.current !== bookingVehicleId;
    
    if (isPickupMode && bookingDetailRide && isDifferentRide && bookingVehicleId) {
      initializedRideIdRef.current = bookingVehicleId;
      initRide({ ...bookingDetailRide, bookingVehicleId });

      const initialRideStatus = bookingStatusToRideStatus(bookingStatus as BookingStatus | undefined);

      if (initialRideStatus === 'GOING_TO_PICKUP') {
        if (!bookingStatus || bookingStatus === 'ASSIGNED') {
          postDriverOnTheWay(bookingVehicleId).catch((err) =>
            console.error('[driver-home] postDriverOnTheWay failed:', err)
          );
        }
      } else {
        updateStatus(initialRideStatus);

        if (bookingStatus === 'WAITING') {
          startWaiting(0);
        }
      }
    }
  }, [isPickupMode, bookingDetailRide, bookingVehicleId, bookingStatus, initRide, updateStatus, startWaiting]);

  // For hourly bookings re-entered at OTP_VERIFIED/IN_PROGRESS, redirect immediately
  useEffect(() => {
    const isHourly = (tripType ?? bookingDetailRide?.tripType) === 'HOURLY_RENTALS';
    const isPostOtp = bookingStatus === 'OTP_VERIFIED' || bookingStatus === 'IN_PROGRESS';
    if (isPickupMode && isHourly && isPostOtp && bookingId && bookingVehicleId) {
      stopSync();
      router.replace({
        pathname: '/(driver)/hourly-ride',
        params: {
          bookingId,
          bookingVehicleId,
          riderName: bookingDetailRide?.riderName ?? '',
          customerContact: bookingDetailRide?.customerContact || undefined,
        },
      });
    }
  }, [bookingDetailRide, bookingStatus, tripType, isPickupMode, bookingId, bookingVehicleId, stopSync, router]);

  // Fetch charges from API on mount
  useEffect(() => {
    if (bookingVehicleId) fetchCharges();
  }, [bookingVehicleId, fetchCharges]);
  const syncedRideIdRef = useRef<string | null>(null);

  // Background Location Sync lifecycle
  useEffect(() => {
    if (!ride?.bookingVehicleId) {
      if (syncedRideIdRef.current) {
        stopSync();
        syncedRideIdRef.current = null;
      }
      return;
    }

    if (syncedRideIdRef.current !== ride.bookingVehicleId) {
      syncedRideIdRef.current = ride.bookingVehicleId;
      startSync();
    }

    return () => {
      // We don't stopSync on every minor re-render or status update.
      // Only when the component unmounts or ID changes (handled above).
    };
  }, [ride?.bookingVehicleId, startSync, stopSync]);

  // Ensure we stop sync when the component unmounts
  useEffect(() => {
    return () => {
      stopSync();
    };
  }, [stopSync]);

  // Clear ride on unmount
  useEffect(() => {
    return () => {
      if (isPickupMode) clearRide();
    };
  }, [isPickupMode, clearRide]);

  // ── Route info ────────────────────────────────────────────────────────────
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const handleRouteUpdate = useCallback((info: RouteInfo) => {
    setRouteInfo(info);
  }, []);

  // ── Route points (memoised from raw waypoints) ───────────────────────────
  const routePoints = useRoutePoints(ride?.rawWaypoints);

  const mapMode = ride
    ? ride.status === 'TRIP_STARTED' ? 'trip' : 'pickup'
    : undefined;

  // ── Ride state transitions ────────────────────────────────────────────────

  const handleArrivedAtPickup = useCallback(async () => {
    if (!ride?.bookingVehicleId || isArrivingAtPickup) return;
    setIsArrivingAtPickup(true);
    try {
      await postArrived(ride.bookingVehicleId);
      updateStatus('ARRIVED_AT_PICKUP');
    } catch (err) {
      console.error('[driver-home] postArrived failed:', err);
      showAlert({ title: 'Error', message: getErrorMessage(err, 'Failed to confirm arrival. Please try again.'), buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
    } finally {
      setIsArrivingAtPickup(false);
    }
  }, [ride, isArrivingAtPickup, updateStatus, showAlert]);

  const handleEnterOTP = useCallback(() => {
    updateStatus('OTP_PENDING');
    setOtpModalVisible(true);
  }, [updateStatus]);

  const handleOTPSuccess = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('TRIP_STARTED');
    setRouteInfo(null);

    if ((tripType ?? ride?.tripType) === 'HOURLY_RENTALS') {
      stopSync();
      router.push({
        pathname: '/(driver)/hourly-ride',
        params: {
          bookingId: bookingId ?? '',
          bookingVehicleId: bookingVehicleId ?? '',
          riderName: ride?.riderName ?? '',
          customerContact: ride?.customerContact || undefined,
        },
      });
    }
  }, [updateStatus, tripType, ride, bookingId, bookingVehicleId, stopSync, router]);

  const handleVerifyOtp = useCallback(async (otp: string) => {
    if (!ride?.bookingVehicleId) throw new Error('No active ride');
    await postVerifyOtp(ride.bookingVehicleId, otp);
  }, [ride]);

  const handleOTPDismiss = useCallback(() => {
    setOtpModalVisible(false);
    updateStatus('ARRIVED_AT_PICKUP');
  }, [updateStatus]);

  const handleEndTrip = useCallback(async () => {
    if (!ride || isEndingTrip) return;

    const guard = canEndTrip(isWaiting);
    if (!guard.allowed) {
      showAlert({ title: 'Cannot End Trip', message: guard.reason ?? 'Cannot end trip right now.', buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
      throw new Error(guard.reason); // causes SlideToConfirm to reset
    }

    setIsEndingTrip(true);
    stopWaiting();

    try {
      await postEndRide(ride.bookingVehicleId);
      stopSync(); // Stop tracking immediately to avoid pings for ended ride
      resetWaitTimer();
      updateStatus('TRIP_COMPLETED');
      clearRide();

      router.push({
        pathname: '/(driver)/pending-amount',
        params: {
          rideId: ride.id,
          bookingVehicleId: ride.bookingVehicleId,
          riderName: ride.riderName,
          pickupText: ride.pickupText,
          destinationText: ride.destinationText,
          fare: ride.fare,
          balanceAmount: String(ride.balanceAmount ?? ''),
        },
      });
    } catch (err) {
      console.error('[driver-home] endTrip failed:', err);
      showAlert({ title: 'Failed to End Trip', message: getErrorMessage(err, 'Something went wrong. Please try again.'), buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
      setIsEndingTrip(false);
    }
  }, [ride, isEndingTrip, isWaiting, stopWaiting, resetWaitTimer, updateStatus, clearRide, router, showAlert]);

  // ── Wait / Resume ────────────────────────────────────────────────────────

  const handleWait = useCallback(() => {
    showAlert({
      title: 'Start Waiting?',
      message: 'Do you want to start waiting?',
      buttons: [
        { text: 'Cancel', onPress: () => {}, type: 'secondary' },
        {
          text: 'Wait',
          type: 'primary',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_START', ride.id);
              const data = await postWaiting(ride.bookingVehicleId);
              startWaiting(data.totalWaitingSeconds);
            } catch (err) {
              console.error('[driver-home] postWaiting failed:', err);
              showAlert({ title: 'Error', message: 'Failed to start waiting. Please try again.', buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
            }
          },
        },
      ],
    });
  }, [ride, startWaiting, showAlert]);

  const handleResumeTrip = useCallback(() => {
    showAlert({
      title: 'Resume Trip?',
      message: 'Do you want to resume the trip?',
      buttons: [
        { text: 'Cancel', onPress: () => {}, type: 'secondary' },
        {
          text: 'Resume',
          type: 'primary',
          onPress: async () => {
            if (!ride?.bookingVehicleId) return;
            try {
              logWaitEvent('WAIT_RESUME', ride.id);
              await postContinue(ride.bookingVehicleId);
              stopWaiting();
            } catch (err) {
              console.error('[driver-home] postContinue failed:', err);
              showAlert({ title: 'Error', message: 'Failed to resume trip. Please try again.', buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
            }
          },
        },
      ],
    });
  }, [ride, stopWaiting, showAlert]);

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

  const handleChargeSubmit = useCallback(async (charge: Charge) => {
    const updatedCharges = editingChargeIndex !== null
      ? charges.map((c, i) => (i === editingChargeIndex ? charge : c))
      : [...charges, charge];

    setChargeModalVisible(false);
    setEditingChargeIndex(null);

    await saveCharges(updatedCharges);
  }, [editingChargeIndex, charges, saveCharges]);

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
        <TouchableOpacity style={styles.retryButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.retryText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerTitle = ride ? (STATUS_HEADER[ride.status] ?? 'En Route to Pickup') : 'En Route to Pickup';
  const headerSubtitle = ride?.riderName ?? (isDetailLoading ? 'Loading…' : '');

  if (isPickupMode && isDetailLoading) {
    return (
      <View style={styles.centeredContainer}>
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
    editingChargeIndex !== null ? charges[editingChargeIndex] : undefined;

  return (
    <View style={styles.root}>
      {/* ── Full-screen map ──────────────────────────────────────────────────── */}
      <MapViewContainer
        driverLocation={location}
        routePoints={mapMode ? routePoints : undefined}
        mode={mapMode}
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
            {charges.length > 0 && (
              <Pressable style={styles.chargeBadge} onPress={handleOpenChargesSummary}>
                <Ionicons name="receipt-outline" size={12} color="#EDB96D" />
                <Text style={styles.chargeBadgeText}>{charges.length}</Text>
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
          chargeCount={charges.length}
          specialRemarks={ride.specialRemarks}
          specialRequest={ride.specialRequest}
          nextWaypointCoord={nextWaypoint}
          pickupCoord={ride.pickup}
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
          isArrivingAtPickup={isArrivingAtPickup}
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
        charges={charges}
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
