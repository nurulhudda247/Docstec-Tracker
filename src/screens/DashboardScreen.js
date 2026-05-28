// Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Path, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { formatCurrency, getRelativeTime, getDaysRemaining } from '../utils/formatters';
import { PROJECT_STATUS } from '../utils/constants';
import Card from '../components/Card';
import HamburgerButton from '../components/HamburgerButton';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import useStore from '../store/useStore';

const MonthlyRevenueChart = ({ colors, themeMode, payments, projects, styles }) => {
  const [chartWidth, setChartWidth] = useState(0);
  const baseCurrency = useStore(state => state.baseCurrency);
  const currencySymbol = baseCurrency === 'USD' ? '$' : baseCurrency === 'GBP' ? '£' : baseCurrency === 'EUR' ? '€' : '৳';

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      income: 0,
      expense: 0
    });
  }

  payments.forEach(p => {
    if (!p.paymentDate) return;
    let d;
    if (p.paymentDate.toDate) d = p.paymentDate.toDate();
    else d = new Date(p.paymentDate);
    
    if (isNaN(d)) return;
    
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const month = months.find(m => m.key === key);
    if (month) {
      month.income += (Number(p.amount) || 0);
    }
  });

  projects.forEach(proj => {
    if (proj.teamPayments && Array.isArray(proj.teamPayments)) {
      proj.teamPayments.forEach(tp => {
        if (!tp.date) return;
        const d = new Date(tp.date);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const month = months.find(m => m.key === key);
        if (month) {
          month.expense += (Number(tp.amount) || 0);
        }
      });
    }
  });

  const chartData = {
    labels: months.map(m => m.label),
    datasets: [
      {
        data: months.map(m => m.income),
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green
        strokeWidth: 3
      },
      {
        data: months.map(m => m.expense),
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red
        strokeWidth: 3
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => colors.border + '60', // Grid line colors
    labelColor: (opacity = 1) => colors.textSecondary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.surface
    }
  };

  return (
    <View 
      style={styles.chartCard} 
      onLayout={(e) => setChartWidth(e.nativeEvent.layout.width - SPACING.lg * 2)}
    >
      <Text style={styles.chartTitle}>Income vs Expense (Last 6 Months)</Text>
      <LineChart
        data={chartData}
        width={chartWidth > 0 ? chartWidth : 300}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 8,
          marginLeft: -10, // Adjust chart kit default padding
        }}
        yAxisLabel={currencySymbol}
        formatYLabel={(y) => {
          const val = Number(y);
          if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
          return val.toString();
        }}
      />
    </View>
  );
};

