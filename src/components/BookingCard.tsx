import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking';

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
  const isCompleted = booking.status === 'COMPLETED';
  const isInProgress = booking.status === 'IN_PROGRESS';

  return (
    <View style={styles.card}>
      {/* Top Row: DateTime + Status badge */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={13} color="#8E8E93" style={styles.clockIcon} />
          <Text style={styles.dateTime}>{booking.dateTime}</Text>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}
        {isInProgress && (
          <View style={styles.inProgressBadge}>
            <View style={styles.inProgressDot} />
            <Text style={styles.inProgressText}>In Progress</Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* Category Name */}
      <Text style={styles.categoryName}>{booking.categoryName}</Text>

      {/* Vehicle Info Row */}
      <View style={styles.vehicleRow}>
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
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.2)',
  },
  inProgressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EDB96D',
  },
  inProgressText: {
    color: '#EDB96D',
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 12,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleInfo: {
    color: '#AAAAAA',
    fontSize: 13,
    flex: 1,
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
