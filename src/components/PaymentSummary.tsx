import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdditionalCharges } from '../types/bookingBilling';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentSummaryProps {
  balanceAmount: number;
  additionalCharges: AdditionalCharges;
  totalAdditionalAmount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays the final payment summary on the Feedback screen.
 *
 * Shows:
 *  - Amount to Collect (balanceAmount) — always visible
 *  - Extra charges breakdown — only when totalAdditionalAmount > 0
 *
 * Extensibility:
 *  - Add paymentMode prop (cash/online) with a badge.
 *  - Add onViewInvoice callback to link to full invoice screen.
 *  - Swap formatINR for a locale-aware formatter when multi-currency is needed.
 */
const PaymentSummary = memo(function PaymentSummary({
  balanceAmount,
  additionalCharges,
  totalAdditionalAmount,
}: PaymentSummaryProps) {
  const hasExtraCharges = totalAdditionalAmount > 0;
  const { mcFare, waitingCharge, parkingCharge } = additionalCharges;

  return (
    <View style={styles.card}>
      {/* ── Amount to Collect ──────────────────────────────────────────────── */}
      <View style={styles.collectRow}>
        <View style={styles.collectLeft}>
          <Ionicons name="wallet-outline" size={18} color="#EDB96D" />
          <Text style={styles.collectLabel}>Amount to Collect</Text>
        </View>
        <Text style={styles.collectAmount}>{formatINR(balanceAmount)}</Text>
      </View>

      {/* ── Extra Charges Breakdown ───────────────────────────────────────── */}
      {hasExtraCharges && (
        <>
          <View style={styles.divider} />

          <Text style={styles.extraLabel}>EXTRA CHARGES</Text>

          {mcFare > 0 && (
            <View style={styles.chargeRow}>
              <Text style={styles.chargeName}>Toll / MCD</Text>
              <Text style={styles.chargeValue}>{formatINR(mcFare)}</Text>
            </View>
          )}

          {waitingCharge > 0 && (
            <View style={styles.chargeRow}>
              <Text style={styles.chargeName}>Waiting</Text>
              <Text style={styles.chargeValue}>{formatINR(waitingCharge)}</Text>
            </View>
          )}

          {parkingCharge > 0 && (
            <View style={styles.chargeRow}>
              <Text style={styles.chargeName}>Parking</Text>
              <Text style={styles.chargeValue}>{formatINR(parkingCharge)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Extra</Text>
            <Text style={styles.totalValue}>{formatINR(totalAdditionalAmount)}</Text>
          </View>
        </>
      )}
    </View>
  );
});

export default PaymentSummary;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    gap: 0,
  },

  // Amount to collect
  collectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  collectAmount: {
    color: '#EDB96D',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Section divider
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 14,
  },

  // Extra charges section label
  extraLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Individual charge rows
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chargeName: {
    color: '#EBEBF5',
    fontSize: 14,
    fontWeight: '400',
  },
  chargeValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Total extra row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  totalLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: '#FF9F0A',
    fontSize: 15,
    fontWeight: '700',
  },
});
