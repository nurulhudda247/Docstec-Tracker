// Add Payment Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, Modal, StatusBar, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarPicker from '../components/CalendarPicker';
import BottomDrawer from '../components/BottomDrawer';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../theme';
import { formatCurrency } from '../utils/formatters';
import { PAYMENT_METHODS } from '../utils/constants';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { paymentService } from '../services/paymentService';
import { projectService } from '../services/projectService';
import useStore from '../store/useStore';

const AddPaymentScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId, clientId, projectName, totalBudget, totalAdvance } = route.params;
  const { colors, themeMode } = useTheme();
  const { showToast } = useStore();

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  const remaining = totalBudget - totalAdvance;
  const selectedMethodLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod;

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setSaving(true);
    try {
      await paymentService.create({
        projectId,
        clientId,
        amount: parsedAmount,
        paymentDate,
        paymentMethod,
        note: note.trim(),
      });

      const newTotalAdvance = totalAdvance + parsedAmount;
      await projectService.updateFinancials(projectId, newTotalAdvance, totalBudget);

      showToast('Payment recorded successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const styles = getStyles(colors, insets);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <Text style={styles.headerSubtitle}>Log a new financial transaction for billing records</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Project Context */}
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Recording payment for</Text>
          <Text style={styles.contextProject}>{projectName}</Text>
          <View style={styles.contextStats}>
            <View style={styles.contextStat}>
              <Text style={styles.contextStatLabel}>Budget</Text>
              <Text style={styles.contextStatValue}>{formatCurrency(totalBudget)}</Text>
            </View>
            <View style={styles.contextStat}>
              <Text style={styles.contextStatLabel}>Paid</Text>
              <Text style={[styles.contextStatValue, { color: colors.success }]}>
                {formatCurrency(totalAdvance)}
              </Text>
            </View>
            <View style={styles.contextStat}>
              <Text style={styles.contextStatLabel}>Remaining</Text>
              <Text style={[styles.contextStatValue, { color: colors.danger }]}>
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
        </View>

        <InputField
          label="Amount (BDT)"
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 25000"
          keyboardType="numeric"
          icon="cash-outline"
          required
        />

        <View style={styles.dateRow}>
          <InputField
            label="Payment Date"
            value={paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            onPress={() => setShowDatePicker(true)}
            icon="calendar-outline"
            style={{ flex: 1 }}
            required
          />

          <InputField
            label="Payment Method"
            value={selectedMethodLabel}
            onPress={() => setShowMethodPicker(true)}
            icon="card-outline"
            style={{ flex: 1 }}
            required
          />
        </View>

        <CalendarPicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          selectedDate={paymentDate}
          onSelectDate={(date) => {
            if (date) setPaymentDate(date);
          }}
        />

        <InputField
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Mobilization Advance"
          icon="document-text-outline"
        />

        <View style={styles.buttonRow}>
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="outline" style={{ flex: 1 }} />
          <Button
            title="Record Payment"
            onPress={handleSave}
            loading={saving}
            icon="checkmark-outline"
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>

      {/* Method Picker Drawer */}
      <BottomDrawer
        visible={showMethodPicker}
        onClose={() => setShowMethodPicker(false)}
        title="Payment Method"
        height={320}
      >
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.value}
            style={[styles.modalItem, paymentMethod === method.value && styles.modalItemActive]}
            onPress={() => {
              setPaymentMethod(method.value);
              setShowMethodPicker(false);
            }}
          >
            <Text style={styles.modalItemText}>{method.label}</Text>
            {paymentMethod === method.value && (
              <Ionicons name="checkmark" size={20} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        ))}
      </BottomDrawer>
    </View>
  );
};

const getStyles = (colors, insets) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingTop: Math.max((insets?.top || 0), SPACING.md) + (Platform.OS === 'ios' ? 10 : 15),
    paddingBottom: Math.max((insets?.bottom || 0), 16) + 24,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '15', // Super soft border line
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '25',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  scrollContent: { padding: SPACING.xl, paddingBottom: Math.max((insets?.bottom || 0), 16) + 24},
  contextCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    marginBottom: SPACING.xl,
  },
  contextLabel: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
  contextProject: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, marginTop: 4 },
  contextStats: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.md },
  contextStat: { flex: 1 },
  contextStatLabel: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, textTransform: 'uppercase' },
  contextStatValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, marginTop: 2 },
  sectionTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: colors.textSecondary, marginBottom: SPACING.lg, textTransform: 'uppercase', letterSpacing: 1 },
  dateRow: { flexDirection: 'row', gap: SPACING.md },
  buttonRow: { flexDirection: 'row', marginTop: SPACING.xl, gap: SPACING.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, maxHeight: '50%',
    borderWidth: 1, borderColor: colors.border + '25',
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, marginBottom: SPACING.lg },
  modalItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xs,
  },
  modalItemActive: { backgroundColor: colors.accent + '10' },
  modalItemText: { fontSize: FONT_SIZE.md, color: colors.textPrimary },
});

export default AddPaymentScreen;
