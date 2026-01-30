import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import {
  Header,
  TextInput,
  ProfilePhoto,
  ReviewCard,
  Badge,
  LoadingScreen,
  EmptyState,
} from '@/components';
import { theme, colors } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { UserProfile, Band, Review, Event } from '@goodsongs/api-client';

type TabType = 'users' | 'bands' | 'reviews' | 'events';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'bands', label: 'Bands', icon: 'music' },
  { key: 'reviews', label: 'Recs', icon: 'message-circle' },
  { key: 'events', label: 'Events', icon: 'calendar' },
];

export function DiscoverScreen({ navigation }: any) {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const fetchData = useCallback(async (tab: TabType, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      switch (tab) {
        case 'users':
          const usersRes = await apiClient.discoverUsers(1);
          setUsers(usersRes?.users || []);
          break;
        case 'bands':
          const bandsRes = await apiClient.discoverBands(1);
          setBands(bandsRes?.bands || []);
          break;
        case 'reviews':
          const reviewsRes = await apiClient.discoverReviews(1);
          setReviews(reviewsRes?.reviews || []);
          break;
        case 'events':
          const eventsRes = await apiClient.discoverEvents(1);
          setEvents(eventsRes?.events || []);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      // Set empty state on error
      switch (tab) {
        case 'users':
          setUsers([]);
          break;
        case 'bands':
          setBands([]);
          break;
        case 'reviews':
          setReviews([]);
          break;
        case 'events':
          setEvents([]);
          break;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleRefresh = () => {
    fetchData(activeTab, true);
  };

  // Filter function
  const filterBySearch = <T extends { name?: string; username?: string }>(
    items: T[],
    query: string
  ): T[] => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.username?.toLowerCase().includes(lowerQuery)
    );
  };

  const handleUserPress = (username: string) => {
    if (username === currentUser?.username) {
      // Navigate to own profile tab
      navigation.navigate('Main', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { username });
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleUserPress(item.username)}
    >
      <ProfilePhoto
        src={fixImageUrl(item.profile_image_url)}
        alt={item.username}
        size={40}
        fallback={item.username || 'U'}
      />
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>@{item.username}</Text>
        {(item.location || item.city) && (
          <Text style={styles.listItemSubtitle}>
            {item.location || item.city}
          </Text>
        )}
      </View>
      {(item.reviews_count ?? 0) > 0 && (
        <Badge text={`${item.reviews_count} recs`} />
      )}
    </TouchableOpacity>
  );

  const renderBandItem = ({ item }: { item: Band }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('BandProfile', { slug: item.slug })}
    >
      <ProfilePhoto
        src={fixImageUrl(item.profile_picture_url) || fixImageUrl(item.spotify_image_url)}
        alt={item.name}
        size={40}
        fallback={item.name || 'B'}
      />
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{item.name}</Text>
        {(item.location || item.city) && (
          <Text style={styles.listItemSubtitle}>
            {item.location || item.city}
          </Text>
        )}
      </View>
      {item.reviews_count > 0 && (
        <Badge text={`${item.reviews_count} recs`} />
      )}
    </TouchableOpacity>
  );

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <ReviewCard
        review={item}
        onPressAuthor={handleUserPress}
        onPressBand={(slug) => navigation.navigate('BandProfile', { slug })}
      />
    </View>
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>
          {new Date(item.event_date).getDate()}
        </Text>
        <Text style={styles.eventMonth}>
          {new Date(item.event_date).toLocaleString('default', {
            month: 'short',
          })}
        </Text>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.name}</Text>
        <Text style={styles.eventVenue}>
          {item.venue?.name} · {item.venue?.city}
        </Text>
        <Text style={styles.eventBand}>{item.band?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'users':
        return { icon: 'users', title: 'No users found' };
      case 'bands':
        return { icon: 'music', title: 'No bands found' };
      case 'reviews':
        return { icon: 'message-circle', title: 'No recommendations found' };
      case 'events':
        return { icon: 'calendar', title: 'No events found' };
    }
  };

  const renderContent = () => {
    if (loading) return <LoadingScreen />;

    const emptyProps = getEmptyMessage();

    switch (activeTab) {
      case 'users':
        const filteredUsers = filterBySearch(users, searchQuery);
        return (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case 'bands':
        const filteredBands = filterBySearch(bands, searchQuery);
        return (
          <FlatList
            data={filteredBands}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBandItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case 'reviews':
        return (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case 'events':
        return (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEventItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Discover" />

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search..."
          leftIcon="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={
                activeTab === tab.key
                  ? theme.colors.primary
                  : colors.grape[5]
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: colors.grape[1],
  },
  tabActive: {
    backgroundColor: colors.grape[2],
  },
  tabText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.cooperBold,
    color: colors.grape[8],
    lineHeight: 24,
  },
  listItemSubtitle: {
    fontSize: theme.fontSizes.xs,
    color: colors.grey[5],
    marginTop: 2,
  },
  reviewItem: {
    marginBottom: theme.spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  eventDate: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grape[2],
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  eventDay: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  eventMonth: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[6],
    textTransform: 'uppercase',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    color: colors.grape[8],
  },
  eventVenue: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[6],
    marginTop: 2,
  },
  eventBand: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primaryLight,
    marginTop: 4,
  },
});
