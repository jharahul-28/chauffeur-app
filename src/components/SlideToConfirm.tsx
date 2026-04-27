/**
 * SlideToConfirm — a gesture-driven confirmation button that prevents accidental
 * taps by requiring the user to drag a thumb fully across the track before the
 * action fires. Built on Reanimated 3 + Gesture Handler v2 (already installed).
 *
 * Design decisions:
 *  - All animation logic runs on the UI thread via worklets — zero JS-thread
 *    involvement during the drag itself.
 *  - onComplete is called exactly once per successful slide; a `committed` guard
 *    prevents re-triggering on multiple rapid gestures.
 *  - Slider auto-resets after success OR failure (caller resolves/rejects the
 *    returned promise from onComplete — or just calls it; reset is unconditional).
 *  - `disabled` freezes the thumb in place and dims the track.
 *
 * Extensibility:
 *  - Pass `variant="danger"` for red tracks (cancel / end trip).
 *  - Swap the icon name per action type.
 *  - Add `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` inside onComplete for
 *    haptic feedback (expo-haptics is already installed).
 *  - Expose `accessibilityLabel` for screen-reader support.
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_HEIGHT = 60;
const THUMB_SIZE = 46;
const THUMB_MARGIN = 7;
// How far past the snap point the thumb must travel to trigger (0–1)
const TRIGGER_THRESHOLD = 0.88;

const SPRING = {
  damping: 40,
  stiffness: 340,
  mass: 0.7,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlideVariant = 'primary' | 'danger';

export interface SlideToConfirmProps {
  /** Label rendered on the track behind the thumb. */
  text: string;
  /**
   * Called when the slide reaches the trigger threshold.
   * If it returns a rejected Promise (or throws), the slider resets immediately.
   * If it returns a resolved Promise or void, the slider stays committed until
   * `loading` flips back to false (normal API-in-flight path).
   */
  onComplete: () => void | Promise<void>;
  /** Freeze thumb and show spinner when true. */
  loading?: boolean;
  /** Prevent interaction entirely (e.g. wait guard). */
  disabled?: boolean;
  /** 'primary' = gold gradient, 'danger' = red. Default: 'primary'. */
  variant?: SlideVariant;
  /** Override the icon shown inside the thumb. Defaults to variant-specific icon. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Accessible hint for screen readers. */
  accessibilityLabel?: string;
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const TRACK_BG: Record<SlideVariant, string> = {
  primary: '#2C2C2E',
  danger: '#2C2C2E',
};

const THUMB_COLORS: Record<SlideVariant, [string, string]> = {
  primary: ['#E5B566', '#B5783C'],
  danger: ['#FF6B6B', '#CC3333'],
};

const FILL_COLOR: Record<SlideVariant, string> = {
  primary: 'rgba(237,185,109,0.15)',
  danger: 'rgba(255,69,58,0.15)',
};

