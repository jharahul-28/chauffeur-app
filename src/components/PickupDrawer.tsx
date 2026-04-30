import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RideStatus, Stoppage, RideStatusEnum } from '../types/ride';
import { themeColors, bgColors } from '../constants/colors';
import WaitTimerDisplay from './WaitTimerDisplay';
import ChargeIconButton from './ChargeIconButton';
import SlideToConfirm from './SlideToConfirm';
import { openNextWaypointInGoogleMaps } from '../utils/googleMapsUrlBuilder';
import { LatLng } from '../utils/googleMapsUrlBuilder';
import CallButton from './CallButton';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLAPSED_HEIGHT = 220;

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 320,
  mass: 0.8,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickupDrawerProps {
  riderName: string;
  bookingReference?: string;
  customerContact?: string;
  pickupLocationText: string;
  estimatedTime?: string;
  distance?: string;
  /** Kept for API compatibility — no longer rendered in the UI. */
  fare?: string;
  rideStatus: RideStatus;
  destinationText?: string;
  stoppages?: Stoppage[];
  /** Number of extra charges added — shown as badge on the icon button. */
  chargeCount?: number;
  /** Optional customer instructions shown in the pre-trip details panel. */
  specialRemarks?: string;
  /** Structured special request (beverages + note) shown below specialRemarks. */
  specialRequest?: {
    beverages?: string[];
    other?: string;
  };
  /**
   * Next waypoint coordinate from the location-update API response.
   * Always used as the Google Maps target when available.
   */
  nextWaypointCoord?: LatLng | null;
  /**
   * Pickup coordinate from the booking — used as the initial Maps target before
   * the first location-update tick arrives (GOING_TO_PICKUP state).
   */
  pickupCoord?: LatLng | null;
  onArrivedAtPickup: () => void;
  onEnterOTP: () => void;
  onEndTrip?: () => void;
  onWait?: () => void;
  onResumeTrip?: () => void;
  /** Opens the ChargesSummaryModal (list + add + edit). */
  onOpenChargesSummary?: () => void;
  isWaiting?: boolean;
  /** Current wait timer seconds — starts from backend totalWaitingSeconds and increments each second. */
  elapsedWaitTime?: number;
  isFreeTimeExceeded?: boolean;
  /** True while trip completion API call is in-flight. */
  isEndingTrip?: boolean;
  /** True while the arrived-at-pickup API call is in-flight. */
  isArrivingAtPickup?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

const PickupDrawer = memo(function PickupDrawer({
  riderName,
  bookingReference,
  customerContact,
  pickupLocationText,
  estimatedTime = '—',
  distance,
  rideStatus,
  destinationText,
  stoppages = [],
  chargeCount = 0,
  specialRemarks,
  specialRequest,
  nextWaypointCoord,
  pickupCoord,
  onArrivedAtPickup,
  onEnterOTP,
  onEndTrip,
  onWait,
  onResumeTrip,
  onOpenChargesSummary,
  isWaiting = false,
  elapsedWaitTime = 0,
  isFreeTimeExceeded = false,
  isEndingTrip = false,
  isArrivingAtPickup = false,
}: PickupDrawerProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const initials = getInitials(riderName);

  const isTripStarted = rideStatus === RideStatusEnum.TRIP_STARTED;

  // Use live next-waypoint when available; fall back to pickup coord for pre-trip
  const mapsTarget: LatLng | null = nextWaypointCoord ?? pickupCoord ?? null;

  const hasSpecialRequest =
    (specialRequest?.beverages?.length ?? 0) > 0 || !!specialRequest?.other;

  // Dynamic expanded height: accounts for stoppages and special request lines
  const expandedHeight = useMemo(() => {
    if (isTripStarted) {
      return 460 + stoppages.length * 38;
    }
    return 340 + (hasSpecialRequest ? 56 : 0);
  }, [isTripStarted, stoppages.length, hasSpecialRequest]);

  const maxTranslateY = expandedHeight - COLLAPSED_HEIGHT;

  const translateY = useSharedValue(0);
  const gestureStartY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      gestureStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const next = gestureStartY.value + event.translationY;
      translateY.value = Math.max(0, Math.min(maxTranslateY, next));
    })
    .onEnd((event) => {
      const fastDown = event.velocityY > 500;
      const fastUp = event.velocityY < -500;
      const pastMidpoint = translateY.value > maxTranslateY / 2;
      const shouldCollapse = fastDown || (!fastUp && pastMidpoint);
      translateY.value = withSpring(
        shouldCollapse ? maxTranslateY : 0,
        SPRING_CONFIG,
      );
    });

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ── Status label ────────────────────────────────────────────────────────────
  const STATUS_LABELS: Record<RideStatus, string> = {
    [RideStatusEnum.GOING_TO_PICKUP]: 'Going to Pickup',
    [RideStatusEnum.ARRIVED_AT_PICKUP]: 'Arrived at Pickup',
    [RideStatusEnum.OTP_PENDING]: 'Verifying OTP...',
    [RideStatusEnum.TRIP_STARTED]: 'Trip in Progress',
    [RideStatusEnum.TRIP_COMPLETED]: 'Trip Completed',
  };
  const statusLabel = isWaiting ? 'Waiting...' : STATUS_LABELS[rideStatus];
  const statusColor = isWaiting ? themeColors.warning : isTripStarted ? themeColors.success : themeColors.goldAccent;

  return (
    <Animated.View
      style={[
        styles.container,
        { height: expandedHeight + bottomPad },
        drawerAnimStyle,
      ]}
    >
      {/* ── Drag handle ────────────────────────────────────────────────────── */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      {/* ── Status label ───────────────────────────────────────────────────── */}
      <View style={styles.statusRow}>
        <View style={[styles.statusPulseDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* ── Rider row ──────────────────────────────────────────────────────── */}
      <View style={styles.riderRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.riderInfo}>
          <View style={styles.riderNameRow}>
            <Text style={styles.riderName}>{riderName}</Text>
            {bookingReference ? (
              <Text style={styles.bookingRef}>{bookingReference}</Text>
            ) : null}
          </View>
          <View style={styles.addressRow}>
            <View style={styles.pickupDot} />
            <Text style={styles.addressText} numberOfLines={1}>
              {pickupLocationText}
            </Text>
          </View>
        </View>
      </View>

      {/* ── CTA button ─────────────────────────────────────────────────────── */}
      {isTripStarted ? (
        <>
          {/* Wait timer — visible only while waiting */}
          {isWaiting && (
            <WaitTimerDisplay
              elapsedSeconds={elapsedWaitTime}
              isFreeTimeExceeded={isFreeTimeExceeded}
            />
          )}

          {/* End Trip */}
          <View style={styles.buttonWrapper}>
            <SlideToConfirm
              text="Slide to End Trip"
              onComplete={onEndTrip ?? (() => { })}
              loading={isEndingTrip}
              disabled={isEndingTrip}
              variant="danger"
              accessibilityLabel="Slide to end the trip"
            />
          </View>

          {/* Wait / Resume  +  Charges icon  +  Google Maps — side by side */}
          <View style={[styles.secondaryRow, styles.waitButtonWrapper]}>
            <Pressable
              style={styles.secondaryButtonFlex}
              onPress={isWaiting ? onResumeTrip : onWait}
            >
              <View style={[styles.waitButton, isWaiting && styles.waitButtonActive]}>
                <Ionicons
                  name={isWaiting ? 'play-outline' : 'pause-outline'}
                  size={16}
                  color={isWaiting ? '#FF9F0A' : '#8E8E93'}
                  style={styles.ctaIcon}
                />
                <Text style={[styles.waitButtonText, isWaiting && styles.waitButtonTextActive]}>
                  {isWaiting ? 'Resume' : 'Wait'}
                </Text>
              </View>
            </Pressable>

            <ChargeIconButton count={chargeCount} onPress={onOpenChargesSummary ?? (() => { })} />

            <CallButton phoneNumber={customerContact} />

            {mapsTarget && (
              <Pressable
                style={styles.mapsIconButton}
                onPress={() => openNextWaypointInGoogleMaps(mapsTarget)}
                accessibilityRole="button"
                accessibilityLabel="Open next destination in Google Maps"
              >
                <Ionicons name="navigate" size={18} color="#4285F4" />
              </Pressable>
            )}
          </View>
        </>
      ) : rideStatus === RideStatusEnum.GOING_TO_PICKUP ? (
        <View style={styles.ctaRow}>
          <View style={styles.ctaFlex}>
            <SlideToConfirm
              text="Arrived at PickUp"
              onComplete={onArrivedAtPickup}
              loading={isArrivingAtPickup}
              disabled={isArrivingAtPickup}
              variant="primary"
              accessibilityLabel="Slide to confirm arrival at pickup"
            />
          </View>
          {mapsTarget && (
            <Pressable
              style={styles.mapsIconButton}
              onPress={() => openNextWaypointInGoogleMaps(mapsTarget)}
              accessibilityRole="button"
              accessibilityLabel="Open pickup location in Google Maps"
            >
              <Ionicons name="navigate" size={18} color="#4285F4" />
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.ctaRow}>
          <Pressable onPress={onEnterOTP} style={styles.ctaFlex}>
            <LinearGradient
              colors={['#E5B566', '#B5783C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Ionicons name="keypad-outline" size={18} color="#000" style={styles.ctaIcon} />
              <Text style={styles.ctaButtonText}>Enter OTP</Text>
            </LinearGradient>
          </Pressable>
          {mapsTarget && (
            <Pressable
              style={styles.mapsIconButton}
              onPress={() => openNextWaypointInGoogleMaps(mapsTarget)}
              accessibilityRole="button"
              accessibilityLabel="Open destination in Google Maps"
            >
              <Ionicons name="navigate" size={18} color="#4285F4" />
            </Pressable>
          )}
        </View>
      )}

      {/* ── Below-fold: expanded-only details ──────────────────────────────── */}
      <View style={styles.divider} />

      {isTripStarted ? (
        /* ── Trip started: pending stops first, then final destination ── */
        <View style={styles.tripDetails}>
          {/* Pending Stops — shown before destination per UX spec */}
          {stoppages.length > 0 && (
            <View style={styles.tripSection}>
              <Text style={styles.tripSectionLabel}>PENDING STOPS ({stoppages.length})</Text>
              {stoppages.map((stop, index) => (
                <View key={stop.id} style={styles.stopRow}>
                  <View style={styles.stopNumberBadge}>
                    <Text style={styles.stopNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stopLabel} numberOfLines={1}>
                    {stop.label ?? `Stop ${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Final Destination */}
          <View style={styles.tripSection}>
            <Text style={styles.tripSectionLabel}>FINAL DESTINATION</Text>
            <View style={styles.tripLocationRow}>
              <View style={styles.destDot} />
              <Text style={styles.tripLocationText} numberOfLines={2}>
                {destinationText ?? '—'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* ── Pre-trip: special remarks + special request + call + ETA ── */
        <>
          {specialRemarks ? (
            <View style={styles.remarksBox}>
              <Ionicons name="information-circle-outline" size={14} color="#EDB96D" />
              <Text style={styles.remarksText} numberOfLines={3}>
                {specialRemarks}
              </Text>
            </View>
          ) : null}

          {hasSpecialRequest && (
            <View style={styles.specialRequestBox}>
              <Text style={styles.specialRequestTitle}>Special Request</Text>
              {(specialRequest?.beverages?.length ?? 0) > 0 && (
                <Text style={styles.specialRequestLine}>
                  {'· Beverages: '}
                  {specialRequest!.beverages!.join(', ')}
                </Text>
              )}
              {specialRequest?.other ? (
                <Text style={styles.specialRequestLine}>
                  {'· Note: '}
                  {specialRequest.other}
                </Text>
              ) : null}
            </View>
          )}

          <View style={styles.actionsRow}>
            <CallButton phoneNumber={customerContact} />

            <View style={styles.etaContainer}>
              <Text style={styles.etaLabel}>EST. ARRIVAL</Text>
              <Text style={styles.etaValue}>{estimatedTime}</Text>
              {distance ? (
                <Text style={styles.distanceText}>{distance}</Text>
              ) : null}
            </View>
          </View>
        </>
      )}

      <View style={{ height: bottomPad }} />
    </Animated.View>
  );
});

export default PickupDrawer;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  handleArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  bookingRef: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 185, 109, 0.3)',
  },
  avatarText: {
    color: '#EDB96D',
    fontSize: 17,
    fontWeight: '700',
  },
  riderInfo: {
    flex: 1,
    gap: 5,
  },
  riderName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pickupDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#30D158',
    flexShrink: 0,
  },
  addressText: {
    color: '#8E8E93',
    fontSize: 13,
    flex: 1,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  // Row that holds a CTA + optional maps icon button side-by-side
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  ctaFlex: {
    flex: 1,
  },
  ctaButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ctaIcon: {
    marginRight: 2,
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  waitButtonWrapper: {
    marginTop: -8,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButtonFlex: {
    flex: 1,
  },
  waitButton: {
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  waitButtonActive: {
    backgroundColor: 'rgba(255, 159, 10, 0.10)',
    borderColor: 'rgba(255, 159, 10, 0.35)',
  },
  waitButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  waitButtonTextActive: {
    color: '#FF9F0A',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 16,
  },
  // Pre-trip: structured special request
  specialRequestBox: {
    backgroundColor: 'rgba(100, 210, 255, 0.07)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.18)',
    gap: 3,
  },
  specialRequestTitle: {
    color: '#64D2FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  specialRequestLine: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },

  // Pre-trip: special remarks
  remarksBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(237, 185, 109, 0.07)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.18)',
  },
  remarksText: {
    color: '#CCCCCC',
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },

  // Pre-trip: call + ETA
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapsIconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  etaLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  etaValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  distanceText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },

  // Trip started: destination + stoppages
  tripDetails: {
    gap: 16,
  },
  tripSection: {
    gap: 8,
  },
  tripSectionLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  tripLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF453A',
    marginTop: 3,
    flexShrink: 0,
  },
  tripLocationText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 21,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 159, 10, 0.18)',
    borderWidth: 1.5,
    borderColor: '#FF9F0A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stopNumber: {
    color: '#FF9F0A',
    fontSize: 11,
    fontWeight: '700',
  },
  stopLabel: {
    color: '#D1D1D6',
    fontSize: 14,
    flex: 1,
  },
});
