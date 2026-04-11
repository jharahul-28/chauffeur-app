import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import BookingTabs from '@/src/components/BookingTabs';
import BookingList from '@/src/components/BookingList';
import { Booking } from '@/src/types/booking';
import { BookingTab } from '@/src/utils/bookingFilter';
import { useBookings } from '@/src/hooks/useBookings';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<BookingTab>('current');

  const { bookings, isLoading, error, refetch } = useBookings(activeTab);

  const handleGoToPickup = (booking: Booking) => {
    router.push({
      pathname: '/(driver)/driver-home',
      params: { bookingId: booking.id },
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

      {/* Tab control */}
      <BookingTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Loading state */}
      {isLoading && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#EDB96D" />
        </View>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Booking list — pull-to-refresh triggers a cache-busting refetch */}
      {!isLoading && !error && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor="#EDB96D"
            />
          }
        >
          <BookingList
            bookings={bookings}
            tab={activeTab}
            onGoToPickup={activeTab === 'current' ? handleGoToPickup : undefined}
          />
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 14,
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
    paddingTop: 4,
  },
  bottomPadding: {
    height: 20,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDB96D',
  },
  retryText: {
    color: '#EDB96D',
    fontSize: 14,
    fontWeight: '600',
  },
});
