import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderBackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Reusable back button for custom headers.
 * Uses the same style as AppHeader for consistency.
 */
export default function HeaderBackButton({ onPress, style }: HeaderBackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onPress || (() => router.back())}
      style={[styles.button, style]}
      hitSlop={12}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E', // Subtle dark background
    alignItems: 'center',
    justifyContent: 'center',
  },
});
