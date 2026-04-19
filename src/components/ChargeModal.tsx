import React, { useState, memo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExtraCharge, ChargeType } from '../types/charge';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARGE_TYPES: ChargeType[] = ['MCD', 'Toll', 'Parking'];

const CHARGE_TYPE_ICONS: Record<ChargeType, React.ComponentProps<typeof Ionicons>['name']> = {
  MCD: 'business-outline',
  Toll: 'car-outline',
  Parking: 'map-outline',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChargeModalProps {
  visible: boolean;
  onSubmit: (charge: ExtraCharge) => void;
  onDismiss: () => void;
  /**
   * When provided, the modal opens in EDIT mode:
   *  - Amount and type are pre-filled from this charge.
   *  - Title and submit label change to reflect "Edit".
   *  - onSubmit replaces the existing charge instead of appending.
   */
  initialCharge?: ExtraCharge;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal for adding OR editing an extra charge (MCD / Toll / Parking).
 *
 * ADD mode  (initialCharge = undefined): blank form, "Add Extra Charge" title.
 * EDIT mode (initialCharge = ExtraCharge): pre-filled form, "Edit Extra Charge" title.
 *
 * The parent is responsible for deciding whether to append or replace in the
 * ride store — this component only emits the final ExtraCharge value.
 *
 * Extensibility:
 *  - Replace hardcoded types with a dynamic list from a pricing-rules API.
 *  - Add an optional `note` field for free-text driver descriptions.
 *  - Support multiple charge submissions by keeping the modal open after submit.
 */
const ChargeModal = memo(function ChargeModal({
  visible,
  onSubmit,
  onDismiss,
  initialCharge,
}: ChargeModalProps) {
  const insets = useSafeAreaInsets();
  const isEditMode = initialCharge !== undefined;

  const [amountText, setAmountText] = useState('');
  const [selectedType, setSelectedType] = useState<ChargeType | null>(null);

  // Sync form state whenever the modal opens (covers both add and edit mode)
  useEffect(() => {
    if (visible) {
      if (initialCharge) {
        setAmountText(String(initialCharge.amount));
        setSelectedType(initialCharge.type);
      } else {
        setAmountText('');
        setSelectedType(null);
      }
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedAmount = parseFloat(amountText);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const canSubmit = isAmountValid && selectedType !== null;

  const handleAmountChange = useCallback((text: string) => {
    const sanitized = text.replace(/[^0-9.]/g, '');
    setAmountText(sanitized);
    if (!sanitized) setSelectedType(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !selectedType) return;
    onSubmit({ amount: parsedAmount, type: selectedType });
    setAmountText('');
    setSelectedType(null);
  }, [canSubmit, parsedAmount, selectedType, onSubmit]);

  const handleDismiss = useCallback(() => {
    setAmountText('');
    setSelectedType(null);
    onDismiss();
  }, [onDismiss]);

  const submitLabel = canSubmit
    ? `${isEditMode ? 'Update' : 'Add'} ₹${parsedAmount.toLocaleString('en-IN')} · ${selectedType}`
    : 'Enter amount & select type';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Blurred backdrop — tap to dismiss */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Handle */}
          <View style={styles.header}>
            <View style={styles.handle} />
          </View>

          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleIconWrapper}>
              <Ionicons
                name={isEditMode ? 'create-outline' : 'receipt-outline'}
                size={20}
                color="#EDB96D"
              />
            </View>
            <View>
              <Text style={styles.title}>
                {isEditMode ? 'Edit Extra Charge' : 'Add Extra Charge'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditMode
                  ? 'Update the amount or charge type'
                  : 'Enter amount and select charge type'}
              </Text>
            </View>
          </View>

          {/* Amount input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>CHARGE AMOUNT (₹)</Text>
            <View style={[styles.inputWrapper, isAmountValid && styles.inputWrapperValid]}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="#3A3A3C"
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={7}
                accessibilityLabel="Extra charge amount"
              />
            </View>
          </View>

          {/* Charge type chips */}
          <View style={styles.typeSection}>
            <Text style={[styles.inputLabel, !isAmountValid && styles.labelDisabled]}>
              CHARGE TYPE
            </Text>
            <View style={styles.typeRow}>
              {CHARGE_TYPES.map((type) => {
                const isSelected = selectedType === type;
                const isEnabled = isAmountValid;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeChip,
                      isSelected && styles.typeChipSelected,
                      !isEnabled && styles.typeChipDisabled,
                    ]}
                    onPress={() => isEnabled && setSelectedType(type)}
                    disabled={!isEnabled}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected, disabled: !isEnabled }}
                  >
                    <Ionicons
                      name={CHARGE_TYPE_ICONS[type]}
                      size={16}
                      color={isSelected ? '#000' : isEnabled ? '#EDB96D' : '#3A3A3C'}
                    />
                    <Text
                      style={[
                        styles.typeChipLabel,
                        isSelected && styles.typeChipLabelSelected,
                        !isEnabled && styles.typeChipLabelDisabled,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitWrapper, !canSubmit && styles.submitWrapperDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
          >
            <LinearGradient
              colors={canSubmit ? ['#E5B566', '#B5783C'] : ['#2C2C2E', '#2C2C2E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={canSubmit ? '#000' : '#3A3A3C'}
              />
              <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>
                {submitLabel}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default ChargeModal;

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
  header: {
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
    marginBottom: 24,
  },
  titleIconWrapper: {
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
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  labelDisabled: {
    color: '#3A3A3C',
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
  typeSection: {
    marginBottom: 28,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
  },
  typeChipSelected: {
    backgroundColor: '#EDB96D',
    borderColor: '#EDB96D',
  },
  typeChipDisabled: {
    opacity: 0.4,
  },
  typeChipLabel: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '700',
  },
  typeChipLabelSelected: {
    color: '#000000',
  },
  typeChipLabelDisabled: {
    color: '#3A3A3C',
  },
  submitWrapper: {
    width: '100%',
  },
  submitWrapperDisabled: {
    opacity: 0.7,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  submitTextDisabled: {
    color: '#3A3A3C',
  },
});
