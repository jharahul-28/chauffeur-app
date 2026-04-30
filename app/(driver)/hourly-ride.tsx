import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import TimeDisplay from '../../src/components/TimeDisplay';
import DistanceDisplay from '../../src/components/DistanceDisplay';
import ChargeModal from '../../src/components/ChargeModal';
import ChargesSummaryModal from '../../src/components/ChargesSummaryModal';
import SlideToConfirm from '../../src/components/SlideToConfirm';
import HeaderBackButton from '../../src/components/HeaderBackButton';
import { useHourlyTimer } from '../../src/hooks/useHourlyTimer';
import { useHourlyLocationSync } from '../../src/hooks/useHourlyLocationSync';
import { useBookingDetail } from '../../src/hooks/useBookingDetail';
import { useCharges } from '../../src/hooks/useCharges';
import { postEndRide } from '../../src/services/rideService';
import { getErrorMessage } from '../../src/utils/apiErrorParser';
import { Charge } from '../../src/types/charge';
import { HourlyPackage } from '../../src/types/booking';
import { useAlert } from '../../src/context/AlertContext';
import CallButton from '../../src/components/CallButton';
import { useLocationStore } from '../../src/state/useLocationStore';

// ─── Component ────────────────────────────────────────────────────────────────

export default function HourlyRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { showAlert } = useAlert();

  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;
  const bookingVehicleId = params.bookingVehicleId as string | undefined;
  const riderName = params.riderName as string | undefined;
  const customerContact = params.customerContact as string | undefined;

  const [isEndingTrip, setIsEndingTrip] = useState(false);

  // ── Charge modal state ────────────────────────────────────────────────────
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [chargesSummaryVisible, setChargesSummaryVisible] = useState(false);
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);

  // ── Booking detail (hourlyPackage stats) ───────────────────────────────────
  const { ride, isLoading, error } = useBookingDetail(bookingId);

  // ── Charges ───────────────────────────────────────────────────────────────
  const { charges, fetchCharges, saveCharges } = useCharges(bookingVehicleId);

  useEffect(() => {
    if (bookingVehicleId) fetchCharges();
  }, [bookingVehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Location sync — starts on mount, stopped only on end-ride ─────────────
  const { rideStartTime: syncedRideStartTime, sendFinalAndStop } = useHourlyLocationSync(bookingVehicleId);

  // Seed timer immediately from the store (populated during the pre-ride sync in
  // driver-home) so the countdown shows at once without waiting for the first
  // hourly-ride API tick. The synced value takes over as soon as it arrives.
  const storedRideStartTime = useLocationStore((s) => s.rideStartTime);
  const rideStartTime = syncedRideStartTime ?? storedRideStartTime;

  // Pull hourly fields from the detail response
  const detail = ride as (typeof ride & { hourlyPackage?: HourlyPackage }) | null;
  const hourlyPkg = detail?.hourlyPackage;
  const hours = hourlyPkg?.hourlyPackageDetails?.hours ?? null;
  const packageKm = hourlyPkg?.hourlyPackageDetails?.km;
  const traveledKm = hourlyPkg?.hourlyPackageDetails?.hourlyTravelStats?.totalTraveledKm ?? 0;

  // ── Timer — driven by rideStartTime from live location-update API ──────────
  const { formattedTime, isExpired, rawMilliseconds, endTime } = useHourlyTimer({
    rideStartTime,
    hours,
  });

  // ── Charge handlers ───────────────────────────────────────────────────────

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

  // ── End trip ──────────────────────────────────────────────────────────────
  const handleEndTrip = useCallback(async () => {
    if (!bookingVehicleId || isEndingTrip) return;
    setIsEndingTrip(true);
    try {
      // 1. Final location update, then stop all further syncs
      await sendFinalAndStop();
      // 2. End the ride
      await postEndRide(bookingVehicleId);
      router.push({
        pathname: '/(driver)/pending-amount',
        params: {
          rideId: bookingId ?? '',
          bookingVehicleId,
          riderName: riderName ?? ride?.riderName ?? '',
          pickupText: ride?.pickupText ?? '',
          destinationText: '',
          fare: ride?.fare ?? '',
          balanceAmount: String(ride?.balanceAmount ?? ''),
        },
      });
    } catch (err) {
      console.error('[hourly-ride] endTrip failed:', err);
      showAlert({ title: 'Error', message: getErrorMessage(err, 'Failed to end ride. Please try again.'), buttons: [{ text: 'OK', onPress: () => {}, type: 'primary' }] });
      setIsEndingTrip(false);
    }
  }, [bookingVehicleId, bookingId, isEndingTrip, ride, riderName, sendFinalAndStop, router, showAlert]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <ActivityIndicator color="#EDB96D" size="large" />
        <Text style={styles.loadingLabel}>Loading ride details…</Text>
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View style={styles.centeredContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load ride</Text>
        <Text style={styles.errorBody}>{error ?? 'Unknown error'}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(driver)/(tabs)/bookings')}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const chargeBeingEdited = editingChargeIndex !== null ? charges[editingChargeIndex] : undefined;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <HeaderBackButton onPress={() => router.replace('/(driver)/(tabs)/bookings')} />

        <View style={styles.headerLabel}>
          <Text style={styles.headerTitle}>Hourly Rental</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{ride.riderName}</Text>
        </View>

        <CallButton phoneNumber={customerContact || ride?.customerContact} />

        {charges.length > 0 && (
          <Pressable style={styles.chargeBadge} onPress={handleOpenChargesSummary}>
            <Ionicons name="receipt-outline" size={13} color="#EDB96D" />
            <Text style={styles.chargeBadgeText}>{charges.length}</Text>
          </Pressable>
        )}

        {endTime && (
          <View style={styles.endTimeBadge}>
            <Text style={styles.endTimeText}>
              Until{' '}
              {endTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </View>
        )}
      </View>

      {/* ── Scrollable content ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer */}
        <TimeDisplay
          formattedTime={formattedTime}
          isExpired={isExpired}
          rawMilliseconds={rawMilliseconds}
        />

        <View style={styles.gap} />

        {/* Distance */}
        <DistanceDisplay totalTraveledKm={traveledKm} packageKm={packageKm} />

        <View style={styles.gap} />

        {/* Package info chips */}
        <View style={styles.infoRow}>
          {hours != null && (
            <View style={styles.infoChip}>
              <Ionicons name="timer-outline" size={13} color="#EDB96D" />
              <Text style={styles.infoChipText}>{hours} hr package</Text>
            </View>
          )}
          {packageKm != null && (
            <View style={styles.infoChip}>
              <Ionicons name="speedometer-outline" size={13} color="#EDB96D" />
              <Text style={styles.infoChipText}>{packageKm} km included</Text>
            </View>
          )}
          {isExpired && (
            <View style={styles.infoChipWarning}>
              <Ionicons name="warning-outline" size={13} color="#FF9F0A" />
              <Text style={styles.infoChipWarningText}>Extra time running</Text>
            </View>
          )}
        </View>

        <View style={styles.gap} />

        {/* Add extra charge */}
        <Pressable style={styles.addChargeBtn} onPress={handleOpenAddCharge}>
          <Ionicons name="add-circle-outline" size={18} color="#EDB96D" />
          <Text style={styles.addChargeBtnText}>Add Extra Charge</Text>
          {charges.length > 0 && (
            <View style={styles.addChargeBadge}>
              <Text style={styles.addChargeBadgeText}>{charges.length}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.gap} />

        {/* End ride slider */}
        <SlideToConfirm
          text="Slide to End Hourly Ride"
          variant="danger"
          icon="chevron-forward"
          onComplete={handleEndTrip}
          loading={isEndingTrip}
        />
      </ScrollView>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <ChargesSummaryModal
        visible={chargesSummaryVisible}
        charges={charges}
        onDismiss={() => setChargesSummaryVisible(false)}
        onAddCharge={handleOpenAddCharge}
        onEditCharge={handleOpenEditCharge}
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    color: '#EDB96D',
    fontSize: 12,
    marginTop: 1,
  },
  chargeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(237,185,109,0.15)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(237,185,109,0.3)',
  },
  chargeBadgeText: {
    color: '#EDB96D',
    fontSize: 12,
    fontWeight: '700',
  },
  endTimeBadge: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  endTimeText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  gap: {
    height: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(237,185,109,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(237,185,109,0.2)',
  },
  infoChipText: {
    color: '#EDB96D',
    fontSize: 12,
    fontWeight: '600',
  },
  infoChipWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,159,10,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
  },
  infoChipWarningText: {
    color: '#FF9F0A',
    fontSize: 12,
    fontWeight: '600',
  },
  addChargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(237,185,109,0.2)',
  },
  addChargeBtnText: {
    flex: 1,
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
  },
  addChargeBadge: {
    backgroundColor: 'rgba(237,185,109,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addChargeBadgeText: {
    color: '#EDB96D',
    fontSize: 12,
    fontWeight: '700',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
  },
  errorIcon: { fontSize: 48 },
  errorTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  errorBody: { color: '#8E8E93', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDB96D',
  },
  backBtnText: { color: '#EDB96D', fontSize: 15, fontWeight: '600' },
});
