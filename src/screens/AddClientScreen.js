// Add/Edit Client Screen
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { clientService } from '../services/clientService';
import useStore from '../store/useStore';

const AddClientScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const editClient = route.params?.client;
  const isEditing = !!editClient;
  const { colors, themeMode } = useTheme();
  const { showToast } = useStore();

  const [name, setName] = useState(editClient?.name || '');
  const [contactPerson, setContactPerson] = useState(editClient?.contactPerson || '');
  const [address, setAddress] = useState(editClient?.address || '');
  const [email, setEmail] = useState(editClient?.email || '');
  const [phone, setPhone] = useState(editClient?.phone || '');
  const [notes, setNotes] = useState(editClient?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    if (route.params?.fromDashboard) {
      navigation.navigate('DashboardDrawer');
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Client name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        address: address.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      };

      if (isEditing) {
        await clientService.update(editClient.id, data);
        showToast('Client updated successfully.', 'success');
      } else {
        await clientService.create(data);
        showToast('Client added successfully.', 'success');
      }
      handleBack();
    } catch (error) {
      console.error('Error saving client:', error);
      showToast('Failed to save client. Please try again.', 'error');
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
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Client' : 'Add Client'}</Text>
          <Text style={styles.headerSubtitle}>
            {isEditing ? 'Update contact and billing information' : 'Create a new client profile for project tracking'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <InputField
          label="Company / Client Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Decision Maker LTD"
          icon="business-outline"
          required
        />

        <InputField
          label="Contact Person"
          value={contactPerson}
          onChangeText={setContactPerson}
          placeholder="e.g. Founder / CEO"
          icon="person-outline"
        />

        <InputField
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Dhaka, Bangladesh"
          icon="location-outline"
        />

        <InputField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="e.g. client@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
        />

        <InputField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +880 1XXXXXXXXX"
          keyboardType="phone-pad"
          icon="call-outline"
        />

        <InputField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
          icon="document-text-outline"
        />

        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            onPress={handleBack}
            variant="outline"
            style={styles.cancelBtn}
          />
          <Button
            title={isEditing ? 'Update Client' : 'Add Client'}
            onPress={handleSave}
            loading={saving}
            icon={isEditing ? 'checkmark-outline' : 'add-outline'}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: Math.max((insets?.bottom || 0), SPACING.md) + SPACING.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});

export default AddClientScreen;
