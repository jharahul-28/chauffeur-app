import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RightDrawer from './RightDrawer';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  /** Show a back chevron on the left instead of an empty slot */
  showBack?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Standardised header used across Bookings and Profile screens.
 *
 * Layout:
 *   [back / empty]   [VELVET gradient]   [hamburger]
 *
 * The hamburger opens a right-side drawer (RightDrawer).
 */
export default function AppHeader({ showBack = false }: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Left slot */}
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {/* Centre: VELVET brand */}
        <Svg height="26" width="108" viewBox="0 0 108 26">
          <Defs>
            <SvgGradient id="appHeaderGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#EDB96D" />
              <Stop offset="100%" stopColor="#B5783C" />
            </SvgGradient>
          </Defs>
          <SvgText
            fill="url(#appHeaderGold)"
            fontSize="18"
            fontWeight="600"
            x="54"
            y="20"
            textAnchor="middle"
            letterSpacing="3"
          >
            VELVET
          </SvgText>
        </Svg>

        {/* Right slot: hamburger */}
        <Pressable
          onPress={() => setDrawerOpen(true)}
          style={styles.iconButton}
          hitSlop={8}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Drawer rendered as a Modal — above everything */}
      <RightDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#111111',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 36,
    height: 36,
  },
});
