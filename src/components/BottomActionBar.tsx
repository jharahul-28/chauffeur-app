import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SlideToConfirm from './SlideToConfirm';
import { SlideVariant } from './SlideToConfirm';
import ChargeIconButton from './ChargeIconButton';

export interface BottomActionBarProps {
  slideText: string;
  slideVariant?: SlideVariant;
  onSlideComplete: () => void | Promise<void>;
  slideLoading?: boolean;
  slideDisabled?: boolean;
  /** Show the Wait/Resume + Charges + Maps icon row above the slider */
  showUtilRow?: boolean;
  isWaiting?: boolean;
  onWaitResume?: () => void;
  chargeCount?: number;
  onOpenCharges?: () => void;
}

const BottomActionBar = memo(function BottomActionBar({
  slideText,
  slideVariant = 'primary',
  onSlideComplete,
  slideLoading = false,
  slideDisabled = false,
  showUtilRow = false,
  isWaiting = false,
  onWaitResume,
  chargeCount = 0,
  onOpenCharges,
}: BottomActionBarProps) {
  return (
    <View style={styles.wrapper}>
      {/* Row 1: Wait/Resume + Charges + Map icon */}
      {showUtilRow && (
        <View style={styles.utilRow}>
          {onWaitResume && (
            <Pressable
              style={[styles.waitButton, isWaiting && styles.waitButtonActive]}
              onPress={onWaitResume}
              accessibilityRole="button"
              accessibilityLabel={isWaiting ? 'Resume trip' : 'Start waiting'}
            >
              <Ionicons
                name={isWaiting ? 'play-outline' : 'pause-outline'}
                size={16}
                color={isWaiting ? '#FF9F0A' : '#8E8E93'}
              />
              <Text style={[styles.waitText, isWaiting && styles.waitTextActive]}>
                {isWaiting ? 'Resume' : 'Wait'}
              </Text>
            </Pressable>
          )}

          <ChargeIconButton count={chargeCount} onPress={onOpenCharges ?? (() => {})} />
        </View>
      )}

      {/* Row 2: Slide button — full width */}
      <SlideToConfirm
        text={slideText}
        variant={slideVariant}
        onComplete={onSlideComplete}
        loading={slideLoading}
        disabled={slideDisabled}
        accessibilityLabel={slideText}
      />
    </View>
  );
});

export default BottomActionBar;

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  utilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  waitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  waitButtonActive: {
    backgroundColor: 'rgba(255, 159, 10, 0.10)',
    borderColor: 'rgba(255, 159, 10, 0.35)',
  },
  waitText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  waitTextActive: {
    color: '#FF9F0A',
  },
});
