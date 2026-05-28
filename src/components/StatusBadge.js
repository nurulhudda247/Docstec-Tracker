// Status Badge Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../theme';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../utils/constants';

const StatusBadge = ({ status, size = 'md' }) => {
  const colors = PROJECT_STATUS_COLORS[status] || { bg: '#E2E8F0', text: '#64748B' };
  const label = PROJECT_STATUS_LABELS[status] || status;

  const fontSize = size === 'sm' ? FONT_SIZE.xs : FONT_SIZE.sm;
  const paddingV = size === 'sm' ? 2 : SPACING.xs;
  const paddingH = size === 'sm' ? SPACING.sm : SPACING.md;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, paddingVertical: paddingV, paddingHorizontal: paddingH }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.text, { color: colors.text, fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  text: {
    fontWeight: FONT_WEIGHT.semiBold,
  },
});

export default React.memo(StatusBadge);
