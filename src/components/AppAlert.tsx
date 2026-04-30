import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppAlertButton {
  text: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'danger';
}

export interface AppAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AppAlertButton[];
  onClose?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AppAlert = memo(function AppAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppAlertProps) {
  // Fallback to a single OK button when none are provided
  const resolvedButtons: AppAlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', onPress: onClose ?? (() => {}), type: 'primary' }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Title */}
          {title ? <Text style={styles.title}>{title}</Text> : null}

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={[styles.buttonRow, resolvedButtons.length === 1 && styles.buttonRowSingle]}>
            {resolvedButtons.map((btn, index) => (
              <AlertButton
                key={index}
                button={btn}
                isLast={index === resolvedButtons.length - 1}
                fullWidth={resolvedButtons.length === 1}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

export default AppAlert;

// ─── AlertButton sub-component ────────────────────────────────────────────────

interface AlertButtonProps {
  button: AppAlertButton;
  isLast: boolean;
  fullWidth: boolean;
}

const AlertButton = memo(function AlertButton({ button, isLast, fullWidth }: AlertButtonProps) {
  const { text, onPress, type = 'secondary' } = button;

  if (type === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.buttonBase,
          styles.primaryButton,
          fullWidth && styles.buttonFull,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={text}
      >
        <Text style={styles.primaryText}>{text}</Text>
      </Pressable>
    );
  }

  if (type === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.buttonBase,
          styles.dangerButton,
          fullWidth && styles.buttonFull,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={text}
      >
        <Text style={styles.dangerText}>{text}</Text>
      </Pressable>
    );
  }

  // secondary (default)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.secondaryButton,
        fullWidth && styles.buttonFull,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={text}
    >
      <Text style={styles.secondaryText}>{text}</Text>
    </Pressable>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(237, 185, 109, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    color: '#AEAEB2',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 4,
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  buttonBase: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  primaryButton: {
    backgroundColor: '#E5B566',
  },
  primaryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'rgba(237,185,109,0.3)',
  },
  secondaryText: {
    color: '#EDB96D',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dangerButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.35)',
  },
  dangerText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
