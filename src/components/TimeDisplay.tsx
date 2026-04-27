import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeDisplayProps {
  /** Formatted time string from useHourlyTimer. '—' when start time not yet received. */
  formattedTime: string;
  /** True when the booked window is exhausted. Always false when not ready. */
  isExpired: boolean;
  /** Raw signed milliseconds. 0 when start time not yet received. */
  rawMilliseconds: number;
}

// ─── Phase ────────────────────────────────────────────────────────────────────

type Phase = 'loading' | 'normal' | 'warning' | 'danger';

function getPhase(formattedTime: string, isExpired: boolean, rawMs: number): Phase {
  if (formattedTime === '—') return 'loading';
  if (isExpired) return 'danger';
  if (rawMs > 0 && rawMs <= 10 * 60 * 1000) return 'warning';
  return 'normal';
}

const PHASE_COLORS: Record<Phase, { accent: string; bg: string; border: string }> = {
  loading: { accent: '#8E8E93', bg: 'rgba(142,142,147,0.06)', border: 'rgba(142,142,147,0.15)' },
  normal:  { accent: '#EDB96D', bg: 'rgba(237,185,109,0.08)', border: 'rgba(237,185,109,0.2)'  },
  warning: { accent: '#FF9F0A', bg: 'rgba(255,159,10,0.08)',  border: 'rgba(255,159,10,0.25)'  },
  danger:  { accent: '#FF453A', bg: 'rgba(255,69,58,0.08)',   border: 'rgba(255,69,58,0.25)'   },
};

const PHASE_ICON: Record<Phase, React.ComponentProps<typeof Ionicons>['name']> = {
  loading: 'time-outline',
  normal:  'timer-outline',
  warning: 'time-outline',
  danger:  'alert-circle-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determine which unit labels to show based on rawMs and format.
 * HH:mm format (>10 min) → ['hr', 'min']
 * mm:ss format (≤10 min) → ['min', 'sec']
 */
function getUnitLabels(rawMs: number): [string, string] {
  const totalMinutes = Math.floor(Math.abs(rawMs) / 1000 / 60);
  return totalMinutes > 10 ? ['hr', 'min'] : ['min', 'sec'];
}

// ─── Sub-component: one number + unit label ───────────────────────────────────

function TimePart({ value, unit, color }: { value: string; unit: string; color: string }) {
  return (
    <View style={partStyles.wrap}>
      <View style={partStyles.row}>
        <Text style={[partStyles.number, { color }]}>{value}</Text>
        <Text style={[partStyles.unit, { color }]}>{unit}</Text>
      </View>
    </View>
  );
}

const partStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  number: {
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: 80,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    opacity: 0.7,
    letterSpacing: 0.3,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

const TimeDisplay = memo(function TimeDisplay({
  formattedTime,
  isExpired,
  rawMilliseconds,
}: TimeDisplayProps) {
  const phase = getPhase(formattedTime, isExpired, rawMilliseconds);
  const { accent, bg, border } = PHASE_COLORS[phase];
  const valueColor = phase === 'danger' ? accent : '#FFFFFF';

  const title = phase === 'loading'
    ? 'Waiting for start time…'
    : isExpired ? 'Extra Time Running' : 'Time Remaining';

  const subtext = phase === 'loading'
    ? ''
    : isExpired ? 'Additional charges may apply' : 'Within booked duration';

  // Split "HH:mm" or "mm:ss" into two parts, or show dash for loading
  const isReady = formattedTime !== '—';
  const [left, right] = isReady ? formattedTime.split(':') : ['—', ''];
  const [leftUnit, rightUnit] = getUnitLabels(rawMilliseconds);

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Ionicons name={PHASE_ICON[phase]} size={14} color={accent} />
        <Text style={[styles.title, { color: accent }]}>{title}</Text>
      </View>

      {/* Time value */}
      {isReady ? (
        <View style={styles.timerRow}>
          <TimePart value={left} unit={leftUnit} color={valueColor} />
          <Text style={[styles.colon, { color: valueColor }]}>:</Text>
          <TimePart value={right} unit={rightUnit} color={valueColor} />
        </View>
      ) : (
        <Text style={[styles.dashText, { color: accent }]}>{formattedTime}</Text>
      )}

      {/* Subtext */}
      {!!subtext && (
        <Text style={[styles.subtext, { color: accent }]}>{subtext}</Text>
      )}
    </View>
  );
});

export default TimeDisplay;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  colon: {
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 80,
    marginBottom: 10,
    opacity: 0.5,
  },
  dashText: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 3,
    lineHeight: 68,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.75,
  },
});
