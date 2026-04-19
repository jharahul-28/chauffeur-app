import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChargeIconButtonProps {
  count: number;
  onPress: () => void;
}

const ChargeIconButton = memo(function ChargeIconButton({
  count,
  onPress,
}: ChargeIconButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Extra charges, ${count} added`}>
      <View style={styles.iconWrap}>
        <Ionicons name="receipt-outline" size={18} color="#EDB96D" />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={styles.label}>Charges</Text>
    </Pressable>
  );
});

export default ChargeIconButton;

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 185, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.3)',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EDB96D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
