import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler, Alert } from 'react-native';

import AppHeader from '@/src/components/AppHeader';
import BookingTabs from '@/src/components/BookingTabs';
import BookingList from '@/src/components/BookingList';
import { Booking } from '@/src/types/booking';
import { BookingTab } from '@/src/utils/bookingFilter';
import { useBookings } from '@/src/hooks/useBookings';
import { getActionForBooking } from '@/src/utils/bookingNavigationMapper';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const router = useRouter();

  /**
   * showPast is set to '1' only when the user navigates here from the
   * hamburger drawer (RightDrawer). Normal tab-bar entry omits it.
   */
  const { showPast } = useLocalSearchParams<{ showPast?: string }>();
  const showPastTab = showPast === '1';

  const [activeTab, setActiveTab] = useState<BookingTab>('current');
  const { bookings, isLoading, error, refetch } = useBookings(activeTab);
  const isNavigating = useRef(false);

  // If the Past tab becomes hidden (user re-enters via tab bar) while it was
  // active, reset to Current to avoid showing a stale hidden-tab state.
  useEffect(() => {
    if (!showPastTab && activeTab === 'past') {
      setActiveTab('current');
    }
  }, [showPastTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch current tab whenever the screen comes back into focus (e.g. after
  // completing a ride on the map screen).
  useFocusEffect(
    useCallback(() => {
      refetch();

      const onBackPress = () => {
        // If we are on the Home screen (bookings), back press should probably
        // prompt to exit or just do nothing, but definitely NOT go back to Login.
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // prevent default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [refetch])
  );

  const handleBookingAction = (booking: Booking) => {
    if (isNavigating.current) return;
    const action = getActionForBooking(booking.bookingId, booking.id, booking.status, booking.tripType);
    if (!action) return;
    isNavigating.current = true;
    router.push({
      pathname: action.navigationTarget as never,
      params: action.params,
    });
    setTimeout(() => { isNavigating.current = false; }, 1000);
  };

  const handlePastBookingPress = (booking: Booking) => {
    router.push({
      pathname: '/(driver)/past-booking-details' as never,
      params: { bookingId: booking.bookingId },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* Standardised header — VELVET centre, hamburger right */}
      <AppHeader showBack={showPastTab} />

      {/* Tab control — Past tab visible only when showPastTab is true */}
      <BookingTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showPast={showPastTab}
      />

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
            onAction={
              activeTab === 'current'
                ? handleBookingAction
                : activeTab === 'past'
                ? handlePastBookingPress
                : undefined
            }
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
