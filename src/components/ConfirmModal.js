// Premium Custom Confirmation Modal Component
// Supports both Web and Mobile with beautiful design and light/dark theme hot-swapping
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useTheme, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, COLORS } from '../theme';
import Button from './Button';

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' or 'primary'
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border + '25' }]}>
              {/* Header Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              
              {/* Message Description */}
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
              
              {/* Button Actions Row */}
              <View style={styles.buttonRow}>
                <Button
                  title={cancelText}
                  onPress={onClose}
                  variant="outline"
                  style={styles.btn}
                />
                <Button
                  title={confirmText}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  variant={type === 'danger' ? 'danger' : 'primary'}
                  style={styles.btnConfirm}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.xl,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
  btnConfirm: {
    flex: 1.3,
  },
});

export default ConfirmModal;
