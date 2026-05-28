// Project Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, StatusBar, TextInput, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/formatters';
import { PAYMENT_METHOD_LABELS } from '../utils/constants';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import CalendarPicker from '../components/CalendarPicker';
import BottomDrawer from '../components/BottomDrawer';
import { projectService } from '../services/projectService';
import { paymentService } from '../services/paymentService';
import useStore from '../store/useStore';
import ConfirmModal from '../components/ConfirmModal';
import InputField from '../components/InputField';

const ProjectDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params;
  const { colors, themeMode } = useTheme();
  const { showToast } = useStore();
  const [project, setProject] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Team & Payments State
  const [newMemberName, setNewMemberName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentNote, setPaymentNote] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => { },
    confirmText: 'Delete',
    type: 'danger',
  });

  const loadData = useCallback(async () => {
    try {
      const projectData = await projectService.getById(projectId);
      let paymentsData = [];
      try {
        paymentsData = await paymentService.getByProjectId(projectId);
      } catch (paymentError) {
        console.warn('Error loading payments:', paymentError);
      }
      setProject(projectData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading project detail:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const handleDeleteProject = () => {
    const performDelete = async () => {
      try {
        await projectService.delete(projectId);
        showToast('Project deleted successfully.', 'success');
        navigation.goBack();
      } catch (error) {
        showToast('Failed to delete project.', 'error');
      }
    };

    setConfirmConfig({
      visible: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All payment records will remain.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: performDelete,
    });
  };

  const handleDeletePayment = (paymentId, amount) => {
    const performDelete = async () => {
      try {
        await paymentService.delete(paymentId);
        const newTotalAdvance = (project.totalAdvance || 0) - amount;
        await projectService.updateFinancials(projectId, Math.max(0, newTotalAdvance), project.totalBudget);
        showToast('Payment deleted successfully.', 'success');
        loadData();
      } catch (error) {
        showToast('Failed to delete payment.', 'error');
      }
    };

    setConfirmConfig({
      visible: true,
      title: 'Delete Payment',
      message: `Delete payment of ${formatCurrency(amount)}?`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: performDelete,
    });
  };

  // Team CRUD handlers
  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      showToast('Please enter a team member name.', 'error');
      return;
    }
    const name = newMemberName.trim();
    const currentMembers = project.teamMembers || [];
    if (currentMembers.includes(name)) {
      showToast('Member already exists.', 'error');
      return;
    }
    const updatedMembers = [...currentMembers, name];
    try {
      await projectService.update(projectId, { teamMembers: updatedMembers });
      setProject({ ...project, teamMembers: updatedMembers });
      setNewMemberName('');
      showToast('Team member added successfully.', 'success');
    } catch (error) {
      showToast('Failed to add team member.', 'error');
    }
  };

  const handleDeleteMember = (name) => {
    const performDelete = async () => {
      const updatedMembers = (project.teamMembers || []).filter(m => m !== name);
      try {
        await projectService.update(projectId, { teamMembers: updatedMembers });
        setProject({ ...project, teamMembers: updatedMembers });
        showToast('Team member removed successfully.', 'success');
      } catch (error) {
        showToast('Failed to remove team member.', 'error');
      }
    };

    setConfirmConfig({
      visible: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${name} from this project?`,
      confirmText: 'Remove',
      type: 'danger',
      onConfirm: performDelete,
    });
  };

  const handleSaveTeamPayment = async () => {
    if (!selectedMember) {
      showToast('Please select a team member.', 'error');
      return;
    }
    if (!paymentAmount.trim() || isNaN(paymentAmount)) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    try {
      const newPayment = {
        id: `tp_${Date.now()}`,
        memberName: selectedMember,
        amount: parseFloat(paymentAmount),
        date: paymentDate.toISOString(),
        note: paymentNote.trim(),
      };

      const currentPayments = project.teamPayments || [];
      const updatedPayments = [newPayment, ...currentPayments];

      await projectService.update(projectId, { teamPayments: updatedPayments });
      setProject({ ...project, teamPayments: updatedPayments });

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedMember('');
      setPaymentDate(new Date());
      setPaymentNote('');
      showToast('Team payment recorded successfully.', 'success');
    } catch (error) {
      showToast('Failed to record team payment.', 'error');
    }
  };

  const handleDeleteTeamPayment = (paymentId) => {
    const performDelete = async () => {
      try {
        const updatedPayments = (project.teamPayments || []).filter(p => p.id !== paymentId);
        await projectService.update(projectId, { teamPayments: updatedPayments });
        setProject({ ...project, teamPayments: updatedPayments });
        showToast('Team payment record deleted.', 'success');
      } catch (error) {
        showToast('Failed to delete payment.', 'error');
      }
    };

    setConfirmConfig({
      visible: true,
      title: 'Delete Payment Record',
      message: 'Are you sure you want to delete this payment record?',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: performDelete,
    });
  };

  // Dynamic styles evaluated using active hook colors
  const styles = getStyles(colors, insets);

  if (loading) return <LoadingSpinner message="Loading project..." />;
  if (!project) return <EmptyState icon="alert-circle-outline" title="Project not found" />;

  const daysLeft = getDaysRemaining(project.deadline);
  const paidPercent = project.totalBudget > 0 ? ((project.totalAdvance || 0) / project.totalBudget) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>{project.projectName}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{project.clientName || 'Project Details & Management'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Project Info */}
        <Card variant="elevated">
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.projectName}>{project.projectName}</Text>
              <Text style={styles.clientName}>{project.clientName || 'Unknown Client'}</Text>
            </View>
            <StatusBadge status={project.status} />
          </View>

          {project.description && (
            <Text style={styles.description}>{project.description}</Text>
          )}

          {/* Timeline */}
          <View style={styles.timelineRow}>
            {project.startDate && (
              <View style={styles.timelineItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
                <Text style={styles.timelineText}>Start: {formatDate(project.startDate)}</Text>
              </View>
            )}
            {project.deadline && (
              <View style={styles.timelineItem}>
                <Ionicons name="flag-outline" size={14} color={COLORS.textTertiary} />
                <Text style={styles.timelineText}>Deadline: {formatDate(project.deadline)}</Text>
              </View>
            )}
          </View>
          {project.deliveryTimeline && (
            <Text style={styles.deliveryText}>📅 {project.deliveryTimeline}</Text>
          )}
          {daysLeft !== null && project.status !== 'completed' && (
            <Text
              style={[
                styles.daysLeftText,
                { color: daysLeft < 0 ? COLORS.danger : daysLeft < 3 ? COLORS.warning : COLORS.success },
              ]}
            >
              {daysLeft < 0 ? `⚠️ ${Math.abs(daysLeft)} days overdue` : `⏳ ${daysLeft} days remaining`}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddProject', { project })}>
              <Ionicons name="create-outline" size={16} color={COLORS.accent} />
              <Text style={[styles.actionText, { color: COLORS.accent }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleDeleteProject}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Financial Summary */}
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <Card>
          <View style={styles.financeGrid}>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Budget</Text>
              <Text style={styles.financeValue}>{formatCurrency(project.totalBudget)}</Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Paid</Text>
              <Text style={[styles.financeValue, { color: COLORS.success }]}>
                {formatCurrency(project.totalAdvance || 0)}
              </Text>
            </View>
            <View style={styles.financeItem}>
              <Text style={styles.financeLabel}>Total Due</Text>
              <Text style={[styles.financeValue, { color: COLORS.danger }]}>
                {formatCurrency(project.totalDue || 0)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(paidPercent, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{paidPercent.toFixed(0)}% paid</Text>
          </View>
        </Card>

        {/* Payments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddPayment', {
              projectId: project.id,
              clientId: project.clientId,
              projectName: project.projectName,
              totalBudget: project.totalBudget,
              totalAdvance: project.totalAdvance || 0,
            })}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {payments.length === 0 ? (
          <Card>
            <Text style={styles.emptyPayment}>No payments recorded yet</Text>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id}>
              <View style={styles.paymentRow}>
                <View style={[styles.paymentIcon, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="cash-outline" size={20} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <Text style={styles.paymentMeta}>
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                    {payment.paymentDate ? ` • ${formatDate(payment.paymentDate)}` : ''}
                  </Text>
                  {payment.note && <Text style={styles.paymentNote}>{payment.note}</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // console.log('handleDeletePayment called for paymentId:', payment.id);
                    handleDeletePayment(payment.id, payment.amount);
                  }}
                  style={{
                    padding: 10,
                    margin: -5,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...Platform.select({ web: { cursor: 'pointer' }, default: {} })
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Project Team Members Card */}
        <Text style={styles.sectionTitle}>Project Team Members</Text>
        <Card>
          <View style={styles.inlineAddRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Team Member Name"
                placeholder="Enter team member name..."
                value={newMemberName}
                onChangeText={setNewMemberName}
                style={{ marginBottom: 0 }}
                labelBgColor={colors.surface}
              />
            </View>
            <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddMember}>
              <Ionicons name="add" size={20} color={COLORS.textInverse} />
            </TouchableOpacity>
          </View>

          {(!project.teamMembers || project.teamMembers.length === 0) ? (
            <Text style={styles.emptyText}>No team members assigned yet</Text>
          ) : (
            <View style={styles.pillsContainer}>
              {project.teamMembers.map((member, index) => (
                <View key={index} style={styles.memberPill}>
                  <Text style={styles.memberPillText}>{member}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      // console.log('handleDeleteMember called for member:', member);
                      handleDeleteMember(member);
                    }}
                    style={{
                      padding: 2,
                      marginLeft: 2,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...Platform.select({ web: { cursor: 'pointer' }, default: {} })
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="close" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Team Member Payments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payments to Team Members</Text>
          <TouchableOpacity onPress={() => {
            if (!project.teamMembers || project.teamMembers.length === 0) {
              showToast('Please add a team member first.', 'error');
              return;
            }
            // Auto-select first member by default for frictionless UX
            if (project.teamMembers && project.teamMembers.length > 0) {
              setSelectedMember(project.teamMembers[0]);
            }
            setShowPaymentModal(true);
          }}>
            <Ionicons name="add-circle" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {(!project.teamPayments || project.teamPayments.length === 0) ? (
          <Card>
            <Text style={styles.emptyPayment}>No team payments recorded yet</Text>
          </Card>
        ) : (
          project.teamPayments.map((payment) => (
            <Card key={payment.id}>
              <View style={styles.paymentRow}>
                <View style={[styles.paymentIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <Text style={styles.paymentMeta}>
                    Paid to: {payment.memberName}
                    {payment.date ? ` • ${formatDate(payment.date)}` : ''}
                  </Text>
                  {payment.note ? <Text style={styles.paymentNote}>{payment.note}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // console.log('handleDeleteTeamPayment called for paymentId:', payment.id);
                    handleDeleteTeamPayment(payment.id);
                  }}
                  style={{
                    padding: 10,
                    margin: -5,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...Platform.select({ web: { cursor: 'pointer' }, default: {} })
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Record Team Payment Drawer */}
        <BottomDrawer
          visible={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMember('');
            setPaymentAmount('');
            setPaymentNote('');
          }}
          title="Record Team Payment"
          height={500}
        >
          <Text style={styles.fieldLabel}>Select Team Member</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberSelectRow}>
            {project.teamMembers?.map((member) => (
              <TouchableOpacity
                key={member}
                style={[styles.memberSelectPill, selectedMember === member && styles.memberSelectPillActive]}
                onPress={() => setSelectedMember(member)}
              >
                <Text style={[styles.memberSelectPillText, selectedMember === member && styles.memberSelectPillTextActive]}>
                  {member}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <InputField
            label="Amount (BDT) *"
            placeholder="e.g. 5000"
            keyboardType="numeric"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            labelBgColor={colors.surface}
          />

          <InputField
            label="Date"
            value={paymentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            onPress={() => setShowCalendar(true)}
            icon="calendar-outline"
            labelBgColor={colors.surface}
          />

          <InputField
            label="Note (e.g. advance, final payout)"
            placeholder="Payment note"
            value={paymentNote}
            onChangeText={setPaymentNote}
            labelBgColor={colors.surface}
          />

          <CalendarPicker
            visible={showCalendar}
            onClose={() => setShowCalendar(false)}
            selectedDate={paymentDate}
            onSelectDate={(date) => {
              if (date) setPaymentDate(date);
            }}
          />

          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={() => {
              setShowPaymentModal(false);
              setSelectedMember('');
              setPaymentAmount('');
              setPaymentNote('');
            }} variant="outline" style={{ flex: 1 }} />

            <Button title="Record Payment" onPress={handleSaveTeamPayment} variant="primary" style={{ flex: 1.5 }} />
          </View>
        </BottomDrawer>

        <View style={styles.addPaymentBtn}>
          <Button
            title="Record Payment"
            onPress={() => navigation.navigate('AddPayment', {
              projectId: project.id,
              clientId: project.clientId,
              projectName: project.projectName,
              totalBudget: project.totalBudget,
              totalAdvance: project.totalAdvance || 0,
            })}
            icon="add-circle-outline"
            variant="secondary"
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={confirmConfig.visible}
        onClose={() => setConfirmConfig({ ...confirmConfig, visible: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
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
    fontSize: FONT_SIZE.xl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  scrollContent: { padding: SPACING.lg, paddingBottom: Math.max((insets?.bottom || 0), 16) + 24 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  projectName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
  clientName: { fontSize: FONT_SIZE.md, color: colors.textSecondary, marginTop: 2 },
  description: { fontSize: FONT_SIZE.md, color: colors.textSecondary, lineHeight: 22, marginBottom: SPACING.md },
  timelineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.lg, marginBottom: SPACING.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  timelineText: { fontSize: FONT_SIZE.sm, color: colors.textSecondary },
  deliveryText: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginBottom: SPACING.xs },
  daysLeftText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, marginTop: SPACING.xs },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: SPACING.md, paddingTop: SPACING.md, gap: SPACING.xl },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  actionText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
  financeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  financeItem: { alignItems: 'center' },
  financeLabel: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 4 },
  financeValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
  progressContainer: { marginTop: SPACING.lg },
  progressBar: { height: 8, backgroundColor: colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
  progressText: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, marginTop: SPACING.xs, textAlign: 'right' },
  paymentRow: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  paymentAmount: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semiBold, color: colors.textPrimary },
  paymentMeta: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: 2 },
  paymentNote: { fontSize: FONT_SIZE.xs, color: colors.textTertiary, marginTop: 2 },
  emptyPayment: { textAlign: 'center', color: colors.textSecondary, paddingVertical: SPACING.lg },
  addPaymentBtn: { marginTop: SPACING.md },

  // Team Member tracking styles
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },
  inlineInput: {
    flex: 1,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border + '60',
    paddingHorizontal: SPACING.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  inlineAddBtn: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 0,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '12',
    borderColor: colors.primary + '25',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  memberPillText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  memberPillClose: {
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  memberSelectRow: {
    maxHeight: 46,
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  memberSelectPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border + '25',
    marginRight: SPACING.xs,
    height: 36,
    justifyContent: 'center',
  },
  memberSelectPillActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  memberSelectPillText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  memberSelectPillTextActive: {
    color: colors.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border + '25',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border + '60',
    paddingHorizontal: SPACING.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: SPACING.md,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border + '25',
    paddingHorizontal: SPACING.md,
    backgroundColor: colors.background,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  dateSelectorText: {
    fontSize: FONT_SIZE.md,
    color: colors.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
});

export default ProjectDetailScreen;
