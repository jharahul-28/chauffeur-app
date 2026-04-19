import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExtraCharge } from '../types/charge';

const CHARGE_TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  MCD: 'business-outline',
  Toll: 'car-outline',
  Parking: 'map-outline',
};

interface ChargesSummaryModalProps {
  visible: boolean;
  charges: ExtraCharge[];
  onDismiss: () => void;
  onAddCharge: () => void;
  onEditCharge: (index: number) => void;
}

const ChargesSummaryModal = memo(function ChargesSummaryModal({
  visible,
  charges,
  onDismiss,
  onAddCharge,
  onEditCharge,
}: ChargesSummaryModalProps) {
  const insets = useSafeAreaInsets();

  const total = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Handle */}
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <Ionicons name="receipt-outline" size={20} color="#EDB96D" />
          </View>
          <View style={styles.titleTexts}>
            <Text style={styles.title}>Extra Charges</Text>
            <Text style={styles.subtitle}>
              {charges.length === 0
                ? 'No charges added yet'
                : `${charges.length} charge${charges.length > 1 ? 's' : ''} · ₹${total.toLocaleString('en-IN')}`}
            </Text>
          </View>
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={18} color="#8E8E93" />
          </Pressable>
        </View>

        {/* Charges list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {charges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color="#3A3A3C" />
              <Text style={styles.emptyText}>No extra charges added</Text>
            </View>
          ) : (
            charges.map((charge, index) => (
              <View key={index} style={styles.chargeRow}>
                <View style={styles.chargeLeft}>
                  <View style={styles.chargeIconWrap}>
                    <Ionicons
                      name={CHARGE_TYPE_ICONS[charge.type] ?? 'receipt-outline'}
                      size={16}
                      color="#EDB96D"
                    />
                  </View>
                  <View style={styles.chargeDetails}>
                    <Text style={styles.chargeType}>{charge.type}</Text>
                    <Text style={styles.chargeAmount}>
                      ₹{charge.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => onEditCharge(index)}
                  hitSlop={8}
                  accessibilityLabel={`Edit ${charge.type} charge`}
                >
                  <Ionicons name="create-outline" size={14} color="#EDB96D" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        {/* Total row */}
        {charges.length > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Extra</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        )}

        {/* Add charge button */}
        <Pressable style={styles.addButtonWrapper} onPress={onAddCharge}>
          <LinearGradient
            colors={['#E5B566', '#B5783C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={18} color="#000" />
            <Text style={styles.addButtonText}>Add Extra Charge</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  );
});

export default ChargesSummaryModal;

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: '80%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
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
    paddingTop: 4,
  },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTexts: {
    flex: 1,
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: 260,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    color: '#3A3A3C',
    fontSize: 14,
    fontWeight: '500',
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(237, 185, 109, 0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.15)',
  },
  chargeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chargeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargeDetails: {
    gap: 2,
  },
  chargeType: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chargeAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(237, 185, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.25)',
  },
  editBtnText: {
    color: '#EDB96D',
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    marginTop: 4,
  },
  totalLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: '#FF9F0A',
    fontSize: 18,
    fontWeight: '700',
  },
  addButtonWrapper: {
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
