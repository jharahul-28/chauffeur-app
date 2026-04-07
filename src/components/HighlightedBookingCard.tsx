import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Booking } from '@/src/types/booking';

interface HighlightedBookingCardProps {
  booking: Booking;
  onGoToPickup: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function HighlightedBookingCard({
  booking,
  onGoToPickup,
}: HighlightedBookingCardProps) {
  const initials = getInitials(booking.customerName);

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
          <Text style={styles.dateTime}>{booking.dateTime}</Text>
        </View>

        <View style={styles.divider} />

        {/* Customer Row */}
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.customerName}>{booking.customerName}</Text>
        </View>

        {/* Locations */}
        <View style={styles.locationsContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.pickupDot]} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {booking.pickupLocation}
              </Text>
            </View>
          </View>
          <View style={styles.locationConnectorLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.dropDot]} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>DROP</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {booking.dropLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{booking.cost.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Fare</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{booking.expectedTime}</Text>
            <Text style={styles.statLabel}>Est. Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{booking.expectedDistance} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
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
  dateTime: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    marginBottom: 14,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(237, 185, 109, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(237, 185, 109, 0.4)',
  },
  avatarText: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '700',
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  locationsContainer: {
    marginBottom: 16,
    paddingLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationConnectorLine: {
    width: 1.5,
    height: 14,
    backgroundColor: '#3A3A3C',
    marginLeft: 5.5,
    marginVertical: 3,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    flexShrink: 0,
  },
  pickupDot: {
    backgroundColor: '#30D158',
  },
  dropDot: {
    backgroundColor: '#EDB96D',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2C2C2E',
    alignSelf: 'stretch',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
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
