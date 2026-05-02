import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
import { themeColors } from '../constants/colors';
import WaitTimerDisplay from './WaitTimerDisplay';
import BottomActionBar from './BottomActionBar';
import WaypointRow from './WaypointRow';
import StopActionButtons from './StopActionButtons';
import { openNextWaypointInGoogleMaps } from '../utils/googleMapsUrlBuilder';
import { LatLng } from '../utils/googleMapsUrlBuilder';
import CallButton from './CallButton';
import { RawWaypoint, sortWaypoints } from '../utils/waypointUtils';

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
  /**
   * Raw waypoints from the booking detail API — used to render the ordered
   * route section in the drawer with arrival status.
   */
  rawWaypoints?: RawWaypoint[];
  /**
   * Index (into sortedWaypoints) of the waypoint the location-update API is
   * currently targeting. -1 when unknown.
   */
  activeWaypointIndex?: number;
  /** True while the arrived-at-stop API call is in-flight. */
  isArrivingAtStop?: boolean;
  /** True while the skip-stop API call is in-flight. */
  isSkippingStop?: boolean;
  /**
   * Resolved waypointId for the active stop — null when mapping failed.
   * Passed to StopActionButtons to disable actions when id is unknown.
   */
  activeStopWaypointId?: number | null;
  onArrivedAtStop?: () => void;
  onSkipStop?: () => void;
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
  rawWaypoints,
  activeWaypointIndex = -1,
  isArrivingAtStop = false,
  isSkippingStop = false,
  activeStopWaypointId = null,
  onArrivedAtStop,
  onSkipStop,
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

  const mapsTarget: LatLng | null = nextWaypointCoord ?? pickupCoord ?? null;

  const hasSpecialRequest =
    (specialRequest?.beverages?.length ?? 0) > 0 || !!specialRequest?.other;

  // Sort rawWaypoints by sequence for ordered route display
  const sortedWaypoints = useMemo(() => {
    if (!rawWaypoints || rawWaypoints.length === 0) return [];
    return sortWaypoints(rawWaypoints);
  }, [rawWaypoints]);

  // Dynamic expanded height: accounts for waypoints and special request lines
  const expandedHeight = useMemo(() => {
    const waypointCount = sortedWaypoints.length || (stoppages.length + 2);
    // Extra height when stop action buttons are visible (Arrived / Skip / Map row)
    const hasActiveStop =
      isTripStarted &&
      activeWaypointIndex >= 0 &&
      sortedWaypoints[activeWaypointIndex]?.waypointType === 'STOP';
    const stopActionHeight = hasActiveStop ? 52 : 0;
    if (isTripStarted) {
      return 460 + stoppages.length * 38 + stopActionHeight;
    }
    return 340 + (hasSpecialRequest ? 56 : 0) + Math.max(0, waypointCount - 3) * 38;
  }, [isTripStarted, stoppages.length, hasSpecialRequest, sortedWaypoints, activeWaypointIndex]);

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
  const statusColor = isWaiting
    ? themeColors.warning
    : isTripStarted
    ? themeColors.success
    : themeColors.goldAccent;

  return (
    <Animated.View
      style={[
        styles.container,
        { height: expandedHeight + bottomPad },
        drawerAnimStyle,
      ]}
    >
      {/* ── Drag handle ──────────────────────────────────────────────────────── */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>
      </GestureDetector>

      {/* ── Status label ─────────────────────────────────────────────────────── */}
      <View style={styles.statusRow}>
        <View style={[styles.statusPulseDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* ── HEADER ROW: Customer name (left) + Call icon (right) ─────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.riderName} numberOfLines={1}>{riderName}</Text>
        <CallButton phoneNumber={customerContact} />
      </View>

      {/* ── ROUTE DETAILS SECTION ────────────────────────────────────────────── */}
      {sortedWaypoints.length > 0 ? (
        <View style={styles.routeSection}>
          {sortedWaypoints.map((wp, index) => {
            const isActive = index === activeWaypointIndex;
            const showActions =
              isActive && wp.waypointType === 'STOP' && isTripStarted;
            const showMaps =
              isActive &&
              isTripStarted &&
              (wp.waypointType === 'STOP' || wp.waypointType === 'DROP');
            return (
              <WaypointRow
                key={wp.id}
                type={wp.waypointType}
                address={wp.address}
                sequence={wp.waypointSequence}
                arrivedAt={wp.arrivedAt}
                isLast={index === sortedWaypoints.length - 1}
                isActive={isActive}
                onOpenMaps={
                  showMaps
                    ? () => openNextWaypointInGoogleMaps({ latitude: wp.latitude, longitude: wp.longitude })
                    : undefined
                }
                actionSlot={
                  showActions ? (
                    <StopActionButtons
                      waypointId={activeStopWaypointId}
                      isArriving={isArrivingAtStop}
                      isSkipping={isSkippingStop}
                      onArrived={onArrivedAtStop ?? (() => {})}
                      onSkip={onSkipStop ?? (() => {})}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </View>
      ) : (
        /* Fallback: no rawWaypoints provided — render from text fields */
        <View style={styles.routeSection}>
          <WaypointRow
            type="PICKUP"
            address={pickupLocationText}
            sequence={1}
            arrivedAt={
              rideStatus !== RideStatusEnum.GOING_TO_PICKUP ? 'arrived' : null
            }
            isLast={stoppages.length === 0 && !destinationText}
          />
          {stoppages.map((stop, index) => (
            <WaypointRow
              key={stop.id}
              type="STOP"
              address={stop.label ?? `Stop ${index + 1}`}
              sequence={index + 2}
              arrivedAt={null}
              isLast={index === stoppages.length - 1 && !destinationText}
            />
          ))}
          {destinationText && (
            <WaypointRow
              type="DROP"
              address={destinationText}
              sequence={stoppages.length + 2}
              arrivedAt={null}
              isLast
            />
          )}
        </View>
      )}

      {/* ── BOOKING REFERENCE — below route section ──────────────────────────── */}
      {bookingReference && (
        <View style={styles.bookingRefRow}>
          <Ionicons name="document-text-outline" size={12} color="#8E8E93" />
          <Text style={styles.bookingRef}>{bookingReference}</Text>
        </View>
      )}

      {/* ── WAIT TIMER — visible whenever waiting ────────────────────────────── */}
      {isWaiting && (
        <WaitTimerDisplay
          elapsedSeconds={elapsedWaitTime}
          isFreeTimeExceeded={isFreeTimeExceeded}
        />
      )}

      {/* ── PRIMARY ACTION (bottom action bar) ───────────────────────────────── */}
      {isTripStarted ? (
        <BottomActionBar
          slideText="Slide to End Trip"
          slideVariant="danger"
          onSlideComplete={onEndTrip ?? (() => {})}
          slideLoading={isEndingTrip}
          slideDisabled={isEndingTrip}
          showUtilRow
          isWaiting={isWaiting}
          onWaitResume={isWaiting ? onResumeTrip : onWait}
          chargeCount={chargeCount}
          onOpenCharges={onOpenChargesSummary}
        />
      ) : rideStatus === RideStatusEnum.GOING_TO_PICKUP ? (
        <View style={styles.ctaRow}>
          <View style={styles.ctaFlex}>
            <BottomActionBar
              slideText="Arrived at Pickup"
              slideVariant="primary"
              onSlideComplete={onArrivedAtPickup}
              slideLoading={isArrivingAtPickup}
              slideDisabled={isArrivingAtPickup}
              showWaitButton={false}
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

      {/* ── Below-fold: expanded-only details ────────────────────────────────── */}
      <View style={styles.divider} />

      {!isTripStarted && (
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

          <View style={styles.etaContainer}>
            <Text style={styles.etaLabel}>EST. ARRIVAL</Text>
            <Text style={styles.etaValue}>{estimatedTime}</Text>
            {distance ? (
              <Text style={styles.distanceText}>{distance}</Text>
            ) : null}
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
    marginBottom: 12,
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

  // ── Header row ─────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 185, 109, 0.3)',
    flexShrink: 0,
  },
  avatarText: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '700',
  },
  riderName: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  // ── Route section ──────────────────────────────────────────────────────────
  routeSection: {
    marginBottom: 10,
  },

  // ── Booking reference ──────────────────────────────────────────────────────
  bookingRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  bookingRef: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── CTA rows ───────────────────────────────────────────────────────────────
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginTop: 14,
    marginBottom: 14,
  },

  // ── Pre-trip special request ───────────────────────────────────────────────
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

  // ── Pre-trip special remarks ───────────────────────────────────────────────
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

  // ── ETA ───────────────────────────────────────────────────────────────────
  etaContainer: {
    alignItems: 'flex-start',
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
});
