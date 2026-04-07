import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ProfileMenuItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const MENU_ITEMS: ProfileMenuItem[] = [
  { icon: 'person-outline', label: 'Personal Details' },
  { icon: 'car-outline', label: 'Vehicle Information' },
  { icon: 'document-text-outline', label: 'Documents' },
  { icon: 'star-outline', label: 'Ratings & Reviews' },
  { icon: 'wallet-outline', label: 'Earnings' },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>DR</Text>
          </View>
          <Text style={styles.driverName}>Driver</Text>
          <Text style={styles.driverSubtext}>Chauffeur Partner</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={20} color="#EDB96D" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#3A3A3C" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FF453A" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(237, 185, 109, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(237, 185, 109, 0.35)',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#EDB96D',
    fontSize: 28,
    fontWeight: '700',
  },
  driverName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  driverSubtext: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2C2C2E',
    alignSelf: 'stretch',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  menuContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
  },
  logoutText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
