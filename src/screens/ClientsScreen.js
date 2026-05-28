// Clients List Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../theme';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import InputField from '../components/InputField';
import HamburgerButton from '../components/HamburgerButton';
import useStore from '../store/useStore';
import { clientService } from '../services/clientService';

const ClientsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { clients, setClients } = useStore();
  const { colors, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  // Loading is handled by global sync
  const loading = false;
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic plain object styles evaluated using active hook colors
  const styles = getStyles(colors, insets);

  const onRefresh = async () => {
    setRefreshing(true);
    // Since data is synced real-time, pulling to refresh is a placebo
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredClients = React.useMemo(() => {
    const lowerSearch = searchQuery.toLowerCase();
    return clients.filter((client) =>
      client.name?.toLowerCase().includes(lowerSearch) ||
      client.contactPerson?.toLowerCase().includes(lowerSearch)
    );
  }, [clients, searchQuery]);

  const renderClient = useCallback(({ item }) => {
    // Generate beautiful consistent slate background for the initials dynamically
    const avatarBgColor = colors.primary + '10';
    const avatarBorderColor = colors.primary;

    return (
      <Card
        onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
        style={styles.clientCard}
      >
        <View style={styles.clientRow}>
          <View style={[styles.avatar, { backgroundColor: avatarBgColor, borderColor: avatarBorderColor }]}>
            <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            {item.contactPerson ? (
              <Text style={styles.clientContact}>{item.contactPerson}</Text>
            ) : null}
            <View style={styles.clientAddress}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.clientAddressText} numberOfLines={1}>
                {item.address || 'No address details'}
              </Text>
            </View>
            {item.createdByEmail && (
              <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6, fontWeight: '500' }}>
                Added by {item.createdByEmail.split('@')[0]}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={styles.chevron} />
        </View>
      </Card>
    );
  }, [colors, navigation, styles]);

  if (loading) return <LoadingSpinner message="Loading clients..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Dynamic Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Clients</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{clients.length} total</Text>
          </View>
        </View>
        <HamburgerButton onPress={() => navigation.openDrawer()} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <InputField
          placeholder="Search clients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon="search-outline"
          rightIcon={searchQuery.length > 0 ? "close-circle" : null}
          onRightIconPress={searchQuery.length > 0 ? () => setSearchQuery('') : null}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={renderClient}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchQuery ? 'No clients found' : 'No clients yet'}
            message={searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            actionLabel={searchQuery ? undefined : 'Add Client'}
            onAction={searchQuery ? undefined : () => navigation.navigate('AddClient')}
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddClient')}
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
  searchWrapper: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: colors.textPrimary,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  clientCard: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textPrimary,
  },
  clientContact: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: 2,
  },
  clientAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clientAddressText: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  chevron: {
    marginLeft: SPACING.sm,
  },
});

export default ClientsScreen;
