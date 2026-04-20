import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Waypoint } from '../types/bookingDetail';

interface WaypointListProps {
  waypoints: Waypoint[];
}

const TYPE_CONFIG = {
  PICKUP: { label: 'Pickup', color: '#30D158', iconName: 'location' as const },
  STOP: { label: 'Stop', color: '#FF9F0A', iconName: 'ellipse' as const },
  DROP: { label: 'Drop', color: '#FF453A', iconName: 'flag' as const },
};

export default function WaypointList({ waypoints }: WaypointListProps) {
  const sorted = useMemo(
    () => [...waypoints].sort((a, b) => a.waypointSequence - b.waypointSequence),
    [waypoints],
  );

  if (sorted.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ROUTE</Text>
      {sorted.map((wp, index) => {
        const cfg = TYPE_CONFIG[wp.waypointType] ?? TYPE_CONFIG.STOP;
        const isLast = index === sorted.length - 1;
        return (
          <View key={wp.id} style={styles.waypointRow}>
            <View style={styles.iconCol}>
              <View style={[styles.iconCircle, { borderColor: cfg.color }]}>
                <Ionicons name={cfg.iconName} size={12} color={cfg.color} />
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>
            <View style={[styles.content, isLast && styles.contentLast]}>
              <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.address} numberOfLines={2}>
                {wp.address}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
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
  waypointRow: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
  },
  iconCol: {
    alignItems: 'center',
    width: 28,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#3A3A3C',
    marginVertical: 3,
  },
  content: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  contentLast: {
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  address: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
});
