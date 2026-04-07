import React, { useState, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import OtpInput from './OtpInput';
import { MOCK_OTP } from '../data/mockTripData';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OTPModalProps {
  visible: boolean;
  riderName: string;
  /**
   * Called when the correct OTP is entered.
   * Swap the body of this callback to hit a real API endpoint:
   *   const res = await verifyOtp(enteredOtp);
   *   if (res.ok) onSuccess();
   */
  onSuccess: () => void;
  /** Called when the driver dismisses the modal without verifying. */
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const OTP_LENGTH = 4;
const EMPTY_OTP = () => Array<string>(OTP_LENGTH).fill('');

export default function OTPModal({
  visible,
  riderName,
  onSuccess,
  onDismiss,
}: OTPModalProps) {
  const [otp, setOtp] = useState<string[]>(EMPTY_OTP());
  const [hasError, setHasError] = useState(false);
  const firstInputRef = useRef<TextInput | null>(null);

  const isComplete = otp.every((d) => d !== '');

  const reset = useCallback(() => {
    setOtp(EMPTY_OTP());
    setHasError(false);
  }, []);

  const handleOtpChange = useCallback((newOtp: string[]) => {
    setOtp(newOtp);
    // Clear error as soon as the driver starts correcting
    if (hasError) setHasError(false);
  }, [hasError]);

  const handleVerify = useCallback(() => {
    const entered = otp.join('');
    if (entered === MOCK_OTP) {
      reset();
      onSuccess();
    } else {
      setHasError(true);
      // Clear the entered digits so the driver can retry immediately
      setOtp(EMPTY_OTP());
      // Re-focus the first box after a tick (so the clear has applied)
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [otp, onSuccess, reset]);

  const handleDismiss = useCallback(() => {
    reset();
    onDismiss();
  }, [onDismiss, reset]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <BlurView intensity={55} tint="dark" style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            {/* ── Close button ──────────────────────────────────────────── */}
            <Pressable
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={10}
            >
              <Ionicons name="close" size={18} color="#8E8E93" />
            </Pressable>

            {/* ── Header ────────────────────────────────────────────────── */}
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              Ask{' '}
              <Text style={styles.riderHighlight}>{riderName}</Text>
              {' '}for the ride OTP
            </Text>

            {/* ── OTP boxes ─────────────────────────────────────────────── */}
            <View style={styles.otpWrapper}>
              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                firstInputRef={firstInputRef}
              />
            </View>

            {/* ── Error message ─────────────────────────────────────────── */}
            <View style={styles.errorPlaceholder}>
              {hasError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color="#FF453A" />
                  <Text style={styles.errorText}>
                    Incorrect OTP. Please try again.
                  </Text>
                </View>
              )}
            </View>

            {/* ── Continue button ───────────────────────────────────────── */}
            <Pressable
              onPress={handleVerify}
              disabled={!isComplete}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={isComplete ? ['#E5B566', '#B5783C'] : ['#3A3A3C', '#2C2C2E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text
                  style={[
                    styles.buttonText,
                    !isComplete && styles.buttonTextDisabled,
                  ]}
                >
                  Continue
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 24,
  },

  // Close
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  // Header
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  riderHighlight: {
    color: '#EDB96D',
    fontWeight: '600',
  },

  // OTP
  otpWrapper: {
    marginBottom: 4,
  },

  // Error — fixed height so layout doesn't jump
  errorPlaceholder: {
    height: 28,
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '500',
  },

  // Button
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonTextDisabled: {
    color: '#6C6C6E',
  },
});