const ICON_NAME: Record<SlideVariant, React.ComponentProps<typeof Ionicons>['name']> = {
  primary: 'chevron-forward',
  danger: 'flag',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlideToConfirm({
  text,
  onComplete,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  accessibilityLabel,
}: SlideToConfirmProps) {
  // `trackWidth` is measured via onLayout; starts at 0 and is populated on
  // first render. The thumb cannot move until the track is measured.
  const trackWidth = useSharedValue(0);

  // Current thumb X offset from its resting position (left edge).
  const thumbX = useSharedValue(0);

  // Saved value at gesture start so we can delta from it.
  const startX = useSharedValue(0);

  // True once the gesture has committed — blocks re-triggering.
  const committed = useSharedValue(false);

  // Maximum distance the thumb can travel (track – thumb – both margins).
  // Derived inline in the worklet from trackWidth to stay on the UI thread.

  const resetSlider = useCallback(() => {
    thumbX.value = withSpring(0, SPRING);
    committed.value = false;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // JS-thread wrapper: calls onComplete and resets if it throws or rejects.
  // This runs on the JS thread (via runOnJS), so async/await is fine here.
  const fireComplete = useCallback(async () => {
    try {
      await onComplete();
      // If onComplete didn't set loading=true (e.g. guard blocked synchronously),
      // the loading→false effect won't fire — nothing to do; parent handles reset.
    } catch {
      // onComplete threw or rejected — reset the slider immediately
      resetSlider();
    }
  }, [onComplete, resetSlider]);

  // Reset whenever loading transitions from true → false (API done)
  useEffect(() => {
    if (!loading) {
      thumbX.value = withSpring(0, SPRING);
      committed.value = false;
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const gesture = Gesture.Pan()
    .enabled(!disabled && !loading)
    // Activate on any horizontal movement; wide Y tolerance so sliding back
    // diagonally doesn't accidentally cancel the gesture
    .activeOffsetX([-4, 4])
    .failOffsetY([-40, 40])
    .onBegin(() => {
      if (committed.value) return;
      // Snapshot where the thumb is right now so delta is relative to it
      startX.value = thumbX.value;
    })
    .onUpdate((e) => {
      if (committed.value) return;
      const maxX = trackWidth.value - THUMB_SIZE - THUMB_MARGIN * 2;
      // startX + translationX naturally goes negative when the user slides left
      // from the origin — Math.max(0) prevents going below the start position,
      // but allows free left-tracking when the thumb is already mid-track
      thumbX.value = Math.min(maxX, Math.max(0, startX.value + e.translationX));
    })
    .onEnd(() => {
      if (committed.value) return;
      const maxX = trackWidth.value - THUMB_SIZE - THUMB_MARGIN * 2;
      const progress = maxX > 0 ? thumbX.value / maxX : 0;

      if (progress >= TRIGGER_THRESHOLD) {
        thumbX.value = withSpring(maxX, SPRING);
        committed.value = true;
        runOnJS(fireComplete)();
      } else {
        // User released before threshold — spring back to start
        thumbX.value = withSpring(0, SPRING);
      }
    });

  // Thumb translation
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  // Fill bar behind thumb — grows with thumb position
  const fillStyle = useAnimatedStyle(() => {
    const maxX = trackWidth.value - THUMB_SIZE - THUMB_MARGIN * 2;
    const progress = maxX > 0 ? thumbX.value / maxX : 0;
    const fillWidth = interpolate(
      progress,
      [0, 1],
      [THUMB_SIZE + THUMB_MARGIN * 2, trackWidth.value],
      Extrapolation.CLAMP,
    );
    return { width: fillWidth };
  });

  // Text fades out as thumb slides forward
  const textStyle = useAnimatedStyle(() => {
    const maxX = trackWidth.value - THUMB_SIZE - THUMB_MARGIN * 2;
    const progress = maxX > 0 ? thumbX.value / maxX : 0;
    return {
      opacity: interpolate(progress, [0, 0.6], [1, 0], Extrapolation.CLAMP),
    };
  });

  // Thumb icon rotates 90° as it reaches the end
  const iconStyle = useAnimatedStyle(() => {
    const maxX = trackWidth.value - THUMB_SIZE - THUMB_MARGIN * 2;
    const progress = maxX > 0 ? thumbX.value / maxX : 0;
    return {
      transform: [
        {
          rotate: `${interpolate(progress, [0, 1], [0, 90], Extrapolation.CLAMP)}deg`,
        },
      ],
    };
  });

  const isInteractive = !disabled && !loading;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[
          styles.track,
          { backgroundColor: TRACK_BG[variant] },
          (disabled || loading) && styles.trackDisabled,
        ]}
        onLayout={(e) => {
          trackWidth.value = e.nativeEvent.layout.width;
        }}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? text}
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
      >
        {/* Fill glow behind the thumb */}
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: FILL_COLOR[variant] },
            fillStyle,
          ]}
          pointerEvents="none"
        />

        {/* Track label — fades out as thumb advances */}
        <Animated.Text
          style={[styles.label, textStyle, !isInteractive && styles.labelDisabled]}
          pointerEvents="none"
        >
          {text}
        </Animated.Text>

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            { left: THUMB_MARGIN },
            thumbStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={variant === 'danger' ? '#FF453A' : '#000'} />
          ) : (
            <Animated.View style={iconStyle}>
              <Ionicons
                name={icon ?? ICON_NAME[variant]}
                size={22}
                color={variant === 'danger' ? '#FF453A' : '#000'}
              />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
  },
  trackDisabled: {
    opacity: 0.45,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: TRACK_HEIGHT / 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
    // Shift right slightly so it sits in the visible portion of the track
    paddingLeft: THUMB_SIZE + THUMB_MARGIN * 2 + 8,
    paddingRight: 16,
    textAlign: 'center',
  },
  labelDisabled: {
    color: '#6C6C6E',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#EDB96D',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for depth
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
});
