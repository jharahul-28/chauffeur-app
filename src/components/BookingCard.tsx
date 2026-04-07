import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Booking } from '@/src/types/booking';

interface BookingCardProps {
  booking: Booking;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BookingCard({ booking }: BookingCardProps) {
  const initials = getInitials(booking.customerName);
  const isCompleted = booking.status === 'COMPLETED';

  return (
    <View style={styles.card}>
      {/* Top Row: DateTime + Cost */}
      <View style={styles.topRow}>
        <Text style={styles.dateTime}>{booking.dateTime}</Text>
        <Text style={styles.cost}>₹{booking.cost.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />

      {/* Customer Row */}
      <View style={styles.customerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.customerName} numberOfLines={1}>
          {booking.customerName}
        </Text>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}
      </View>

      {/* Locations */}
      <View style={styles.locationsContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.pickupDot]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.pickupLocation}
          </Text>
        </View>
        <View style={styles.locationConnector} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.dropDot]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.dropLocation}
          </Text>
        </View>
      </View>

      {/* Info Pills */}
      <View style={styles.infoRow}>
        <View style={styles.infoPill}>
          <Text style={styles.infoPillText}>⏱ {booking.expectedTime}</Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoPillText}>📍 {booking.expectedDistance} km</Text>
        </View>
      </View>
    </View>
  );
}

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
  dateTime: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  cost: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.25)',
  },
  avatarText: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '700',
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  completedBadgeText: {
    color: '#30D158',
    fontSize: 11,
    fontWeight: '600',
  },
  locationsContainer: {
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationConnector: {
    width: 1,
    height: 10,
    backgroundColor: '#3A3A3C',
    marginLeft: 5,
    marginVertical: 2,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  pickupDot: {
    backgroundColor: '#30D158',
  },
  dropDot: {
    backgroundColor: '#EDB96D',
  },
  locationText: {
    color: '#AAAAAA',
    fontSize: 13,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoPill: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  infoPillText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
});
