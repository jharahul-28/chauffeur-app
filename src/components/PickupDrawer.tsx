import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RideStatus, Stoppage } from '../types/ride';
import WaitTimerDisplay from './WaitTimerDisplay';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Collapsed peek height is shared across all states (handle + status + rider + button). */
const COLLAPSED_HEIGHT = 220;

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 320,
  mass: 0.8,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickupDrawerProps {
  riderName: string;
  pickupLocationText: string;
  estimatedTime?: string;
  distance?: string;
  rideStatus: RideStatus;
  /** Required when rideStatus === 'TRIP_STARTED'. */
  destinationText?: string;
  /** Ordered stoppages — shown in trip-started state. */
  stoppages?: Stoppage[];
  /** Called when driver taps "Arrived at Pickup". */
  onArrivedAtPickup: () => void;
  /** Called when driver taps "Enter OTP". */
  onEnterOTP: () => void;
  /** Called when driver taps "End Trip". */
  onEndTrip?: () => void;
  /** Called when driver taps "Wait". */
  onWait?: () => void;
  /** Called when driver taps "Resume". */
  onResumeTrip?: () => void;
  /** Whether the driver is currently in a wait state. */
  isWaiting?: boolean;
  /** Remaining free wait seconds (used for timer display). */
  remainingWaitTime?: number;
  /** Whether free wait time has been exceeded. */
  isFreeTimeExceeded?: boolean;
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

/**
 * Expandable bottom drawer showing ride info.
 *
 * State-driven content:
 *   GOING_TO_PICKUP    → ETA/distance info + "Arrived at Pickup" CTA
 *   ARRIVED_AT_PICKUP  → "Enter OTP" CTA
 *   OTP_PENDING        → "Enter OTP" CTA (modal handled by parent)
 *   TRIP_STARTED       → destination + stoppages list + "End Trip" placeholder
 *
 * Extending for future states:
 *   1. Add the new RideStatus variant to the union in types/ride.ts
 *   2. Add a matching case in the status-label and CTA section below
 */
const PickupDrawer = memo(function PickupDrawer({
  riderName,
  pickupLocationText,
  estimatedTime = '—',
  distance,
  rideStatus,
  destinationText,
  stoppages = [],
  onArrivedAtPickup,
  onEnterOTP,
  onEndTrip,
  onWait,
  onResumeTrip,
  isWaiting = false,
  remainingWaitTime = 180,
  isFreeTimeExceeded = false,
}: PickupDrawerProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);
  const initials = getInitials(riderName);

  const isTripStarted = rideStatus === 'TRIP_STARTED';

  // Dynamic expanded height: larger for trip-started to fit stoppages + wait button + timer
  const expandedHeight = useMemo(() => {
    if (isTripStarted) {
      // Base: handle + status + rider + end-trip btn + wait btn + timer(when active) + divider + trip details
      return 500 + stoppages.length * 38;
    }
    return 370;
  }, [isTripStarted, stoppages.length]);

  const maxTranslateY = expandedHeight - COLLAPSED_HEIGHT;

  // Start fully expanded
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

  // ── Status label config ──────────────────────────────────────────────────
  const STATUS_LABELS: Record<RideStatus, string> = {
    GOING_TO_PICKUP: 'Going to Pickup',
    ARRIVED_AT_PICKUP: 'Arrived at Pickup',
    OTP_PENDING: 'Verifying OTP...',
    TRIP_STARTED: 'Trip in Progress',
    TRIP_COMPLETED: 'Trip Completed',
  };
  const statusLabel = isWaiting ? 'Waiting...' : STATUS_LABELS[rideStatus];

  const statusColor = isWaiting ? '#FF9F0A' : isTripStarted ? '#30D158' : '#EDB96D';

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
          <Text style={styles.riderName}>{riderName}</Text>
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
        /* Trip in Progress: End Trip (gold) + Wait/Resume (secondary) */
        <>
          {/* Wait timer display — only shown while waiting */}
          {isWaiting && (
            <WaitTimerDisplay
              remainingSeconds={remainingWaitTime}
              isFreeTimeExceeded={isFreeTimeExceeded}
            />
          )}

          {/* End Trip */}
          <Pressable style={styles.buttonWrapper} onPress={onEndTrip}>
            <LinearGradient
              colors={['#E5B566', '#B5783C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Ionicons name="flag-outline" size={18} color="#000" style={styles.ctaIcon} />
              <Text style={styles.ctaButtonText}>End Trip</Text>
            </LinearGradient>
          </Pressable>

          {/* Wait / Resume */}
          <Pressable
            style={[styles.buttonWrapper, styles.waitButtonWrapper]}
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
                {isWaiting ? 'Resume Trip' : 'Wait'}
              </Text>
            </View>
          </Pressable>
        </>
      ) : rideStatus === 'GOING_TO_PICKUP' ? (
        <Pressable onPress={onArrivedAtPickup} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Arrived at Pickup</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        /* ARRIVED_AT_PICKUP | OTP_PENDING → Enter OTP */
        <Pressable onPress={onEnterOTP} style={styles.buttonWrapper}>
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
      )}

      {/* ── Below-fold: expanded-only details ──────────────────────────────── */}
      <View style={styles.divider} />

      {isTripStarted ? (
        /* ── Trip started: destination + stoppages ── */
        <View style={styles.tripDetails}>
          {/* Destination */}
          <View style={styles.tripSection}>
            <Text style={styles.tripSectionLabel}>DESTINATION</Text>
            <View style={styles.tripLocationRow}>
              <View style={styles.destDot} />
              <Text style={styles.tripLocationText} numberOfLines={2}>
                {destinationText ?? '—'}
              </Text>
            </View>
          </View>

          {/* Stoppages */}
          {stoppages.length > 0 && (
            <View style={styles.tripSection}>
              <Text style={styles.tripSectionLabel}>STOPS ({stoppages.length})</Text>
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
        </View>
      ) : (
        /* ── Pre-trip: chat/call + ETA ── */
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.iconButton}
            onPress={() => Alert.alert('Chat', 'Coming soon')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#8E8E93" />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={() => Alert.alert('Call', 'Coming soon')}
          >
            <Ionicons name="call-outline" size={20} color="#8E8E93" />
          </Pressable>

          <View style={styles.etaContainer}>
            <Text style={styles.etaLabel}>EST. ARRIVAL</Text>
            <Text style={styles.etaValue}>{estimatedTime}</Text>
            {distance ? (
              <Text style={styles.distanceText}>{distance}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Safe area padding */}
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

  // Handle
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

  // Status row
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

  // Rider row
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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

  // CTA buttons
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 16,
  },

  // Pre-trip: chat/call + ETA
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2E',
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

  // Trip-started: destination + stoppages
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
