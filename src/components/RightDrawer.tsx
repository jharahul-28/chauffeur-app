import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  removeAccessToken,
  removeChauffeurId,
} from '@/src/storage/tokenStorage';

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 272;
const ANIMATION_DURATION = 280;
const SOS_NUMBER = '112';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Right-side slide drawer.
 *
 * Opens with a smooth translate animation and renders above all content via
 * a React Native Modal so it works across any screen without prop drilling.
 *
 * Menu items:
 *  - Profile   → /(driver)/(tabs)/profile
 *  - Bookings  → /(driver)/(tabs)/bookings
 *  - SOS       → tel:112 (falls back to alert with number prefilled)
 *  - Sign Out  → clears token + chauffeur id, navigates to login (stack reset)
 */
export default function RightDrawer({ isOpen, onClose }: RightDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Internal visibility controls the Modal so we can animate out before hiding
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [isOpen, slideAnim, backdropAnim]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const navigate = (path: string) => {
    onClose();
    // Small delay lets the close animation begin before navigating
    setTimeout(() => router.push(path as never), 80);
  };

  const handleSOS = async () => {
    const url = `tel:${SOS_NUMBER}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Emergency Call',
          `Dial ${SOS_NUMBER} for emergency services.`,
          [{ text: 'OK' }],
        );
      }
    } catch {
      Alert.alert(
        'Emergency Call',
        `Dial ${SOS_NUMBER} for emergency services.`,
        [{ text: 'OK' }],
      );
    }
  };

  const handleSignOut = async () => {
    onClose();
    try {
      await Promise.all([removeAccessToken(), removeChauffeurId()]);
    } catch {
      // Best-effort token removal; navigate regardless
    }
    // replace resets the navigation stack so the user can't go back
    router.replace('/');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Animated backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose} accessible={false}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 24),
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={8}
          accessibilityLabel="Close menu"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>

        {/* Primary nav items */}
        <View style={styles.menuSection}>
          <DrawerItem
            icon="person-outline"
            label="Profile"
            onPress={() => navigate('/(driver)/(tabs)/profile')}
          />
          <DrawerItem
            icon="calendar-outline"
            label="Bookings"
            onPress={() => {
              onClose();
              // showPast=1 signals the screen to reveal the Past tab
              setTimeout(
                () => router.push({ pathname: '/(driver)/(tabs)/bookings' as never, params: { showPast: '1' } }),
                80,
              );
            }}
          />
          <DrawerItem
            icon="call-outline"
            label="SOS"
            onPress={handleSOS}
            accentColor="#FF453A"
          />
        </View>

        {/* Sign Out — visually separated at the bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />
          <DrawerItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            accentColor="#FF453A"
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── DrawerItem ───────────────────────────────────────────────────────────────

function DrawerItem({
  icon,
  label,
  onPress,
  accentColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  accentColor?: string;
}) {
  const color = accentColor ?? '#FFFFFF';
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      <View style={[styles.iconWrap, accentColor && { backgroundColor: `${accentColor}18` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#2C2C2E',
    // subtle shadow on the left edge
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    flex: 1,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomSection: {
    paddingBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginBottom: 8,
  },
});
