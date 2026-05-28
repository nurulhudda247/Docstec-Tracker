// Reusable Card Component with Dynamic Dark/Light Theme Support
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const Card = ({ children, onPress, style, variant = 'default' }) => {
  const Component = onPress ? TouchableOpacity : View;

  // Resolve active theme colors at render-time for instant swappability
  const cardStyles = [
    {
      backgroundColor: COLORS.surface,
      borderRadius: BORDER_RADIUS.lg, // Sleek premium rounded corners
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.border + '25', // Extremely translucent modern border
      shadowColor: COLORS.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    },
    style
  ];

  return (
    <Component
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={cardStyles}
    >
      {children}
    </Component>
  );
};

export default React.memo(Card);
