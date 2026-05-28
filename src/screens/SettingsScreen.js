import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Switch, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, storage, db } from '../config/firebase';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { APP_NAME } from '../utils/constants';
import Card from '../components/Card';
import ConfirmModal from '../components/ConfirmModal';
import HamburgerButton from '../components/HamburgerButton';
import BottomDrawer from '../components/BottomDrawer';
import InputField from '../components/InputField';
import Button from '../components/Button';
import useStore from '../store/useStore';

const SettingItem = ({ icon, label, value, onPress, danger = false, colors, isBadge = false, hasSwitch = false, switchValue = false, onSwitchChange, hideArrow = false }) => (
  <TouchableOpacity 
    style={styles.settingItem} 
    onPress={hasSwitch ? onSwitchChange : onPress} 
    activeOpacity={hasSwitch ? 0.9 : 0.7}
  >
    <View style={[styles.settingIcon, { backgroundColor: danger ? colors.danger + '12' : colors.primary + '12', borderColor: danger ? colors.danger + '25' : colors.primary + '25' }]}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
    </View>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, { color: danger ? colors.danger : colors.textPrimary }]}>{label}</Text>
    </View>
    {hasSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={switchValue ? (Platform.OS === 'android' ? colors.accent : '') : '#F4F3F4'}
        ios_backgroundColor={colors.border}
      />
    ) : (
      <>
        {value && (
          <View style={[
            styles.valueBadge,
            isBadge && {
              backgroundColor: value === 'Enabled' ? colors.success + '12' : colors.textTertiary + '15',
              borderColor: value === 'Enabled' ? colors.success + '30' : colors.textTertiary + '30',
              borderWidth: 1,
            }
          ]}>
            <Text style={[
              styles.settingValue,
              { color: isBadge ? (value === 'Enabled' ? colors.success : colors.textSecondary) : colors.textTertiary }
            ]}>
              {value}
            </Text>
          </View>
        )}
        {!hideArrow && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevron} />
        )}
      </>
    )}
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, toggleTheme, setUser } = useStore();
  const { showToast } = useStore();
  const { colors, themeMode } = useTheme();
  
  // Dynamically evaluate stylesheet using active hook colors
  const styles = getStyles(colors, insets);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Password Update State
  const [showPasswordDrawer, setShowPasswordDrawer] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Photo Preview State
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleChangePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Sorry, we need camera roll permissions to make this work!', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.1, // Compress heavily for base64 storage
        base64: true, // Request base64 string
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Fallback to fetch blob if base64 is missing, but on most platforms it works.
        let base64Uri = asset.uri;
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          base64Uri = `data:${mimeType};base64,${asset.base64}`;
        }
        
        setPreviewImage(base64Uri);
        setShowProfileDrawer(false);
      }
    } catch (err) {
      console.error('Image picker error:', err);
      showToast('Failed to pick image.', 'error');
    }
  };

  const handleConfirmPhoto = async () => {
    if (!previewImage) return;
    setIsUploadingPhoto(true);
    try {
      showToast('Saving profile photo...', 'success');
      
      // We directly save the Base64 image to Firestore since Auth URL is too limited!
      await setDoc(doc(db, 'users', user.uid), { photoURL: previewImage }, { merge: true });
      
      if (setUser) {
        // Safely shadow the read-only photoURL property without destroying Firebase Auth prototype methods!
        const userWithPhoto = Object.create(user);
        userWithPhoto.photoURL = previewImage;
        setUser(userWithPhoto);
      }
      
      showToast('Profile photo updated successfully!', 'success');
      setPreviewImage(null);
    } catch (err) {
      console.error('Error changing photo:', err);
      showToast(err.message || 'Failed to update photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      
      showToast('Password updated successfully!', 'success');
      setShowPasswordDrawer(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/requires-recent-login') {
        showToast('For security, please sign out and sign back in to change your password.', 'error');
      } else {
        showToast(err.message || 'Failed to update password.', 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const userEmail = user?.email?.toLowerCase() || '';
  let displayName = 'Admin User';
  if (userEmail === 'nurul@docstec.com') displayName = 'Nurul Hudda';
  else if (userEmail === 'raiyan@docstec.com') displayName = 'Raiyan Imon';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Dynamic Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your profile, preferences, and security</Text>
        </View>
        <HamburgerButton onPress={() => navigation.openDrawer()} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Profile Card */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.accountCard}>
          <TouchableOpacity style={styles.accountRow} onPress={() => setShowProfileDrawer(true)} activeOpacity={0.7}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
                ) : user?.email?.toLowerCase() === 'nurul@docstec.com' ? (
                  <Image source={require('../../assets/Nurul.png')} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
                ) : user?.email?.toLowerCase() === 'raiyan@docstec.com' ? (
                  <Image source={require('../../assets/Raiyan.jpeg')} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
                ) : (
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountEmail}>{displayName}</Text>
              <Text style={styles.accountUid}>{user?.email || 'Not signed in'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Theme & App settings */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <Card style={styles.preferencesCard}>
          <SettingItem
            icon={themeMode === 'dark' ? 'moon-outline' : 'sunny-outline'}
            label="Dark Theme"
            hasSwitch
            switchValue={themeMode === 'dark'}
            onSwitchChange={toggleTheme}
            colors={colors}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="information-circle-outline"
            label="App Version"
            value="1.0.0"
            onPress={() => {}}
            colors={colors}
            hideArrow
          />
        </Card>

        {/* Session Section */}
        <Text style={styles.sectionTitle}>Session</Text>
        <Card style={styles.sessionCard}>
          <SettingItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
            colors={colors}
          />
        </Card>

        {/* App branding */}
        <View style={styles.branding}>
          <Text style={styles.brandingName}>{APP_NAME}</Text>
          <Text style={styles.brandingTagline}>by Docstec</Text>
          <Text style={styles.brandingCopy}>© {new Date().getFullYear()} All rights reserved</Text>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        type="danger"
      />

      {/* Profile Actions Drawer */}
      <BottomDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title="Profile Settings"
        height={280}
      >
        <View style={{ paddingTop: SPACING.md }}>
          <SettingItem
            icon="camera-outline"
            label="Change Profile Photo"
            onPress={handleChangePhoto}
            colors={colors}
            hideArrow
          />
          <View style={{ height: 1, backgroundColor: colors.border + '15', marginVertical: SPACING.sm }} />
          <SettingItem
            icon="key-outline"
            label="Change Password"
            onPress={() => {
              setShowProfileDrawer(false);
              setTimeout(() => setShowPasswordDrawer(true), 350);
            }}
            colors={colors}
            hideArrow
          />
        </View>
      </BottomDrawer>

      {/* Password Change Drawer */}
      <BottomDrawer
        visible={showPasswordDrawer}
        onClose={() => {
          setShowPasswordDrawer(false);
          setNewPassword('');
          setConfirmPassword('');
        }}
        title="Change Password"
        height={400}
      >
        <ScrollView style={{ padding: SPACING.md, marginTop: -SPACING.sm }} keyboardShouldPersistTaps="handled">
          <InputField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter your new password"
            secureTextEntry
            icon="shield-checkmark-outline"
            style={{ backgroundColor: 'transparent' }}
            labelBgColor={colors.surface}
            error={newPassword.length > 0 && newPassword.length < 6 ? 'Minimum 6 characters required' : null}
          />
          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your new password"
            secureTextEntry
            icon="lock-closed-outline"
            style={{ backgroundColor: 'transparent' }}
            labelBgColor={colors.surface}
            error={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : null}
          />
          <View style={{ marginTop: SPACING.md }}>
            <Button
              title="Update Password"
              onPress={handleUpdatePassword}
              loading={isUpdatingPassword}
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
            />
          </View>
        </ScrollView>
      </BottomDrawer>

      {/* Image Preview Modal */}
      <BottomDrawer
        visible={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Preview Photo"
        height={420}
      >
        <View style={{ padding: SPACING.md, alignItems: 'center' }}>
          <View style={{
            width: 200, 
            height: 200, 
            borderRadius: 100, 
            borderWidth: 3, 
            borderColor: colors.primary,
            overflow: 'hidden',
            marginBottom: SPACING.xl
          }}>
            {previewImage && <Image source={{ uri: previewImage }} style={{ width: '100%', height: '100%' }} />}
          </View>
          <View style={{ width: '100%', flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                onPress={() => setPreviewImage(null)}
                variant="outline"
                disabled={isUploadingPhoto}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Confirm"
                onPress={handleConfirmPhoto}
                loading={isUploadingPhoto}
              />
            </View>
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '15', // Super soft border line
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxxl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: FONT_WEIGHT.medium,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: Math.max((insets?.bottom || 0), SPACING.md) + SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  accountCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10', // Slate semi-transparent base
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountEmail: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  accountUid: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 3,
  },
  preferencesCard: {
    padding: 0,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sessionCard: {
    padding: 0,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border + '40', // Translucent thin divider lines
    marginHorizontal: SPACING.lg,
  },
  branding: {
    alignItems: 'center',
    marginTop: SPACING.huge,
    paddingVertical: SPACING.xxl,
  },
  brandingName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  brandingTagline: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  brandingCopy: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: SPACING.sm,
  },
});

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg - 2,
    paddingHorizontal: SPACING.lg,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm, // Standard sleek rounded borders
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  settingValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
  modalItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.xs },
  modalItemText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.medium },
});

export default SettingsScreen;
