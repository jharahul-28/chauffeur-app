import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCountdown } from '../utils/timeUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WaitTimerDisplayProps {
  remainingSeconds: number;
  isFreeTimeExceeded: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Isolated timer display to prevent re-renders from propagating up the tree.
 * Shows remaining free wait time or an "extra charges" notice.
 */
const WaitTimerDisplay = memo(function WaitTimerDisplay({
  remainingSeconds,
  isFreeTimeExceeded,
}: WaitTimerDisplayProps) {
  return (
    <View style={[styles.container, isFreeTimeExceeded && styles.containerExceeded]}>
      <View style={[styles.dot, isFreeTimeExceeded ? styles.dotExceeded : styles.dotActive]} />
      {isFreeTimeExceeded ? (
        <Text style={styles.exceededText}>Extra charges applied</Text>
      ) : (
        <View style={styles.countdownRow}>
          <Text style={styles.label}>Free wait: </Text>
          <Text style={styles.countdown}>{formatCountdown(remainingSeconds)}</Text>
        </View>
      )}
    </View>
  );
});

export default WaitTimerDisplay;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(48, 209, 88, 0.10)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  containerExceeded: {
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  dotActive: {
    backgroundColor: '#30D158',
  },
  dotExceeded: {
    backgroundColor: '#FF453A',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  countdown: {
    color: '#30D158',
    fontSize: 15,
    fontWeight: '700',
  },
  exceededText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
  },
});
