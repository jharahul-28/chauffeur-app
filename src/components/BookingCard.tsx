import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '@/src/types/booking';

interface BookingCardProps {
  booking: Booking;
}

// ─── Status badge config ──────────────────────────────────────────────────────

interface BadgeConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot?: boolean;
}

const STATUS_BADGE: Record<BookingStatus, BadgeConfig> = {
  ASSIGNED: {
    label: 'Assigned',
    color: '#EDB96D',
    bg: 'rgba(237, 185, 109, 0.12)',
    border: 'rgba(237, 185, 109, 0.2)',
    dot: true,
  },
  DRIVER_ON_THE_WAY: {
    label: 'On The Way',
    color: '#64D2FF',
    bg: 'rgba(100, 210, 255, 0.12)',
    border: 'rgba(100, 210, 255, 0.2)',
    dot: true,
  },
  ARRIVED: {
    label: 'Arrived',
    color: '#FF9F0A',
    bg: 'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.2)',
    dot: true,
  },
  OTP_VERIFIED: {
    label: 'OTP Verified',
    color: '#30D158',
    bg: 'rgba(48, 209, 88, 0.12)',
    border: 'rgba(48, 209, 88, 0.2)',
    dot: true,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#EDB96D',
    bg: 'rgba(237, 185, 109, 0.12)',
    border: 'rgba(237, 185, 109, 0.2)',
    dot: true,
  },
  WAITING: {
    label: 'Waiting',
    color: '#FF9F0A',
    bg: 'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.2)',
    dot: true,
  },
  COMPLETED: {
    label: 'Completed',
    color: '#30D158',
    bg: 'rgba(48, 209, 88, 0.12)',
    border: 'rgba(48, 209, 88, 0.2)',
    dot: false,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingCard({ booking }: BookingCardProps) {
  const badge = STATUS_BADGE[booking.status] ?? STATUS_BADGE.ASSIGNED;

  return (
    <View style={styles.card}>
      {/* Top Row: DateTime + Status badge */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={13} color="#8E8E93" style={styles.clockIcon} />
          <Text style={styles.dateTime}>{booking.dateTime}</Text>
        </View>

        <View
          style={[
            styles.badge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          {badge.dot && (
            <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
          )}
          <Text style={[styles.badgeText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Customer name — replaces categoryName, same size/weight */}
      <View style={styles.customerNameRow}>
        <Ionicons name="person-outline" size={15} color="#8E8E93" />
        <Text style={styles.categoryName} numberOfLines={1}>
          {booking.customerName || '—'}
        </Text>
      </View>

      {/* Pickup address — directly below customer name */}
      {booking.pickupAddress ? (
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#8E8E93" />
          <Text style={styles.metaText} numberOfLines={1}>
            {booking.pickupAddress}
          </Text>
        </View>
      ) : null}

      {/* Vehicle Info Row */}
      <View style={[styles.vehicleRow, styles.vehicleRowSpaced]}>
        <Ionicons name="car-outline" size={14} color="#8E8E93" />
        <Text style={styles.vehicleInfo} numberOfLines={1}>
          {booking.vehicleInfo}
        </Text>
        {booking.vehicleNumber ? (
          <View style={styles.vehicleNumberBadge}>
            <Text style={styles.vehicleNumberText}>{booking.vehicleNumber}</Text>
          </View>
        ) : null}
      </View>

      {/* Special request — only shown when present */}
      {(booking.specialRequest || booking.beverages) ? (
        <View style={styles.remarksRow}>
          <Ionicons name="information-circle-outline" size={13} color="#8E8E93" />
          <Text style={styles.remarksText} numberOfLines={2}>
            {[booking.specialRequest, booking.beverages].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}

      {/* Legacy special remarks — only shown when present */}
      {booking.specialRemarks ? (
        <View style={styles.remarksRow}>
          <Ionicons name="information-circle-outline" size={13} color="#8E8E93" />
          <Text style={styles.remarksText} numberOfLines={2}>
            {booking.specialRemarks}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clockIcon: {
    marginTop: 1,
  },
  dateTime: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 12,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleRowSpaced: {
    marginTop: 10,
  },
  vehicleInfo: {
    color: '#AAAAAA',
    fontSize: 13,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  metaText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
  },
  remarksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  remarksText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },
  vehicleNumberBadge: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vehicleNumberText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
