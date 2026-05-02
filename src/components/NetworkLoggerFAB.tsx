import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function NetworkLoggerFAB() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show the FAB on the logs screen itself or the login screen
  if (pathname === '/network-logs' || pathname === '/') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/network-logs')}
      activeOpacity={0.7}
    >
      <Ionicons name="pulse" size={24} color="#000000" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Above the tab bar
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDB96D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
});
