import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking';

interface HighlightedBookingCardProps {
  booking: Booking;
  onGoToPickup?: () => void;
}

export default function HighlightedBookingCard({
  booking,
  onGoToPickup,
}: HighlightedBookingCardProps) {
  return (
    <LinearGradient
      colors={['rgba(229, 181, 102, 0.35)', 'rgba(181, 120, 60, 0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}
    >
      <View style={styles.card}>
        {/* Badge Row */}
        <View style={styles.topRow}>
          <View style={styles.nextRideBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.nextRideText}>NEXT RIDE</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={13} color="#AAAAAA" />
            <Text style={styles.dateTime}>{booking.dateTime}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Category Name */}
        <Text style={styles.categoryName}>{booking.categoryName}</Text>

        {/* Vehicle Info Row */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIconWrap}>
            <Ionicons name="car-sport-outline" size={16} color="#EDB96D" />
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleInfo}>{booking.vehicleInfo}</Text>
            {booking.vehicleNumber ? (
              <View style={styles.vehicleNumberBadge}>
                <Text style={styles.vehicleNumberText}>{booking.vehicleNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Go to Pickup Button */}
        <Pressable onPress={onGoToPickup} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Go to Pickup  →</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 20,
    padding: 1.5,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1A1810',
    borderRadius: 19,
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  nextRideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(237, 185, 109, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.25)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EDB96D',
  },
  nextRideText: {
    color: '#EDB96D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateTime: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    marginBottom: 16,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  vehicleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.2)',
  },
  vehicleDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  vehicleInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  vehicleNumberBadge: {
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.2)',
  },
  vehicleNumberText: {
    color: '#EDB96D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
