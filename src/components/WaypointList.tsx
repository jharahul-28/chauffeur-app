import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Waypoint } from '../types/bookingDetail';

interface WaypointListProps {
  waypoints: Waypoint[];
}

type PositionType = 'PICKUP' | 'STOP' | 'DESTINATION';

const TYPE_CONFIG: Record<PositionType, { label: string; color: string; iconName: 'location' | 'ellipse' | 'flag' }> = {
  PICKUP:      { label: 'Pickup',      color: '#30D158', iconName: 'location' },
  STOP:        { label: 'Stop',        color: '#FF9F0A', iconName: 'ellipse' },
  DESTINATION: { label: 'Destination', color: '#FF453A', iconName: 'flag' },
};

function resolvePositionType(index: number, total: number): PositionType {
  if (index === 0) return 'PICKUP';
  if (index === total - 1) return 'DESTINATION';
  return 'STOP';
}

function waypointKey(wp: Waypoint, index: number): string {
  if (wp.id != null) return `${wp.id}-${wp.waypointSequence ?? index}-${index}`;
  return `${wp.latitude}-${wp.longitude}-${index}`;
}

export default function WaypointList({ waypoints }: WaypointListProps) {
  const sorted = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return [];
    return [...waypoints].sort((a, b) => {
      const seqA = a.waypointSequence ?? 0;
      const seqB = b.waypointSequence ?? 0;
      return seqA - seqB;
    });
  }, [waypoints]);

  if (sorted.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>ROUTE</Text>
        <Text style={styles.emptyText}>No waypoints available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ROUTE</Text>
      {sorted.map((wp, index) => {
        const positionType = resolvePositionType(index, sorted.length);
        const cfg = TYPE_CONFIG[positionType];
        const isLast = index === sorted.length - 1;
        return (
          <View key={waypointKey(wp, index)} style={styles.waypointRow}>
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
  emptyText: {
    color: '#8E8E93',
    fontSize: 13,
    paddingBottom: 10,
  },
});
