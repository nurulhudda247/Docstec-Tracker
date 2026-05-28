// Quotation List Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HamburgerButton from '../components/HamburgerButton';
import useStore from '../store/useStore';
import { quotationService } from '../services/quotationService';

const QuotationScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, themeMode } = useTheme();
  const { quotations, setQuotations } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const loading = false;
  const styles = getStyles(colors, insets);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderQuotation = useCallback(({ item }) => (
    <Card onPress={() => {
      if (item.status === 'DRAFT') {
        navigation.navigate('CreateQuotation', { quotation: item });
      } else {
        navigation.navigate('QuotationPreview', { quotation: item });
      }
    }}>
      <View style={styles.quotationRow}>
        <View style={styles.docIcon}>
          <Ionicons name="document-text" size={24} color={item.status === 'DRAFT' ? colors.warning : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.docNo}>{item.documentNo || 'No Document No.'}</Text>
            {item.status === 'DRAFT' && (
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>Drafted</Text>
              </View>
            )}
          </View>
          <Text style={styles.clientName}>{item.clientName || 'Unknown Client'}</Text>
          <View style={styles.quoteMeta}>
            <Text style={styles.quoteDate}>{formatDate(item.date)}</Text>
            <Text style={styles.quoteDot}>•</Text>
            <Text style={styles.quoteTotal}>{formatCurrency(item.grossTotal)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </Card>
  ), [colors, navigation, styles]);



  if (loading) return <LoadingSpinner message="Loading quotations..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Dynamic Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Quotations</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{quotations.length} total</Text>
          </View>
        </View>
        <HamburgerButton onPress={() => navigation.openDrawer()} />
      </View>

      <FlatList
        data={quotations}
        keyExtractor={(item) => item.id}
        renderItem={renderQuotation}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No quotations yet"
            message="Create your first quotation"
            actionLabel="Create Quotation"
            onAction={() => navigation.navigate('CreateQuotation')}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateQuotation')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors, insets) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.background,
    paddingTop: Math.max((insets?.top || 0), SPACING.md) + (Platform.OS === 'ios' ? 10 : 15),
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '15', // Super soft border line
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxxl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  countBadgeText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: Math.max((insets?.bottom || 0) + 20, 30),
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  quotationRow: { flexDirection: 'row', alignItems: 'center' },
  docIcon: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.primary + '10',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  docNo: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semiBold, color: colors.textPrimary },
  clientName: { fontSize: FONT_SIZE.sm, color: colors.textSecondary, marginTop: 1 },
  quoteMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  quoteDate: { fontSize: FONT_SIZE.xs, color: colors.textTertiary },
  quoteDot: { marginHorizontal: SPACING.xs, color: colors.textTertiary },
  quoteTotal: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semiBold, color: colors.accent },
  draftBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.warning + '50',
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.warning,
    textTransform: 'uppercase',
  },
});

export default QuotationScreen;
