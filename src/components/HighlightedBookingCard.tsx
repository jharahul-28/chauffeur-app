import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '@/src/types/booking';
import { getActionForBooking } from '@/src/utils/bookingNavigationMapper';

interface HighlightedBookingCardProps {
  booking: Booking;
  /** Called when the driver taps the CTA button. Parent handles navigation. */
  onAction?: () => void;
}

export default function HighlightedBookingCard({
  booking,
  onAction,
}: HighlightedBookingCardProps) {
  const action = getActionForBooking(booking.bookingId, booking.id, booking.status);

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

        {/* Customer name + booking reference */}
        <View style={styles.customerNameRow}>
          <Ionicons name="person-outline" size={17} color="#AAAAAA" />
          <Text style={styles.categoryName} numberOfLines={1}>
            {booking.customerName || '—'}
          </Text>
          {booking.bookingReference ? (
            <View style={styles.refBadge}>
              <Text style={styles.refText}>{booking.bookingReference}</Text>
            </View>
          ) : null}
        </View>

        {/* Pickup address — directly below customer name */}
        {booking.pickupAddress ? (
          <View style={styles.pickupRow}>
            <Ionicons name="location-outline" size={13} color="#AAAAAA" />
            <Text style={styles.pickupText} numberOfLines={1}>
              {booking.pickupAddress}
            </Text>
          </View>
        ) : null}

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

        {/* Special request (structured) — only shown when present */}
        {(booking.specialRequest || booking.beverages) ? (
          <View style={styles.remarksRow}>
            <Ionicons name="information-circle-outline" size={14} color="#EDB96D" />
            <Text style={styles.remarksText} numberOfLines={2}>
              {[booking.specialRequest, booking.beverages].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}

        {/* Legacy special remarks — only shown when present */}
        {booking.specialRemarks ? (
          <View style={styles.remarksRow}>
            <Ionicons name="information-circle-outline" size={14} color="#EDB96D" />
            <Text style={styles.remarksText} numberOfLines={2}>
              {booking.specialRemarks}
            </Text>
          </View>
        ) : null}

        {/* CTA Button — hidden for COMPLETED, disabled when no handler */}
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
              <Text style={styles.buttonText}>{action.buttonText}  →</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          // COMPLETED state — show a muted pill instead of an active button
          <View style={styles.completedPill}>
            <Ionicons name="checkmark-circle" size={15} color="#30D158" />
            <Text style={styles.completedPillText}>Ride Completed</Text>
          </View>
        )}
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
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  refBadge: {
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.2)',
  },
  refText: {
    color: '#EDB96D',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },
  pickupText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
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
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
