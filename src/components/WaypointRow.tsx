import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WaypointType } from '../utils/waypointUtils';

export interface WaypointRowProps {
  type: WaypointType;
  address: string;
  sequence: number;
  arrivedAt?: string | null;
  isLast?: boolean;
  /** Highlights this row as the current navigation target. */
  isActive?: boolean;
  /** When provided, renders a navigate icon button beside the address. */
  onOpenMaps?: () => void;
  /**
   * Optional slot rendered below this row's address block.
   * Used by PickupDrawer to inject StopActionButtons for the active STOP.
   */
  actionSlot?: React.ReactNode;
}

const ICON: Record<WaypointType, React.ComponentProps<typeof Ionicons>['name']> = {
  PICKUP: 'radio-button-on',
  STOP: 'ellipse',
  DROP: 'location',
};

const ICON_COLOR: Record<WaypointType, string> = {
  PICKUP: '#30D158',
  STOP: '#FF9F0A',
  DROP: '#FF453A',
};

const ACTIVE_STOP_COLOR = '#FFBF4D';

const WaypointRow = memo(function WaypointRow({
  type,
  address,
  arrivedAt,
  isLast = false,
  isActive = false,
  onOpenMaps,
  actionSlot,
}: WaypointRowProps) {
  const isArrived = arrivedAt != null;
  const showActiveHighlight = isActive && !isArrived;
  const iconColor = isArrived
    ? '#3A3A3C'
    : showActiveHighlight && type === 'STOP'
    ? ACTIVE_STOP_COLOR
    : ICON_COLOR[type];

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {/* Left: icon + connector line */}
        <View style={styles.iconColumn}>
          <Ionicons
            name={ICON[type]}
            size={type === 'DROP' ? 16 : 14}
            color={iconColor}
          />
          {/* Extend connector when action slot is present so the line flows through */}
          {!isLast && (
            <View
              style={[
                styles.connector,
                actionSlot ? styles.connectorExtended : undefined,
              ]}
            />
          )}
        </View>

        {/* Right: address block */}
        <View style={styles.addressBlock}>
          {showActiveHighlight && type === 'STOP' && (
            <Text style={styles.activeLabel}>NEXT STOP</Text>
          )}
          <View style={styles.addressRow}>
            <Text
              style={[
                styles.address,
                isArrived && styles.addressArrived,
                showActiveHighlight && type === 'STOP' && styles.addressActive,
              ]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {address || '—'}
            </Text>
            {isArrived && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#3A3A3C"
                style={styles.checkIcon}
              />
            )}
            {!isArrived && onOpenMaps && (
              <Pressable
                onPress={onOpenMaps}
                style={styles.mapsButton}
                accessibilityRole="button"
                accessibilityLabel="Open in Google Maps"
                hitSlop={8}
              >
                <Ionicons name="navigate" size={17} color="#4285F4" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Action slot — rendered outside the row flex so it spans full width */}
      {actionSlot ?? null}
    </View>
  );
});

export default WaypointRow;

const styles = StyleSheet.create({
  wrapper: {
    // Contains both the row and the optional action slot
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 36,
  },
  iconColumn: {
    alignItems: 'center',
    width: 20,
    paddingTop: 2,
  },
  connector: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#2C2C2E',
    marginTop: 4,
    marginBottom: 4,
    minHeight: 16,
  },
  connectorExtended: {
    minHeight: 48,
  },
  addressBlock: {
    flex: 1,
    paddingBottom: 14,
  },
  activeLabel: {
    color: '#FF9F0A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  address: {
    flex: 1,
    color: '#D1D1D6',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  addressActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addressArrived: {
    color: '#48484A',
    opacity: 0.6,
  },
  checkIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  mapsButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
