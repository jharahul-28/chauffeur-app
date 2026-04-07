import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import HighlightedBookingCard from '@/src/components/HighlightedBookingCard';
import BookingCard from '@/src/components/BookingCard';
import { mockBookings } from '@/src/data/mockBookings';
import { Booking } from '@/src/types/booking';

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const upcomingRides: Booking[] = mockBookings.filter((b) => b.status === 'UPCOMING');
  const completedRides: Booking[] = mockBookings.filter((b) => b.status === 'COMPLETED');

  const featuredRide: Booking | undefined = upcomingRides[0];
  const remainingUpcoming: Booking[] = upcomingRides.slice(1);

  const handleGoToPickup = () => {
    if (!featuredRide) return;
    router.push({
      pathname: '/(driver)/driver-home',
      params: {
        riderName: featuredRide.customerName,
        pickupText: featuredRide.pickupLocation,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Svg height="26" width="110" viewBox="0 0 110 26">
          <Defs>
            <SvgGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#EDB96D" />
              <Stop offset="100%" stopColor="#B5783C" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#goldGrad)"
            fontSize="18"
            fontWeight="600"
            x="0"
            y="20"
            letterSpacing="3"
          >
            VELVET
          </SvgText>
        </Svg>
        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured: Most Recent Upcoming Ride */}
        {featuredRide !== undefined && (
          <HighlightedBookingCard
            booking={featuredRide}
            onGoToPickup={handleGoToPickup}
          />
        )}

        {/* Remaining Upcoming Rides */}
        {remainingUpcoming.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, styles.upcomingDot]} />
              <Text style={styles.sectionTitle}>Upcoming Rides</Text>
              <View style={styles.sectionLine} />
            </View>
            {remainingUpcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </>
        )}

        {/* Completed Rides */}
        {completedRides.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.sectionHeaderTop]}>
              <View style={[styles.sectionDot, styles.completedDot]} />
              <Text style={styles.sectionTitle}>Completed Rides</Text>
              <View style={styles.sectionLine} />
            </View>
            {completedRides.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeaderTop: {
    marginTop: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  upcomingDot: {
    backgroundColor: '#EDB96D',
  },
  completedDot: {
    backgroundColor: '#30D158',
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2C2C2E',
  },
  bottomPadding: {
    height: 20,
  },
});
