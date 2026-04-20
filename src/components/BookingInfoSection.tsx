import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Row {
  label: string;
  value: string | null | undefined;
}

interface BookingInfoSectionProps {
  title: string;
  rows: Row[];
}

export default function BookingInfoSection({ title, rows }: BookingInfoSectionProps) {
  const visibleRows = rows.filter((r) => r.value != null && r.value !== '');
  if (visibleRows.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {visibleRows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: 12,
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    flex: 1,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});
