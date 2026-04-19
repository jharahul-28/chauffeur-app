import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCountdown } from '../utils/timeUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WaitTimerDisplayProps {
  /** Seconds elapsed in the current wait session — counts up from 0. */
  elapsedSeconds: number;
  /** True when cumulative free wait time (3 min) has been exceeded. */
  isFreeTimeExceeded: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Isolated timer display — rendered only while the driver is waiting.
 *
 * Shows elapsed seconds for the current wait session (counts up from 00:00).
 * Once the cumulative 3-minute free allowance is exceeded it switches to a
 * billing-notice state.
 *
 * Kept as a memo'd leaf so the 1-second tick doesn't re-render the whole drawer.
 */
const WaitTimerDisplay = memo(function WaitTimerDisplay({
  elapsedSeconds,
  isFreeTimeExceeded,
}: WaitTimerDisplayProps) {
  return (
    <View style={[styles.container, isFreeTimeExceeded && styles.containerExceeded]}>
      <View style={[styles.dot, isFreeTimeExceeded ? styles.dotExceeded : styles.dotActive]} />
      {isFreeTimeExceeded ? (
        <Text style={styles.exceededText}>Extra charges applied</Text>
      ) : (
        <View style={styles.countdownRow}>
          <Text style={styles.label}>Waiting: </Text>
          <Text style={styles.elapsed}>{formatCountdown(elapsedSeconds)}</Text>
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
    backgroundColor: 'rgba(255, 159, 10, 0.10)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.25)',
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
    backgroundColor: '#FF9F0A',
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
  elapsed: {
    color: '#FF9F0A',
    fontSize: 15,
    fontWeight: '700',
  },
  exceededText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
  },
});
