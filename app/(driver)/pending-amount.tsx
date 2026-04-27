import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ChargeModal from '../../src/components/ChargeModal';
import ChargesSummaryModal from '../../src/components/ChargesSummaryModal';
import PaymentModal from '../../src/components/PaymentModal';
import { Charge, CHARGE_DISPLAY_NAME, CHARGE_ORDER } from '../../src/types/charge';
import { useCharges } from '../../src/hooks/useCharges';
import { postCompletePayment } from '../../src/services/rideService';
import { getBookingDetails } from '../../src/services/bookingApi';
import { getErrorMessage } from '../../src/utils/apiErrorParser';

// ─── Screen params ────────────────────────────────────────────────────────────

interface PendingAmountParams {
  rideId?: string;
  bookingVehicleId?: string;
  riderName?: string;
  pickupText?: string;
  destinationText?: string;
  fare?: string;
  balanceAmount?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PendingAmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    bookingVehicleId,
    riderName = 'Rider',
    pickupText = '—',
    destinationText = '—',
    balanceAmount: balanceAmountParam = '',
  } = useLocalSearchParams<PendingAmountParams>();

  // Initialise from nav param; gets refreshed after each successful charge save
  const [balanceAmount, setBalanceAmount] = useState<number | null>(
    balanceAmountParam ? parseFloat(balanceAmountParam) : null,
  );

  // ── Payment state ─────────────────────────────────────────────────────────
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // ── Charge modal state ────────────────────────────────────────────────────
  const [chargesSummaryVisible, setChargesSummaryVisible] = useState(false);
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);

  const { charges, fetchCharges, saveCharges } = useCharges(bookingVehicleId);

  const refreshBilling = useCallback(async () => {
    if (!bookingVehicleId) return;
    try {
      const billing = await getBookingDetails(bookingVehicleId);
      setBalanceAmount(billing.balanceAmount);
    } catch {
      // balance display stays as-is; non-critical
    }
  }, [bookingVehicleId]);

  useEffect(() => {
    fetchCharges();
    refreshBilling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Charge management ─────────────────────────────────────────────────────

  const handleOpenAddCharge = useCallback(() => {
    setChargesSummaryVisible(false);
    setEditingChargeIndex(null);
    setChargeModalVisible(true);
  }, []);

  const handleOpenEditCharge = useCallback((index: number) => {
    setChargesSummaryVisible(false);
    setEditingChargeIndex(index);
    setChargeModalVisible(true);
  }, []);

  const handleChargeSubmit = useCallback(async (charge: Charge) => {
    const updatedCharges = editingChargeIndex !== null
      ? charges.map((c, i) => (i === editingChargeIndex ? charge : c))
      : [...charges, charge];

    setChargeModalVisible(false);
    setEditingChargeIndex(null);

    const saved = await saveCharges(updatedCharges);
    if (saved) refreshBilling();
  }, [editingChargeIndex, charges, saveCharges, refreshBilling]);

  const chargeBeingEdited = editingChargeIndex !== null ? charges[editingChargeIndex] : undefined;

  const groupedCharges = CHARGE_ORDER
    .map((type) => ({
      type,
      displayName: CHARGE_DISPLAY_NAME[type],
      entries: charges.filter((c) => c.type === type),
    }))
    .filter((g) => g.entries.length > 0);

  const totalExtraCharges = charges.reduce((sum, c) => sum + c.amount, 0);

  // ── Payment handlers ──────────────────────────────────────────────────────

  // "Paid" — open the modal so the driver enters the collected amount
  const handlePaid = useCallback(() => {
    if (isSubmittingPayment) return;
    setPaymentModalVisible(true);
  }, [isSubmittingPayment]);

  // Called by PaymentModal with the entered amount
  const handlePaymentModalSubmit = useCallback(async (amount: number) => {
    if (!bookingVehicleId) return;
    setIsSubmittingPayment(true);
    setPaymentModalVisible(false);
    try {
      await postCompletePayment(bookingVehicleId, { paymentStatus: 'PAID', amount });
      router.replace('/(driver)/(tabs)/bookings');
    } catch (err) {
      console.error('[pending-amount] completePayment (PAID) failed:', err);
      const message = getErrorMessage(err, 'Failed to record payment. Please try again.');
      Alert.alert('Payment Error', message);
    } finally {
      setIsSubmittingPayment(false);
    }
  }, [bookingVehicleId, router]);

  // "Unpaid" — direct API call after confirmation, no modal
  const handleUnpaid = useCallback(() => {
    if (isSubmittingPayment) return;
    Alert.alert(
      'Mark as Unpaid?',
      'This will record the trip as unpaid. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            if (!bookingVehicleId) return;
            setIsSubmittingPayment(true);
            try {
              await postCompletePayment(bookingVehicleId, { paymentStatus: 'UNPAID' });
              router.replace('/(driver)/(tabs)/bookings');
            } catch (err) {
              console.error('[pending-amount] completePayment (UNPAID) failed:', err);
              const message = getErrorMessage(err, 'Failed to record payment. Please try again.');
              Alert.alert('Payment Error', message);
            } finally {
              setIsSubmittingPayment(false);
            }
          },
        },
      ],
    );
  }, [bookingVehicleId, isSubmittingPayment, router]);

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

        {/* ── Amount card ───────────────────────────────────────────────────── */}
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View style={styles.amountLeft}>
              <Ionicons name="wallet-outline" size={18} color="#EDB96D" />
              <Text style={styles.amountLabel}>Amount to be Paid</Text>
            </View>

            {balanceAmount !== null && !isNaN(balanceAmount) ? (
              <Text style={styles.amountValue}>
                ₹{balanceAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            ) : (
              <Text style={styles.amountDash}>—</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Extra Charges button */}
          <Pressable
            style={styles.extraChargesBtn}
            onPress={() => setChargesSummaryVisible(true)}
          >
            <View style={styles.extraChargesBtnLeft}>
              <Ionicons name="receipt-outline" size={16} color="#EDB96D" />
              <Text style={styles.extraChargesBtnText}>Extra Charges</Text>
              {charges.length > 0 && (
                <View style={styles.extraChargesBadge}>
                  <Text style={styles.extraChargesBadgeText}>{charges.length}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </Pressable>
        </View>

        {/* ── Charges breakdown ─────────────────────────────────────────────── */}
        {groupedCharges.length > 0 && (
          <View style={styles.chargesCard}>
            <Text style={styles.chargesCardTitle}>Extra Charges Breakdown</Text>

            {groupedCharges.map(({ type, displayName, entries }) => (
              <View key={type} style={styles.chargeGroup}>
                <Text style={styles.chargeGroupLabel}>{displayName}</Text>
                {entries.map((charge, i) => (
                  <View key={i} style={styles.chargeEntryRow}>
                    <View style={styles.chargeDot} />
                    <Text style={styles.chargeEntryAmount}>
                      ₹{charge.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            <View style={styles.chargesTotalRow}>
              <Text style={styles.chargesTotalLabel}>Total Extra</Text>
              <Text style={styles.chargesTotalValue}>
                ₹{totalExtraCharges.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}

        {/* ── Trip summary ──────────────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryDotGreen} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>PICKUP</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>{pickupText}</Text>
            </View>
          </View>
          {!!destinationText && (
            <>
              <View style={styles.summaryConnector} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryDotRed} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>DESTINATION</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>{destinationText}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Payment CTAs ───────────────────────────────────────────────────── */}
        <View style={styles.paymentRow}>
          {/* Paid */}
          <Pressable
            onPress={handlePaid}
            disabled={isSubmittingPayment}
            style={[styles.paymentBtnWrapper, styles.paymentBtnFlex]}
          >
            <LinearGradient
              colors={isSubmittingPayment ? ['#2C2C2E', '#2C2C2E'] : ['#E5B566', '#B5783C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentBtn}
            >
              {isSubmittingPayment ? (
                <ActivityIndicator size="small" color="#8E8E93" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#000" />
                  <Text style={styles.paidBtnText}>Paid</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Unpaid */}
          <Pressable
            onPress={handleUnpaid}
            disabled={isSubmittingPayment}
            style={[styles.paymentBtnWrapper, styles.paymentBtnFlex]}
          >
            <View style={[styles.paymentBtn, styles.unpaidBtn, isSubmittingPayment && styles.btnDisabled]}>
              <Ionicons name="close-circle-outline" size={18} color={isSubmittingPayment ? '#3A3A3C' : '#FF453A'} />
              <Text style={[styles.unpaidBtnText, isSubmittingPayment && styles.textDisabled]}>Unpaid</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Charges Summary Modal ──────────────────────────────────────────── */}
      <ChargesSummaryModal
        visible={chargesSummaryVisible}
        charges={charges}
        onDismiss={() => setChargesSummaryVisible(false)}
        onAddCharge={handleOpenAddCharge}
        onEditCharge={handleOpenEditCharge}
      />

      {/* ── Charge Modal ───────────────────────────────────────────────────── */}
      <ChargeModal
        visible={chargeModalVisible}
        onSubmit={handleChargeSubmit}
        onDismiss={() => {
          setChargeModalVisible(false);
          setEditingChargeIndex(null);
        }}
        initialCharge={chargeBeingEdited}
      />

      {/* ── Payment Modal (Paid flow) ──────────────────────────────────────── */}
      <PaymentModal
        visible={paymentModalVisible}
        balanceAmount={balanceAmount ?? 0}
        onClose={() => setPaymentModalVisible(false)}
        onSubmit={handlePaymentModalSubmit}
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

  // Amount card
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

  // Charges breakdown card
  chargesCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  chargesCardTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chargeGroup: {
    gap: 6,
  },
  chargeGroupLabel: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  chargeEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  chargeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3A3A3C',
  },
  chargeEntryAmount: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  chargesTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  chargesTotalLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  chargesTotalValue: {
    color: '#FF9F0A',
    fontSize: 16,
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

  // Payment buttons
  paymentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentBtnWrapper: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  paymentBtnFlex: {
    flex: 1,
  },
  paymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 16,
  },
  paidBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  unpaidBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 58, 0.35)',
  },
  unpaidBtnText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  textDisabled: {
    color: '#3A3A3C',
  },
});
