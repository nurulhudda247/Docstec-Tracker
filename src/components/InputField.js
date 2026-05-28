// Reusable Input Field & Picker Component with Unified Border-Overlapping Floating Label
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  error,
  required = false,
  disabled = false,
  icon,
  rightIcon,
  onRightIconPress,
  maxLength,
  style,
  inputStyle,
  autoCapitalize = 'sentences',
  onPress, // Optional: makes this field behave as a picker button
  labelBgColor = COLORS.background, // Dynamic background matching of the container context
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloated = isFocused || hasValue;

  // Floating label animation state
  const labelAnim = useRef(new Animated.Value(hasValue ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFloated ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  // Interpolated animation values for premium border overlapping label
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [17, -9], // 17 precisely centers the 20px line-height label in the 54px wrapper
  });

  const labelLeft = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [icon ? 38 : 12, icon ? 30 : 8], // Indents slightly left when floated for perfect alignment
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FONT_SIZE.md, 11], // 11px font size when floated
  });

  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.textTertiary, error ? COLORS.danger : COLORS.primary],
  });

  const labelFontWeight = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FONT_WEIGHT.regular, FONT_WEIGHT.medium],
  });

  // Animated background color and horizontal padding to mask the border perfectly
  const labelBg = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', labelBgColor],
  });

  const labelPadding = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const WrapperComponent = onPress ? TouchableOpacity : View;

  return (
    <View style={[styles.container, style]}>
      <WrapperComponent
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={[
          styles.inputWrapper,
          { backgroundColor: labelBgColor }, // Dynamically match container background to eliminate mask mismatches
          isFocused && styles.inputFocused,
          error && styles.inputError,
          disabled && styles.inputDisabled,
          multiline && { minHeight: numberOfLines * 24 + SPACING.lg * 2, alignItems: 'flex-start' },
        ]}
      >
        {/* Animated Floating Label (Masks the top border beautifully with dynamic bg and padding) */}
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              left: labelLeft,
              top: labelTop,
              fontSize: labelFontSize,
              color: labelColor,
              fontWeight: labelFontWeight,
              backgroundColor: labelBg,
              paddingHorizontal: labelPadding,
            },
          ]}
          pointerEvents="none"
        >
          {label || placeholder}
          {required && <Text style={styles.required}> *</Text>}
        </Animated.Text>

        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? COLORS.primary : COLORS.textTertiary}
            style={[styles.leftIcon, multiline && { marginTop: 17 }]}
          />
        )}

        {onPress ? (
          <Text
            numberOfLines={multiline ? undefined : 1}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              { color: value ? COLORS.textPrimary : 'transparent' }, // Use transparent color if empty so placeholder label can be centered cleanly
              inputStyle,
            ]}
          >
            {value || ' '}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder=""
            placeholderTextColor="transparent"
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            secureTextEntry={secureTextEntry && !showPassword}
            editable={!disabled}
            maxLength={maxLength}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              inputStyle,
            ]}
          />
        )}

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.rightIconBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        )}

        {onPress && !rightIcon && (
          <Ionicons name="chevron-down" size={16} color={COLORS.textTertiary} style={styles.rightChevron} />
        )}

        {rightIcon && (onRightIconPress || onPress) && (
          <TouchableOpacity onPress={onRightIconPress || onPress} disabled={!onRightIconPress} style={styles.rightIconBtn}>
            <Ionicons name={rightIcon} size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </WrapperComponent>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    marginTop: 8, // Ensure floating label doesn't collide with elements above
  },
  floatingLabel: {
    position: 'absolute',
    zIndex: 10,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border + '60',
    paddingHorizontal: SPACING.md,
    position: 'relative',
    minHeight: 54, // Force exact height match across Text and TextInput
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      default: {},
    }),
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    paddingVertical: 16, // Taller, premium input padding for floating labels
    fontWeight: FONT_WEIGHT.regular,
    zIndex: 2,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 14,
    paddingBottom: 14,
  },
  rightIconBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
    zIndex: 5,
  },
  rightChevron: {
    marginLeft: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
});

export default InputField;
