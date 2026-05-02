import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatHHMMSS } from '../utils/timeUtils';

interface WaitTimerDisplayProps {
  /** Seconds elapsed in the current wait session — counts up from 0. */
  elapsedSeconds: number;
  /** True when cumulative free wait time (3 min) has been exceeded. */
  isFreeTimeExceeded: boolean;
}

/**
 * Timer display shown whenever the driver is in a waiting state.
 *
 * Always renders the elapsed time regardless of whether free time has been
 * exceeded. When exceeded, the timer turns red and a billing notice appears
 * below it so the driver is aware extra charges are accruing.
 */
const WaitTimerDisplay = memo(function WaitTimerDisplay({
  elapsedSeconds,
  isFreeTimeExceeded,
}: WaitTimerDisplayProps) {
  return (
    <View style={[styles.container, isFreeTimeExceeded && styles.containerExceeded]}>
      {/* Timer row — always visible */}
      <View style={styles.timerRow}>
        <View style={[styles.dot, isFreeTimeExceeded ? styles.dotExceeded : styles.dotActive]} />
        <Text style={styles.label}>Waiting: </Text>
        <Text style={[styles.elapsed, isFreeTimeExceeded && styles.elapsedExceeded]}>
          {formatHHMMSS(elapsedSeconds)}
        </Text>
      </View>

      {/* Extra-charges notice — shown only after free time is exceeded */}
      {isFreeTimeExceeded && (
        <View style={styles.noticeRow}>
          <Text style={styles.noticeText}>Extra charges are being applied</Text>
        </View>
      )}
    </View>
  );
});

export default WaitTimerDisplay;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 159, 10, 0.10)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.25)',
    gap: 4,
  },
  containerExceeded: {
    backgroundColor: 'rgba(255, 69, 58, 0.10)',
    borderColor: 'rgba(255, 69, 58, 0.30)',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  elapsedExceeded: {
    color: '#FF453A',
  },
  noticeRow: {
    paddingLeft: 15,
  },
  noticeText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
