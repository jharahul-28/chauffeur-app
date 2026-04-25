import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking';
import { getActionForBooking } from '@/src/utils/bookingNavigationMapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HighlightedBookingCardProps {
  booking: Booking;
  onAction?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFare(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatKm(km: number | null | undefined): string | null {
  if (!km) return null;
  return `${km.toFixed(1)} km`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RouteDisplay({ waypoints }: { waypoints: Booking['waypoints'] }) {
  if (waypoints.length < 2) return null;

  const pickup = waypoints.find((w) => w.type === 'PICKUP');
  const drop = waypoints.find((w) => w.type === 'DROP');
  const stops = waypoints.filter((w) => w.type === 'STOP');

  if (!pickup || !drop) return null;

  const allPoints = [
    { ...pickup, dotStyle: routeStyles.dotPickup, textStyle: routeStyles.address },
    ...stops.map((s) => ({ ...s, dotStyle: routeStyles.dotStop, textStyle: routeStyles.addressStop })),
    { ...drop, dotStyle: routeStyles.dotDrop, textStyle: routeStyles.address },
  ];

  return (
    <View style={routeStyles.container}>
      {allPoints.map((point, index) => {
        const isLast = index === allPoints.length - 1;
        return (
          <View key={index} style={routeStyles.row}>
            {/* Dot + connector column */}
            <View style={routeStyles.dotColumn}>
              <View style={point.dotStyle} />
              {!isLast && <View style={routeStyles.line} />}
            </View>
            {/* Address label */}
            <Text style={[point.textStyle, isLast ? routeStyles.labelLast : routeStyles.labelMiddle]} numberOfLines={1}>
              {point.address}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const routeStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotColumn: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#30D158',
    marginTop: 4,
  },
  dotStop: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9F0A',
    marginTop: 5,
  },
  dotDrop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF453A',
    marginTop: 4,
  },
  line: {
    width: 1.5,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 3,
    marginBottom: 3,
  },
  address: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 13,
    fontWeight: '500',
  },
  addressStop: {
    flex: 1,
    color: '#FF9F0A',
    fontSize: 13,
    fontWeight: '500',
  },
  labelMiddle: {
    lineHeight: 18,
    paddingBottom: 18,
  },
  labelLast: {
    lineHeight: 18,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

const HighlightedBookingCard = memo(function HighlightedBookingCard({
  booking,
  onAction,
}: HighlightedBookingCardProps) {
  const action = getActionForBooking(booking.bookingId, booking.id, booking.status);

  const km = formatKm(booking.kmRide);
  const totalPassengers = booking.passengers
    ? (booking.passengers.adults ?? 0) + (booking.passengers.children ?? 0)
    : null;
  const totalLuggage = booking.luggage
    ? (booking.luggage.small ?? 0) + (booking.luggage.medium ?? 0) + (booking.luggage.large ?? 0)
    : null;

  return (
    <LinearGradient
      colors={['rgba(229, 181, 102, 0.35)', 'rgba(181, 120, 60, 0.15)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBorder}
    >
      <View style={styles.card}>

        {/* ── Header: NEXT RIDE badge + datetime ─────────────────────────── */}
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

        {/* ── Booking reference ──────────────────────────────────────────── */}
        {booking.bookingReference ? (
          <Text style={styles.refText}>{booking.bookingReference}</Text>
        ) : null}

        {/* ── Customer name ──────────────────────────────────────────────── */}
        <View style={styles.customerNameRow}>
          <Ionicons name="person-outline" size={17} color="#AAAAAA" />
          <Text style={styles.customerName} numberOfLines={1}>
            {booking.customerName || '—'}
          </Text>
        </View>

        {/* ── Route (pickup → drop) ─────────────────────────────────────── */}
        <RouteDisplay waypoints={booking.waypoints} />

        {/* ── Fare + trip info row ───────────────────────────────────────── */}
        <View style={styles.metaRow}>
          {/* {booking.totalFare > 0 && (
            <View style={styles.metaChip}>
              <Ionicons name="wallet-outline" size={13} color="#EDB96D" />
              <Text style={styles.metaChipText}>{formatFare(booking.balanceAmount)}</Text>
            </View>
          )} */}
          {/* {km && (
            <View style={styles.metaChip}>
              <Ionicons name="navigate-outline" size={13} color="#64D2FF" />
              <Text style={[styles.metaChipText, { color: '#64D2FF' }]}>{km}</Text>
            </View>
          )} */}
          {/* {booking.tripType ? (
            <View style={styles.metaChip}>
              <Ionicons name="repeat-outline" size={13} color="#8E8E93" />
              <Text style={[styles.metaChipText, { color: '#8E8E93' }]}>
                {booking.tripType.replace('_', ' ')}
              </Text>
            </View>
          ) : null} */}
        </View>

        {/* ── Vehicle row ────────────────────────────────────────────────── */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIconWrap}>
            <Ionicons name="car-sport-outline" size={16} color="#EDB96D" />
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={styles.vehicleInfo} numberOfLines={1}>{booking.vehicleInfo}</Text>
            {booking.vehicleNumber ? (
              <View style={styles.vehicleNumberBadge}>
                <Text style={styles.vehicleNumberText}>{booking.vehicleNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Passenger + luggage chips ──────────────────────────────────── */}
        {(totalPassengers !== null || totalLuggage !== null || booking.beverages) && (
          <View style={styles.paxRow}>
            {totalPassengers !== null && totalPassengers > 0 && (
              <View style={styles.paxChip}>
                <Ionicons name="people-outline" size={13} color="#8E8E93" />
                <Text style={styles.paxChipText}>
                  {totalPassengers} pax
                  {(booking.passengers?.children ?? 0) > 0
                    ? ` (${booking.passengers!.children} child)`
                    : ''}
                </Text>
              </View>
            )}
            {totalLuggage !== null && totalLuggage > 0 && (
              <View style={styles.paxChip}>
                <Ionicons name="bag-outline" size={13} color="#8E8E93" />
                <Text style={styles.paxChipText}>{totalLuggage} bag{totalLuggage !== 1 ? 's' : ''}</Text>
              </View>
            )}
            {booking.beverages && (
              <View style={styles.paxChip}>
                <Ionicons name="cafe-outline" size={13} color="#8E8E93" />
                <Text style={styles.paxChipText}>{booking.beverages}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Special remarks / note ────────────────────────────────────── */}
        {(booking.specialRequest || booking.specialRemarks) ? (
          <View style={styles.remarksRow}>
            <Ionicons name="information-circle-outline" size={14} color="#EDB96D" />
            <Text style={styles.remarksText} numberOfLines={2}>
              {[booking.specialRequest, booking.specialRemarks].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}

        {/* ── CTA button ────────────────────────────────────────────────── */}
        {action ? (
          <Pressable
            onPress={onAction}
            style={styles.buttonWrapper}
            disabled={!onAction}
          >
            <LinearGradient
              colors={['#E5B566', '#B5783C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, !onAction && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{action.buttonText}</Text>
              <Ionicons name="arrow-forward" size={16} color="#000" />
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.completedPill}>
            <Ionicons name="checkmark-circle" size={15} color="#30D158" />
            <Text style={styles.completedPillText}>Ride Completed</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
});

export default HighlightedBookingCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    gap: 0,
  },

  // Header
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
    marginBottom: 12,
  },

  // Booking reference
  refText: {
    color: '#EDB96D',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
  },

  // Customer
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },

  // Fare / meta chips
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  metaChipText: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '600',
  },

  // Vehicle
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
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

  // Passenger / luggage / beverages
  paxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  paxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paxChipText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },

  // Special remarks
  remarksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: 'rgba(237, 185, 109, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.15)',
  },
  remarksText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },

  // CTA
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  completedPillText: {
    color: '#30D158',
    fontSize: 14,
    fontWeight: '600',
  },
});
