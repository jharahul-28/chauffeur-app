import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StopActionButtonsProps {
  /**
   * Resolved waypointId from the booking waypoint list.
   * When null, mapping failed — buttons are disabled to prevent a bad API call.
   */
  waypointId: number | null;
  /** True while the arrived-at-stop API call is in-flight. */
  isArriving?: boolean;
  /** True while the skip-stop API call is in-flight. */
  isSkipping?: boolean;
  onArrived: () => void;
  onSkip: () => void;
}

const StopActionButtons = memo(function StopActionButtons({
  waypointId,
  isArriving = false,
  isSkipping = false,
  onArrived,
  onSkip,
}: StopActionButtonsProps) {
  const mappingFailed = waypointId === null;
  const anyLoading = isArriving || isSkipping;
  const arrivedDisabled = anyLoading || mappingFailed;
  const skipDisabled = anyLoading || mappingFailed;

  return (
    <View style={styles.container}>
      {/* Arrived */}
      <Pressable
        style={[styles.arrivedButton, arrivedDisabled && styles.buttonDisabled]}
        onPress={onArrived}
        disabled={arrivedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Mark stop as arrived"
      >
        {isArriving ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={15} color="#000" />
            <Text style={styles.arrivedText}>Arrived</Text>
          </>
        )}
      </Pressable>

      {/* Skip */}
      <Pressable
        style={[styles.skipButton, skipDisabled && styles.buttonDisabled]}
        onPress={onSkip}
        disabled={skipDisabled}
        accessibilityRole="button"
        accessibilityLabel="Skip this stop"
      >
        {isSkipping ? (
          <ActivityIndicator size="small" color="#8E8E93" />
        ) : (
          <>
            <Ionicons name="play-skip-forward-outline" size={15} color={skipDisabled ? '#48484A' : '#8E8E93'} />
            <Text style={[styles.skipText, skipDisabled && styles.skipTextDisabled]}>Skip</Text>
          </>
        )}
      </Pressable>

      {/* Mapping-failed warning — only visible when waypointId could not be resolved */}
      {mappingFailed && (
        <Ionicons
          name="warning-outline"
          size={14}
          color="#FF9F0A"
          style={styles.warningIcon}
          accessibilityLabel="Stop could not be identified"
        />
      )}
    </View>
  );
});

export default StopActionButtons;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 32,
  },
  arrivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDB96D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  arrivedText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  skipTextDisabled: {
    color: '#48484A',
  },
  warningIcon: {
    marginLeft: 2,
  },
});
