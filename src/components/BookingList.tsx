import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookingCard from './BookingCard';
import HighlightedBookingCard from './HighlightedBookingCard';
import { Booking } from '../types/booking';
import { BookingTab } from '../utils/bookingFilter';
import { getCurrentTabBooking } from '../utils/bookingSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingListProps {
  bookings: Booking[];
  tab: BookingTab;
  /** Called with the selected booking when the driver taps the CTA on current tab */
  onAction?: (booking: Booking) => void;
}

// ─── Empty state config ───────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<
  BookingTab,
  { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }
> = {
  current: {
    icon: 'calendar-outline',
    title: 'No rides today',
    subtitle: 'You have no bookings scheduled for today.',
  },
  upcoming: {
    icon: 'time-outline',
    title: 'No upcoming rides',
    subtitle: 'Future bookings will appear here.',
  },
  past: {
    icon: 'checkmark-circle-outline',
    title: 'No completed rides',
    subtitle: 'Your completed trips will appear here.',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the booking list for a given tab.
 *
 * Current tab  → selects exactly ONE booking via getCurrentTabBooking()
 *                (earliest today booking, or most recent overall) and renders
 *                it as a HighlightedBookingCard with a status-aware CTA.
 * Upcoming/Past → flat list with no highlighted card.
 */
const BookingList = memo(function BookingList({
  bookings,
  tab,
  onAction,
}: BookingListProps) {
  // Memoised — only recomputes when the bookings array reference changes.
  const currentBooking = useMemo(
    () => (tab === 'current' ? getCurrentTabBooking(bookings) : null),
    [tab, bookings],
  );

  if (bookings.length === 0 || (tab === 'current' && !currentBooking)) {
    const { icon, title, subtitle } = EMPTY_CONFIG[tab];
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={icon} size={48} color="#3A3A3C" />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>
    );
  }

  // Current tab: render the single selected booking only
  if (tab === 'current' && currentBooking) {
    return (
      <View>
        <HighlightedBookingCard
          booking={currentBooking}
          onAction={onAction ? () => onAction(currentBooking) : undefined}
        />
      </View>
    );
  }

  // Upcoming tab
  if (tab === 'upcoming') {
    return (
      <View>
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, styles.dotUpcoming]} />
          <Text style={styles.sectionTitle}>Upcoming Rides</Text>
          <View style={styles.sectionLine} />
        </View>
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </View>
    );
  }

  // Past tab
  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={[styles.dot, styles.dotPast]} />
        <Text style={styles.sectionTitle}>Completed Rides</Text>
        <View style={styles.sectionLine} />
      </View>
      {bookings.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </View>
  );
});

export default BookingList;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotUpcoming: {
    backgroundColor: '#EDB96D',
  },
  dotPast: {
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
});
