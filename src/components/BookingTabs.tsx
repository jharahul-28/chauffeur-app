import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BookingTab } from '../utils/bookingFilter';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tab {
  key: BookingTab;
  label: string;
}

interface BookingTabsProps {
  activeTab: BookingTab;
  onTabChange: (tab: BookingTab) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { key: 'current', label: 'Current' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Segmented control for switching between booking views.
 * Stateless — parent owns the activeTab value.
 *
 * Extensibility:
 *  - Add badge counts by passing `counts: Record<BookingTab, number>` prop
 *  - Animate the active indicator with Reanimated for a sliding pill effect
 */
const BookingTabs = memo(function BookingTabs({
  activeTab,
  onTabChange,
}: BookingTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
});

export default BookingTabs;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#2C2C2E',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#EDB96D',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#EDB96D',
  },
});
