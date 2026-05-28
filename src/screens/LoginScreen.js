// Login Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { APP_NAME } from '../utils/constants';
import InputField from '../components/InputField';
import Button from '../components/Button';
import useStore from '../store/useStore';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthLoading, authError, clearError, themeMode } = useStore();

  // Dynamically evaluate stylesheet using active proxy colors
  const styles = getStyles(COLORS);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    await login(email.trim(), password);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={COLORS.primary} />
      
      {/* Ambient Neon Glow Backdrop Spheres */}
      <View style={styles.glowCircle1} pointerEvents="none" />
      <View style={styles.glowCircle2} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/Docstec Logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>Project & Client Management</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

            <InputField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              placeholder="username@docstec.com"
              autoCapitalize="none"
              icon="person-outline"
              required
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              placeholder="Enter your password"
              secureTextEntry
              icon="lock-closed-outline"
              required
            />

            <View style={styles.buttonWrapper}>
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isAuthLoading}
                disabled={!email.trim() || !password.trim()}
                icon="log-in-outline"
                size="lg"
              />
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Docstec — Internal Use Only</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (colors, insets) => StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
    backgroundColor: colors.background, // Match active theme background (dark/light)
    position: 'relative',
  },
  glowCircle1: {
    position: 'absolute',
    top: '10%',
    left: '-15%',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.primary + '18', // Neon blue glowing aura
    ...Platform.select({
      web: {
        filter: 'blur(60px)',
      },
    }),
  },
  glowCircle2: {
    position: 'absolute',
    bottom: '20%',
    right: '-15%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accent + '14', // Neon purple/accent glowing aura
    ...Platform.select({
      web: {
        filter: 'blur(70px)',
      },
    }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.huge,
    zIndex: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary + '80', // soft border
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  appName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  formCard: {
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxl,
    borderWidth: 1.5,
    borderColor: colors.primary + '35',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  formTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    marginBottom: SPACING.xxl,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    color: colors.danger,
    fontWeight: FONT_WEIGHT.medium,
  },
  buttonWrapper: {
    marginTop: SPACING.lg,
  },
  footer: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    marginTop: SPACING.xxl,
  },
});

export default LoginScreen;
