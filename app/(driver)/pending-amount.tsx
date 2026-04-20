import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ChargeModal from '../../src/components/ChargeModal';
import { BookingBilling } from '../../src/types/bookingBilling';
import { ExtraCharge } from '../../src/types/charge';
import { getBookingDetails, submitCharges } from '../../src/services/bookingApi';
import { aggregateCharges } from '../../src/utils/chargeAggregator';

// ─── Screen params ────────────────────────────────────────────────────────────

interface PendingAmountParams {
  rideId?: string;
  bookingVehicleId?: string;
  riderName?: string;
  pickupText?: string;
  destinationText?: string;
  fare?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PendingAmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    rideId,
    bookingVehicleId,
    riderName = 'Rider',
    pickupText = '—',
    destinationText = '—',
    fare = '—',
  } = useLocalSearchParams<PendingAmountParams>();

  // ── Billing state ─────────────────────────────────────────────────────────
  const [billing, setBilling] = useState<BookingBilling | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // ── Charge modal state ────────────────────────────────────────────────────
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [localCharges, setLocalCharges] = useState<ExtraCharge[]>([]);

  const fetchBilling = useCallback(async () => {
    if (!bookingVehicleId) return;
    setFetchError(false);
    try {
      const data = await getBookingDetails(bookingVehicleId);
      setBilling(data);
    } catch (err) {
      console.error('[pending-amount] getBookingDetails failed:', err);
      setFetchError(true);
    }
  }, [bookingVehicleId]);

  useEffect(() => {
    fetchBilling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Charge save handler ───────────────────────────────────────────────────
  const handleChargeSubmit = useCallback(async (charge: ExtraCharge) => {
    const updated = [...localCharges, charge];
    setLocalCharges(updated);
    setChargeModalVisible(false);

    if (!bookingVehicleId) return;
    try {
      await submitCharges(bookingVehicleId, aggregateCharges(updated));
      await fetchBilling();
    } catch (err) {
      console.error('[pending-amount] submitCharges failed:', err);
      Alert.alert('Warning', 'Charge saved locally but failed to sync with server.');
    }
  }, [localCharges, bookingVehicleId, fetchBilling]);

  const handleContinue = useCallback(() => {
    router.replace({
      pathname: '/(driver)/feedback',
      params: { rideId, riderName },
    });
  }, [router, rideId, riderName]);

  const displayAmount = billing?.balanceAmount ?? null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header icon ──────────────────────────────────────────────────── */}
        <View style={styles.iconSection}>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={36} color="#EDB96D" />
          </View>
          <Text style={styles.title}>Pending Amount</Text>
          <Text style={styles.subtitle}>Please collect payment from the customer</Text>
        </View>

        {/* ── Amount + Extra Charges card ───────────────────────────────────── */}
        <View style={styles.amountCard}>
          {/* Amount row */}
          <View style={styles.amountRow}>
            <View style={styles.amountLeft}>
              <Ionicons name="wallet-outline" size={18} color="#EDB96D" />
              <Text style={styles.amountLabel}>Amount to be Paid</Text>
            </View>

            {displayAmount !== null ? (
              <Text style={styles.amountValue}>
                ₹{displayAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={styles.amountDash}>—</Text>
            )}
          </View>

          {/* Billing fetch error */}
          {fetchError && !loading && (
            <View style={styles.billingErrorRow}>
              <Text style={styles.billingErrorText}>Could not load amount.</Text>
              <Pressable onPress={fetchBilling} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Extra Charges button */}
          <Pressable
            style={styles.extraChargesBtn}
            onPress={() => setChargeModalVisible(true)}
          >
            <View style={styles.extraChargesBtnLeft}>
              <Ionicons name="receipt-outline" size={16} color="#EDB96D" />
              <Text style={styles.extraChargesBtnText}>Extra Charges</Text>
              {localCharges.length > 0 && (
                <View style={styles.extraChargesBadge}>
                  <Text style={styles.extraChargesBadgeText}>{localCharges.length}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </Pressable>
        </View>

        {/* ── Trip summary ──────────────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryDotGreen} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>PICKUP</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{pickupText}</Text>
            </View>
          </View>
          <View style={styles.summaryConnector} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryDotRed} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>DESTINATION</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{destinationText}</Text>
            </View>
          </View>
        </View>

        {/* ── Continue CTA ──────────────────────────────────────────────────── */}
        <Pressable onPress={handleContinue} style={styles.ctaWrapper}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Continue to Feedback</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* ── Charge Modal ───────────────────────────────────────────────────── */}
      <ChargeModal
        visible={chargeModalVisible}
        onSubmit={handleChargeSubmit}
        onDismiss={() => setChargeModalVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  // Header
  iconSection: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(237, 185, 109, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Amount + Extra Charges card
  amountCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    color: '#EDB96D',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  amountDash: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '500',
  },
  billingErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  billingErrorText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.3)',
  },
  retryBtnText: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 14,
  },
  extraChargesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraChargesBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraChargesBtnText: {
    color: '#EDB96D',
    fontSize: 14,
    fontWeight: '600',
  },
  extraChargesBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDB96D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  extraChargesBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },

  // Trip summary
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#30D158',
    marginTop: 4,
    flexShrink: 0,
  },
  summaryDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF453A',
    marginTop: 4,
    flexShrink: 0,
  },
  summaryConnector: {
    width: 1.5,
    height: 18,
    backgroundColor: '#2C2C2E',
    marginLeft: 4,
    marginVertical: 4,
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // CTA
  ctaWrapper: {
    width: '100%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
