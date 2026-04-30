import React, { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallCustomer } from '../hooks/useCallCustomer';

interface CallButtonProps {
  phoneNumber: string | undefined;
  size?: number;
  accessibilityLabel?: string;
}

const CallButton = memo(function CallButton({
  phoneNumber,
  size = 20,
  accessibilityLabel = 'Call customer',
}: CallButtonProps) {
  const { callCustomer } = useCallCustomer();

  return (
    <Pressable
      style={styles.button}
      onPress={() => callCustomer(phoneNumber)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="call-outline" size={size} color="#EDB96D" />
    </Pressable>
  );
});

export default CallButton;

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
