// Reusable Button Component
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary | secondary | outline | danger | ghost
  size = 'md', // sm | md | lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: COLORS.accentLight + '20',
          text: COLORS.accent,
          border: 'transparent',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: COLORS.primary,
          border: COLORS.border,
        };
      case 'danger':
        return {
          bg: COLORS.danger,
          text: '#FFFFFF', // Literal pure white text
          border: 'transparent',
        };
      case 'ghost':
        return {
          bg: 'transparent',
          text: COLORS.accent,
          border: 'transparent',
        };
      default:
        return {
          bg: COLORS.primary,
          text: '#FFFFFF', // Literal pure white text
          border: 'transparent',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingV: 12, paddingH: SPACING.md, fontSize: FONT_SIZE.sm }; // Taller premium sm height (12px padding)
      case 'lg':
        return { paddingV: 16, paddingH: SPACING.xxl, fontSize: FONT_SIZE.lg }; // Taller premium lg height (16px padding)
      default:
        return { paddingV: 14, paddingH: SPACING.xl, fontSize: FONT_SIZE.md }; // Taller premium md height (14px padding)
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          paddingVertical: sizeStyle.paddingV,
          paddingHorizontal: sizeStyle.paddingH,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        variant !== 'ghost' && SHADOWS.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={sizeStyle.fontSize + 2} color={variantStyle.text} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: variantStyle.text, fontSize: sizeStyle.fontSize }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={sizeStyle.fontSize + 2} color={variantStyle.text} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT_WEIGHT.semiBold,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});

export default Button;
