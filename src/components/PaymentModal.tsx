import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentModalProps {
  visible: boolean;
  /** Maximum collectible amount — driver cannot enter more than this. */
  balanceAmount: number;
  /** Called with 0 on cancel, positive amount on Pay. */
  onClose: () => void;
  /** Called with the entered amount when driver taps "Pay". */
  onSubmit: (amount: number) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentModal = memo(function PaymentModal({
  visible,
  balanceAmount,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();

  const [amountText, setAmountText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Reset state each time the modal opens
  useEffect(() => {
    if (visible) {
      setAmountText('');
      setIsSubmitting(false);
      setErrorText('');
    }
  }, [visible]);

  const parsedAmount = parseFloat(amountText);
  const isAmountValid =
    amountText.trim() !== '' &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= balanceAmount;

  const canPay = isAmountValid && !isSubmitting;

  const handleAmountChange = useCallback((text: string) => {
    // Allow digits and a single decimal point only
    const sanitized = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setAmountText(sanitized);
    setErrorText('');
  }, []);

  const handlePay = useCallback(async () => {
    if (!canPay) return;

    const amount = parseFloat(amountText);

    // Inline validation guard (belt-and-suspenders)
    if (amount <= 0) {
      setErrorText('Amount must be greater than 0.');
      return;
    }
    if (amount > balanceAmount) {
      setErrorText(`Amount cannot exceed ₹${balanceAmount.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorText('');
    try {
      await onSubmit(amount);
      // onSubmit is responsible for closing the modal on success
    } catch {
      // Error display is handled by the parent via Alert; just re-enable button
      setIsSubmitting(false);
    }
  }, [canPay, amountText, balanceAmount, onSubmit]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const validationMessage = (() => {
    if (errorText) return errorText;
    if (amountText.trim() === '') return null;
    if (isNaN(parsedAmount)) return 'Please enter a valid number.';
    if (parsedAmount <= 0) return 'Amount must be greater than 0.';
    if (parsedAmount > balanceAmount)
      return `Amount cannot exceed ₹${balanceAmount.toLocaleString('en-IN')}.`;
    return null;
  })();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* ── Handle ─────────────────────────────────────────────────────── */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* ── Title row ──────────────────────────────────────────────────── */}
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="wallet-outline" size={20} color="#EDB96D" />
            </View>
            <View>
              <Text style={styles.title}>Collect Payment</Text>
              <Text style={styles.subtitle}>Enter the amount received from the rider</Text>
            </View>
          </View>

          {/* ── Balance display ────────────────────────────────────────────── */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Amount</Text>
            <Text style={styles.balanceValue}>
              ₹{balanceAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>

          {/* ── Amount input ───────────────────────────────────────────────── */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>AMOUNT PAID (₹)</Text>
            <View
              style={[
                styles.inputWrapper,
                isAmountValid && styles.inputWrapperValid,
                validationMessage ? styles.inputWrapperError : null,
              ]}
            >
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#3A3A3C"
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={10}
                editable={!isSubmitting}
                accessibilityLabel="Amount paid"
              />
            </View>

            {/* Inline validation message — fixed height to prevent layout jump */}
            <View style={styles.errorPlaceholder}>
              {validationMessage ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={13} color="#FF453A" />
                  <Text style={styles.errorText}>{validationMessage}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <View style={styles.buttonRow}>
            {/* Cancel */}
            <Pressable
              style={[styles.cancelBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleClose}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              <Text style={[styles.cancelBtnText, isSubmitting && styles.textDisabled]}>
                Cancel
              </Text>
            </Pressable>

            {/* Pay */}
            <Pressable
              style={[styles.payBtnWrapper, !canPay && styles.payBtnDisabled]}
              onPress={handlePay}
              disabled={!canPay}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPay }}
            >
              <LinearGradient
                colors={canPay ? ['#E5B566', '#B5783C'] : ['#2C2C2E', '#2C2C2E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payBtn}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#8E8E93" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={canPay ? '#000' : '#3A3A3C'}
                    />
                    <Text style={[styles.payBtnText, !canPay && styles.payBtnTextDisabled]}>
                      Pay
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default PaymentModal;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 185, 109, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.2)',
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  balanceValue: {
    color: '#EDB96D',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputSection: {
    marginBottom: 8,
  },
  inputLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    gap: 4,
  },
  inputWrapperValid: {
    borderColor: 'rgba(237, 185, 109, 0.5)',
  },
  inputWrapperError: {
    borderColor: 'rgba(255, 69, 58, 0.5)',
  },
  currencySymbol: {
    color: '#8E8E93',
    fontSize: 22,
    fontWeight: '600',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    padding: 0,
  },
  errorPlaceholder: {
    height: 24,
    justifyContent: 'center',
    marginTop: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payBtnWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  payBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  payBtnTextDisabled: {
    color: '#3A3A3C',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  textDisabled: {
    color: '#3A3A3C',
  },
});
