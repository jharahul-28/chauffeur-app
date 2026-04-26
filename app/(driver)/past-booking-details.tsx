import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useRawBookingDetail } from '../../src/hooks/useRawBookingDetail';
import BookingInfoSection from '../../src/components/BookingInfoSection';
import WaypointList from '../../src/components/WaypointList';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '—';
  // "HH:mm:ss" → readable
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PastBookingDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const { data, isLoading, error } = useRawBookingDetail(bookingId);

  // Memoised beverages string — only recomputes when data changes
  const beverageText = useMemo(() => {
    const list = data?.metadata?.specialRequest?.beverages;
    return list && list.length > 0 ? list.join(', ') : null;
  }, [data]);

  const hasSpecialRequest =
    !!beverageText || !!data?.metadata?.specialRequest?.other;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <ActivityIndicator size="large" color="#EDB96D" />
        <Text style={styles.loadingText}>Loading booking…</Text>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#111111" />
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorBody}>{error ?? 'Booking not found.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Past Booking</Text>
          {data.bookingReference ? (
            <Text style={styles.headerSub}>{data.bookingReference}</Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Booking Info */}
        <BookingInfoSection
          title="Booking Info"
          rows={[
            { label: 'Reference', value: data.bookingReference },
            { label: 'Booking Date', value: formatDate(data.bookingConfirmationDate) },
            { label: 'Ride Date', value: formatDate(data.rideDate) },
            { label: 'Pickup Time', value: formatTime(data.pickupTime) },
            { label: 'Status', value: data.status },
          ]}
        />

        {/* 2. Customer Info */}
        <BookingInfoSection
          title="Customer Info"
          rows={[
            { label: 'Name', value: data.metadata?.customerName },
            { label: 'Type', value: data.metadata?.customerType },
            { label: 'Remarks', value: data.metadata?.specialRemarks },
          ]}
        />

        {/* 3. Trip Info */}
        <BookingInfoSection
          title="Trip Info"
          rows={[
            { label: 'Trip Type', value: data.tripType },
            { label: 'Distance', value: data.kmRide != null ? `${data.kmRide} km` : null },
          ]}
        />

        {/* 4. Route — sorted waypoints with Pickup / Stop / Drop labels */}
        {(data.waypoints?.length ?? 0) > 0 && (
          <WaypointList waypoints={data.waypoints} />
        )}

        {/* 5. Special Request — hidden when empty */}
        {hasSpecialRequest && (
          <View style={styles.specialRequestSection}>
            <Text style={styles.specialRequestTitle}>Special Request</Text>
            {beverageText ? (
              <Text style={styles.specialRequestLine}>
                {'· Beverages: '}
                {beverageText}
              </Text>
            ) : null}
            {data.metadata?.specialRequest?.other ? (
              <Text style={styles.specialRequestLine}>
                {'· Note: '}
                {data.metadata.specialRequest.other}
              </Text>
            ) : null}
          </View>
        )}

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    color: '#EDB96D',
    fontSize: 12,
    marginTop: 1,
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Special request section
  specialRequestSection: {
    backgroundColor: 'rgba(100, 210, 255, 0.07)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(100, 210, 255, 0.18)',
    gap: 4,
  },
  specialRequestTitle: {
    color: '#64D2FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  specialRequestLine: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },
  // Loading / error states
  centered: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 4,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  errorBody: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDB96D',
  },
  backBtnText: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
  },
});
