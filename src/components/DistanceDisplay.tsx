import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistanceDisplayProps {
  /** Total km traveled — updates dynamically when API is refreshed. */
  totalTraveledKm: number;
  /** Package km limit — used to show remaining km. */
  packageKm?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const DistanceDisplay = memo(function DistanceDisplay({
  totalTraveledKm,
  packageKm,
}: DistanceDisplayProps) {
  const traveled = totalTraveledKm.toFixed(1);
  const isOverLimit = packageKm != null && totalTraveledKm > packageKm;

  return (
    <View style={[styles.container, isOverLimit ? styles.containerOver : styles.containerNormal]}>
      <View style={styles.labelRow}>
        <Ionicons
          name="navigate-outline"
          size={14}
          color={isOverLimit ? '#FF9F0A' : '#64D2FF'}
        />
        <Text style={[styles.label, isOverLimit ? styles.labelOver : styles.labelNormal]}>
          Distance Traveled
        </Text>
      </View>
      <Text style={[styles.value, isOverLimit ? styles.valueOver : styles.valueNormal]}>
        {traveled} <Text style={styles.unit}>km</Text>
      </Text>
      {packageKm != null && (
        <Text style={styles.limit}>
          Package: {packageKm} km{isOverLimit ? '  ⚠ Over limit' : ''}
        </Text>
      )}
    </View>
  );
});

export default DistanceDisplay;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  containerNormal: {
    backgroundColor: 'rgba(100, 210, 255, 0.06)',
    borderColor: 'rgba(100, 210, 255, 0.18)',
  },
  containerOver: {
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    borderColor: 'rgba(255, 159, 10, 0.25)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelNormal: {
    color: '#64D2FF',
  },
  labelOver: {
    color: '#FF9F0A',
  },
  value: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  valueNormal: {
    color: '#FFFFFF',
  },
  valueOver: {
    color: '#FF9F0A',
  },
  unit: {
    fontSize: 22,
    fontWeight: '500',
    color: '#8E8E93',
  },
  limit: {
    marginTop: 6,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
