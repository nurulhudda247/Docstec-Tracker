// Client Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import { formatCurrency, getRelativeTime } from '../utils/formatters';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { clientService } from '../services/clientService';
import { projectService } from '../services/projectService';
import useStore from '../store/useStore';

const ClientDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { clientId } = route.params;
  const { colors, themeMode } = useTheme();
  const { showToast } = useStore();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const clientData = await clientService.getById(clientId);
      let projectsData = [];
      try {
        projectsData = await projectService.getByClientId(clientId);
      } catch (projectError) {
        console.warn('Error loading projects/history:', projectError);
      }
      setClient(clientData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading client detail:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const performDelete = async () => {
    try {
      await clientService.delete(clientId);
      showToast('Client deleted successfully.', 'success');
      navigation.goBack();
    } catch (error) {
      showToast('Failed to delete client.', 'error');
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const styles = getStyles(colors, insets);

  if (loading) return <LoadingSpinner message="Loading client..." />;
  if (!client) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Not Found</Text>
          </View>
        </View>
        <EmptyState icon="alert-circle-outline" title="Client profile or history not found" message="There was an error loading this profile." />
      </View>
    );
  }

  const totalBudget = projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
  const totalDue = projects.reduce((sum, p) => sum + (p.totalDue || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Premium Dynamic Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>{client.name}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{client.contactPerson || 'Client Profile & Projects'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Client Info Card */}
        <Card variant="elevated">
          <View style={styles.clientHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{client.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.contactPerson && <Text style={styles.contactPerson}>{client.contactPerson}</Text>}
            </View>
          </View>

          {client.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{client.address}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{client.phone}</Text>
            </View>
          )}
          {client.notes && (
            <View style={[styles.infoRow, { marginTop: SPACING.sm }]}>
              <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{client.notes}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddClient', { client })}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.accent} />
              <Text style={[styles.actionText, { color: COLORS.accent }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(totalBudget)}</Text>
            <Text style={styles.statLabel}>Total Budget</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{formatCurrency(totalDue)}</Text>
            <Text style={styles.statLabel}>Total Due</Text>
          </View>
        </View>

        {/* Projects */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projects</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddProject', { clientId: client.id, clientName: client.name })}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {projects.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No projects"
            message="Add a project for this client"
            actionLabel="Add Project"
            onAction={() => navigation.navigate('AddProject', { clientId: client.id, clientName: client.name })}
          />
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            >
              <View style={styles.projectRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projectName}>{project.projectName}</Text>
                  <View style={styles.projectMeta}>
                    <Text style={styles.projectBudget}>{formatCurrency(project.totalBudget)}</Text>
                    <Text style={styles.projectDot}>•</Text>
                    <Text style={styles.projectDue}>Due: {formatCurrency(project.totalDue)}</Text>
                  </View>
                </View>
                <StatusBadge status={project.status} size="sm" />
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={performDelete}
        title="Delete Client"
        message="Are you sure? This will not delete associated projects."
        confirmText="Delete"
        type="danger"
      />
    </View>
  );
};

const getStyles = (colors, insets) => StyleSheet.create({
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
    fontSize: FONT_SIZE.xl - 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs - 1,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: FONT_WEIGHT.medium,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: Math.max((insets?.bottom || 0), SPACING.md) + SPACING.xl,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  avatarText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  contactPerson: {
    fontSize: FONT_SIZE.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border + '15',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold,
    color: colors.textPrimary,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  projectBudget: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  projectDot: {
    marginHorizontal: SPACING.xs,
    color: colors.textTertiary,
  },
  projectDue: {
    fontSize: FONT_SIZE.sm,
    color: colors.danger,
  },
});

export default ClientDetailScreen;