const StatCard = ({ icon, label, value, color, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.statCard,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border + '25', // Soft, modern translucent border
        borderWidth: 1,
      }
    ]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={styles.statHeaderRow}>
      <View style={[styles.statIconWrapper, { backgroundColor: color + '15', borderColor: color + '30', borderWidth: 1 }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const { clients, projects, payments, setClients, setProjects, setPayments, user } = useStore();
  const { colors, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  // Loading is now handled globally via sync, we can assume it's ready.
  const loading = false;

  const insets = useSafeAreaInsets();
  // Dynamic Stylesheet based on active hook theme colors
  const styles = getStyles(colors, insets);


  const onRefresh = async () => {
    setRefreshing(true);
    // Since data is synced real-time, pulling to refresh is a placebo
    setTimeout(() => setRefreshing(false), 1000);
  };

  const activeProjects = React.useMemo(() => projects.filter((p) => p.status === PROJECT_STATUS.IN_PROGRESS), [projects]);
  const totalBudget = React.useMemo(() => projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0), [projects]);
  const totalDue = React.useMemo(() => projects.reduce((sum, p) => sum + (p.totalDue || 0), 0), [projects]);
  const recentProjects = React.useMemo(() => projects.slice(0, 5), [projects]);

  const totalCollected = totalBudget - totalDue;
  const collectionRate = totalBudget > 0 ? (totalCollected / totalBudget) * 100 : 0;

  const greetingSubtext = React.useMemo(() => activeProjects.length > 0
    ? `You have ${activeProjects.length} active project${activeProjects.length > 1 ? 's' : ''} in progress with ${formatCurrency(totalDue)} in outstanding dues.`
    : `All clear! Total registered project budget is ${formatCurrency(totalBudget)}.`, [activeProjects.length, totalDue, totalBudget]);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Dynamic Modern Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerProfileRow}>
          <View style={styles.profileAvatar}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} resizeMode="cover" />
            ) : user?.email?.toLowerCase() === 'nurul@docstec.com' ? (
              <Image source={require('../../assets/Nurul.png')} style={styles.avatarImage} resizeMode="cover" />
            ) : user?.email?.toLowerCase() === 'raiyan@docstec.com' ? (
              <Image source={require('../../assets/Raiyan.jpeg')} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.profileInitials}>
                {user?.email?.charAt(0)?.toUpperCase() || 'N'}
              </Text>
            )}
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileGreeting}>
              Hello, {user?.email?.toLowerCase() === 'raiyan@docstec.com' 
                ? 'Captain' 
                : user?.email?.toLowerCase() === 'nurul@docstec.com'
                ? 'Maester'
                : user?.email ? (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)) : 'User'}
            </Text>
            <Text style={styles.profileDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        
        <HamburgerButton 
          style={styles.settingsBtn} 
          onPress={() => navigation.openDrawer()} 
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="people-outline"
            label="Clients"
            value={clients.length}
            color={colors.accent}
            onPress={() => navigation.navigate('ClientsTab')}
            colors={colors}
          />
          <StatCard
            icon="briefcase-outline"
            label="Active"
            value={activeProjects.length}
            color={colors.success}
            onPress={() => navigation.navigate('ProjectsTab')}
            colors={colors}
          />
          <StatCard
            icon="wallet-outline"
            label="Budget"
            value={formatCurrency(totalBudget)}
            color={colors.primary}
            colors={colors}
          />
          <StatCard
            icon="cash-outline"
            label="Due"
            value={formatCurrency(totalDue)}
            color={colors.warning}
            colors={colors}
          />
        </View>

        {/* Collection Progress & Financial Health Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressCardTitle}>Collection Progress</Text>
            <View style={[styles.rateBadge, { backgroundColor: colors.success + '12', borderColor: colors.success + '30', borderWidth: 1 }]}>
              <Text style={[styles.rateBadgeText, { color: colors.success }]}>{collectionRate.toFixed(1)}% Collected</Text>
            </View>
          </View>

          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressTrackBar, { backgroundColor: colors.border + '35' }]}>
              <View
                style={[
                  styles.progressFillBar,
                  {
                    width: `${Math.min(collectionRate, 100)}%`,
                    backgroundColor: colors.success,
                  }
                ]}
              />
            </View>
          </View>

          <View style={styles.progressDetailsRow}>
            <View style={styles.progressDetailCol}>
              <View style={styles.dotLabelRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={styles.progressDetailLabel}>Collected</Text>
              </View>
              <Text style={styles.progressDetailVal}>{formatCurrency(totalCollected)}</Text>
            </View>

            <View style={styles.progressDetailCol}>
              <View style={styles.dotLabelRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.progressDetailLabel}>Outstanding Dues</Text>
              </View>
              <Text style={[styles.progressDetailVal, { color: colors.warning }]}>{formatCurrency(totalDue)}</Text>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ClientsDrawer', { screen: 'AddClient', params: { fromDashboard: true } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '25', borderWidth: 1 }]}>
              <Ionicons name="person-add-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.actionText}>Add Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ProjectsDrawer', { screen: 'AddProject', params: { fromDashboard: true } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.success + '12', borderColor: colors.success + '25', borderWidth: 1 }]}>
              <Ionicons name="add-circle-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.actionText}>Add Project</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('QuotationsDrawer', { screen: 'CreateQuotation', params: { fromDashboard: true } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25', borderWidth: 1 }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Quotation</Text>
          </TouchableOpacity>
        </View>

        <MonthlyRevenueChart payments={payments} projects={projects} colors={colors} styles={styles} />

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
    paddingTop: Math.max(insets?.top || 0, 16) + (Platform.OS === 'ios' ? 10 : 5),
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '15', // Super soft border line
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  profileInitials: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileGreeting: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  profileDate: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerNotificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border + '25',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.danger,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: Math.max(insets?.bottom || 0, 16) + 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  progressCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.border + '25', // Clean translucent border
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderRadius: BORDER_RADIUS.lg,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  rateBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
  progressBarWrapper: {
    marginBottom: SPACING.md,
  },
  progressTrackBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
    paddingTop: SPACING.md,
  },
  progressDetailCol: {
    flex: 1,
  },
  dotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressDetailLabel: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  progressDetailVal: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg, // Soft modern rounded corners
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: colors.border + '25',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular action badges
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timelineContainer: {
    marginTop: SPACING.sm,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeftColumn: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timelineNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 20,
    zIndex: 10,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  projectInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  projectName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  projectClient: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  projectFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  projectStat: {
    flex: 1,
  },
  projectStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  projectStatValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semiBold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary, // Dynamic: White in dark mode, slate in light mode
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: colors.border + '25',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: colors.surface,
  },
  chartTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
    marginBottom: SPACING.xl,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: SPACING.xs,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTooltip: {
    height: 20,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  barTooltipText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartBarTrack: {
    width: 28,
    height: 100,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
});

const styles = StyleSheet.create({
  statCard: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg, // Deep modern premium rounded corners
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  statIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19, // Circular icon containers for visual excellence
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
});

export default DashboardScreen;
