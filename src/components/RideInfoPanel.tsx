import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

// Extend this interface as features are implemented
export interface RideInfoPanelProps {
  // ── Live ride data (wire up from ride state/context) ──
  // riderName?: string;
  // pickupAddress?: string;
  // dropAddress?: string;
  // distanceKm?: number;
  // estimatedArrivalMin?: number;
  // estimatedFare?: number;
  // rideStatus?: 'idle' | 'incoming' | 'accepted' | 'at_pickup' | 'in_progress' | 'completed';

  // ── Action callbacks ──
  // onAccept?: () => void;
  // onReject?: () => void;
  // onNavigate?: () => void;
  // onReachedPickup?: () => void;
  // onStartTrip?: () => void;
  // onEndTrip?: () => void;

  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

const RideInfoPanel: React.FC<RideInfoPanelProps> = ({ style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Est. Arrival</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statUnit}> m</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statUnit}> km</Text>
          </View>
        </View>
      </View>

      {/* ── Rider info ─────────────────────────────────────────────────────── */}
      <View style={styles.riderRow}>
        {/* Avatar placeholder */}
        <View style={styles.avatar} />

        <View style={styles.riderDetails}>
          <Text style={styles.riderName}>Waiting for a ride...</Text>
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, styles.pickupDot]} />
            <Text style={styles.addressText} numberOfLines={1}>
              Pickup location
            </Text>
          </View>
          <View style={styles.addressRow}>
            <View style={[styles.addressDot, styles.dropDot]} />
            <Text style={styles.addressText} numberOfLines={1}>
              Drop location
            </Text>
          </View>
        </View>

        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>Fare</Text>
          <Text style={styles.fareValue}>₹ —</Text>
        </View>
      </View>

      {/* ── Primary CTA ───────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        // onPress={...}  ← wire up when ride state is ready
      >
        <Text style={styles.primaryButtonText}>View Current Trip</Text>
      </TouchableOpacity>

      {/*
        ── Future action buttons ─────────────────────────────────────────────
        Uncomment and wire up as each ride status is implemented.

        // Incoming ride
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Accept Ride</Text>
          </TouchableOpacity>
        </View>

        // Accepted — en-route to pickup
        <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
          <Text style={styles.navigateButtonText}>Navigate to Pickup</Text>
        </TouchableOpacity>

        // At pickup
        <TouchableOpacity style={styles.primaryButton} onPress={onReachedPickup}>
          <Text style={styles.primaryButtonText}>Reached Pickup</Text>
        </TouchableOpacity>

        // OTP verified — trip started
        <TouchableOpacity style={styles.primaryButton} onPress={onStartTrip}>
          <Text style={styles.primaryButtonText}>Start Trip</Text>
        </TouchableOpacity>

        // In progress
        <TouchableOpacity style={styles.endTripButton} onPress={onEndTrip}>
          <Text style={styles.endTripButtonText}>End Trip</Text>
        </TouchableOpacity>
        ──────────────────────────────────────────────────────────────────────
      */}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  statUnit: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
  },

  // Rider row
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2C2E',
  },
  riderDetails: {
    flex: 1,
    gap: 4,
  },
  riderName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickupDot: {
    backgroundColor: '#30D158',
  },
  dropDot: {
    backgroundColor: '#FF453A',
  },
  addressText: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
  },
  fareBox: {
    alignItems: 'flex-end',
  },
  fareLabel: {
    color: '#8E8E93',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fareValue: {
    color: '#FFC107',
    fontSize: 20,
    fontWeight: '700',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FFC107',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Future button styles (referenced in commented-out section above)
  // actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  // acceptButton: { flex: 1, backgroundColor: '#FFC107', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  // acceptButtonText: { color: '#111', fontSize: 16, fontWeight: '700' },
  // rejectButton: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  // rejectButtonText: { color: '#FF453A', fontSize: 16, fontWeight: '600' },
  // navigateButton: { backgroundColor: '#2C2C2E', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 8 },
  // navigateButtonText: { color: '#0A84FF', fontSize: 16, fontWeight: '600' },
  // endTripButton: { backgroundColor: '#FF453A', borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 8 },
  // endTripButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

export default RideInfoPanel;
