// Projects List Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { formatCurrency, getDaysRemaining, formatDate } from '../utils/formatters';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS } from '../utils/constants';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HamburgerButton from '../components/HamburgerButton';
import useStore from '../store/useStore';
import { projectService } from '../services/projectService';

const ProjectsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { projects, setProjects } = useStore();
  const { colors, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const loading = false;
  const [filter, setFilter] = useState('all');
  
  // Dynamic plain object styles evaluated using active hook colors
  const styles = getStyles(colors, insets);

  const onRefresh = async () => {
    setRefreshing(true);
    // Data is synced in real-time, refreshing is placebo
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredProjects = React.useMemo(() => {
    return filter === 'all'
      ? projects
      : projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const filters = [
    { key: 'all', label: 'All' },
    { key: PROJECT_STATUS.IN_PROGRESS, label: 'Active' },
    { key: PROJECT_STATUS.PENDING, label: 'Pending' },
    { key: PROJECT_STATUS.COMPLETED, label: 'Done' },
    { key: PROJECT_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case PROJECT_STATUS.COMPLETED:
        return colors.success;
      case PROJECT_STATUS.IN_PROGRESS:
        return colors.primary; // Vibrant accent primary blue
      case PROJECT_STATUS.PENDING:
        return colors.warning; // Gold/Amber
      case PROJECT_STATUS.CANCELLED:
        return colors.danger; // Red
      default:
        return colors.textTertiary;
    }
  };

  const renderProject = useCallback(({ item }) => {
    const daysLeft = getDaysRemaining(item.deadline);
    const borderAccentColor = getStatusColor(item.status);
    
    // Calculate percentage safely
    const progressPercent = item.totalBudget > 0 
      ? Math.min(((item.totalAdvance || 0) / item.totalBudget) * 100, 100) 
      : 0;
    
    return (
      <Card
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
        style={[styles.projectCard, { borderColor: borderAccentColor + '30', borderWidth: 1 }]}
      >
        <View style={styles.projectHeader}>
          <View style={{ flex: 1, paddingRight: SPACING.md }}>
            <Text style={styles.projectName} numberOfLines={1}>{item.projectName}</Text>
            <View style={styles.clientRow}>
              <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.clientName} numberOfLines={1}>{item.clientName || 'Unknown Client'}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.projectBody}>
          <View style={styles.budgetContainer}>
            <View style={styles.budgetHeader}>
               <Text style={styles.budgetTitle}>Budget Collected</Text>
               <Text style={[styles.budgetPercentage, { color: borderAccentColor }]}>
                 {Math.round(progressPercent)}%
               </Text>
            </View>
            <View style={styles.budgetBar}>
              <View
                style={[
                  styles.budgetProgress,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: borderAccentColor,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetLabels}>
              <Text style={styles.budgetText}>
                {formatCurrency(item.totalAdvance || 0)} Paid
              </Text>
              <Text style={styles.budgetTextDark}>
                {formatCurrency(item.totalBudget)} Total
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.projectFooter}>
          <View style={styles.footerInfo}>
            {item.deadline && (
              <View style={styles.footerItem}>
                <View style={styles.iconBox}>
                  <Ionicons name="calendar-clear-outline" size={12} color={colors.primary} />
                </View>
                <Text style={styles.footerText}>{formatDate(item.deadline)}</Text>
              </View>
            )}
            {item.createdByEmail && (
              <View style={[styles.footerItem, { marginLeft: 8 }]}>
                <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
                <Text style={[styles.footerText, { fontSize: 10 }]}>{item.createdByEmail.split('@')[0]}</Text>
              </View>
            )}
            {daysLeft !== null && item.status !== PROJECT_STATUS.COMPLETED && (
              <View
                style={[
                  styles.daysLeftBadge,
                  {
                    backgroundColor:
                      daysLeft < 0 ? colors.danger + '12'
                        : daysLeft < 3 ? colors.warning + '12'
                        : colors.success + '12',
                  },
                ]}
              >
                <Ionicons
                  name={daysLeft < 0 ? 'alert-circle' : 'time'}
                  size={12}
                  color={daysLeft < 0 ? colors.danger : daysLeft < 3 ? colors.warning : colors.success}
                />
                <Text
                  style={[
                    styles.daysLeftText,
                    { color: daysLeft < 0 ? colors.danger : daysLeft < 3 ? colors.warning : colors.success },
                  ]}
                >
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  }, [colors, navigation, styles]);

  if (loading) return <LoadingSpinner message="Loading projects..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Dynamic Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Projects</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{projects.length} total</Text>
          </View>
        </View>
        <HamburgerButton onPress={() => navigation.openDrawer()} />
      </View>

      {/* Filter Tabs */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
        ListEmptyComponent={
          <EmptyState
            icon="briefcase-outline"
            title="No projects found"
            message={filter !== 'all' ? 'No projects with this status' : 'Add your first project'}
            actionLabel={filter === 'all' ? 'Add Project' : undefined}
            onAction={filter === 'all' ? () => navigation.navigate('AddProject') : undefined}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProject')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.textInverse} />
      </TouchableOpacity>
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
  filterContainer: {
    maxHeight: 52,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  filterContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary + '15', // Sleek transparent tint base
    borderColor: colors.primary, // Accent primary outline
  },
  filterText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  projectCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  projectName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clientName: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  projectBody: {
    marginBottom: SPACING.md,
  },
  budgetContainer: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border + '15',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTitle: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetPercentage: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  budgetBar: {
    height: 6,
    backgroundColor: colors.border + '35',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 3,
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetText: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  budgetTextDark: {
    fontSize: FONT_SIZE.xs,
    color: colors.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.semiBold,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  daysLeftText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
  },
});

export default ProjectsScreen;
