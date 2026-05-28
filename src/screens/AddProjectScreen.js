// Add/Edit Project Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarPicker from '../components/CalendarPicker';
import BottomDrawer from '../components/BottomDrawer';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from '../utils/constants';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { projectService } from '../services/projectService';
import { clientService } from '../services/clientService';
import useStore from '../store/useStore';

const AddProjectScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useStore();
  const editProject = route.params?.project;
  const presetClientId = route.params?.clientId;
  const presetClientName = route.params?.clientName;
  const isEditing = !!editProject;
  const { colors, themeMode } = useTheme();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(editProject?.clientId || presetClientId || '');
  const [selectedClientName, setSelectedClientName] = useState(editProject?.clientName || presetClientName || '');
  const [projectName, setProjectName] = useState(editProject?.projectName || '');
  const [description, setDescription] = useState(editProject?.description || '');
  const [totalBudget, setTotalBudget] = useState(editProject?.totalBudget?.toString() || '');
  const [status, setStatus] = useState(editProject?.status || PROJECT_STATUS.PENDING);
  const [startDate, setStartDate] = useState(
    editProject?.startDate?.toDate ? editProject.startDate.toDate() : new Date()
  );
  const [deadline, setDeadline] = useState(
    editProject?.deadline?.toDate ? editProject.deadline.toDate() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );
  const [deliveryTimeline, setDeliveryTimeline] = useState(editProject?.deliveryTimeline || '');
  const [notes, setNotes] = useState(editProject?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    if (route.params?.fromDashboard) {
      navigation.navigate('DashboardDrawer');
    } else {
      navigation.goBack();
    }
  };

  const [showStartDate, setShowStartDate] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getAll();
        setClients(data);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, []);

  const handleSave = async () => {
    if (!projectName.trim()) {
      showToast('Project name is required.', 'error');
      return;
    }
    if (!selectedClientId) {
      showToast('Please select a client.', 'error');
      return;
    }

    setSaving(true);
    try {
      const data = {
        clientId: selectedClientId,
        clientName: selectedClientName,
        projectName: projectName.trim(),
        description: description.trim(),
        totalBudget: parseFloat(totalBudget) || 0,
        status,
        startDate,
        deadline,
        deliveryTimeline: deliveryTimeline.trim(),
        notes: notes.trim(),
      };

      if (isEditing) {
        await projectService.update(editProject.id, data);
        showToast('Project updated successfully.', 'success');
      } else {
        await projectService.create(data);
        showToast('Project added successfully.', 'success');
      }
      handleBack();
    } catch (error) {
      console.error('Error saving project:', error);
      showToast('Failed to save project.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statuses = Object.entries(PROJECT_STATUS_LABELS);
  const styles = getStyles(colors, insets);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Project' : 'Add Project'}</Text>
          <Text style={styles.headerSubtitle}>
            {isEditing ? 'Update your project parameters and financials' : 'Create a new project pipeline and timeline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Client Picker */}

        <InputField
          label="Client"
          value={selectedClientName}
          onPress={() => setShowClientPicker(true)}
          icon="people-outline"
          required
        />

        <InputField
          label="Project Name"
          value={projectName}
          onChangeText={setProjectName}
          placeholder="e.g. Website Redesign"
          icon="briefcase-outline"
          required
        />

        <InputField
          label="Total Budget (BDT)"
          value={totalBudget}
          onChangeText={setTotalBudget}
          placeholder="e.g. 75000"
          keyboardType="numeric"
          icon="wallet-outline"
          required
        />

        <InputField
          label="Status"
          value={PROJECT_STATUS_LABELS[status]}
          onPress={() => setShowStatusPicker(true)}
          icon="flag-outline"
        />

        {/* Dates */}
        <Text style={styles.sectionTitle}>Timeline</Text>

        <View style={styles.dateRow}>
          <InputField
            label="Start Date"
            value={formatDisplayDate(startDate)}
            onPress={() => setShowStartDate(true)}
            icon="calendar-outline"
            style={{ flex: 1 }}
          />
          <InputField
            label="Deadline"
            value={formatDisplayDate(deadline)}
            onPress={() => setShowDeadline(true)}
            icon="calendar-outline"
            style={{ flex: 1 }}
          />
        </View>

        <CalendarPicker
          visible={showStartDate}
          onClose={() => setShowStartDate(false)}
          selectedDate={startDate}
          onSelectDate={(date) => {
            if (date) setStartDate(date);
          }}
        />
        <CalendarPicker
          visible={showDeadline}
          onClose={() => setShowDeadline(false)}
          selectedDate={deadline}
          onSelectDate={(date) => {
            if (date) setDeadline(date);
          }}
        />

        <InputField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            onPress={handleBack}
            variant="outline" style={styles.cancelBtn} />
          <Button
            title={isEditing ? 'Update' : 'Add Project'}
            onPress={handleSave}
            loading={saving}
            icon={isEditing ? 'checkmark-outline' : 'add-outline'}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>

      {/* Client Picker Drawer */}
      <BottomDrawer
        visible={showClientPicker}
        onClose={() => setShowClientPicker(false)}
        title="Select Client"
        height={380}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {clients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[styles.modalItem, selectedClientId === client.id && styles.modalItemActive]}
              onPress={() => {
                setSelectedClientId(client.id);
                setSelectedClientName(client.name);
                setShowClientPicker(false);
              }}
            >
              <Text style={styles.modalItemText}>{client.name}</Text>
              {selectedClientId === client.id && (
                <Ionicons name="checkmark" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomDrawer>

      {/* Status Picker Drawer */}
      <BottomDrawer
        visible={showStatusPicker}
        onClose={() => setShowStatusPicker(false)}
        title="Select Status"
        height={320}
      >
        {statuses.map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.modalItem, status === key && styles.modalItemActive]}
            onPress={() => {
              setStatus(key);
              setShowStatusPicker(false);
            }}
          >
            <Text style={styles.modalItemText}>{label}</Text>
            {status === key && <Ionicons name="checkmark" size={20} color={colors.accent} />}
          </TouchableOpacity>
        ))}
      </BottomDrawer>
    </View>
  );
};

const getStyles = (colors, insets) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingTop: Math.max((insets?.top || 0), SPACING.md) + (Platform.OS === 'ios' ? 10 : 15),
    paddingBottom: SPACING.lg,
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
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: Math.max((insets?.bottom || 0), SPACING.md) + SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.xl, // Increase for modern breathing space
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
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
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: colors.border + '25',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    marginBottom: SPACING.lg,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  modalItemActive: {
    backgroundColor: colors.accent + '10',
  },
  modalItemText: {
    fontSize: FONT_SIZE.md,
    color: colors.textPrimary,
  },
});

export default AddProjectScreen;
