import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Header,
  TextInput,
  ProfilePhoto,
  ReviewCard,
  Badge,
  LoadingScreen,
  EmptyState,
  Logo,
} from "@/components";
import { theme, colors } from "@/theme";
import { useAuthStore } from "@/context/authStore";
import { apiClient } from "@/utils/api";
import { fixImageUrl } from "@/utils/imageUrl";
import { UserProfile, Band, Review, Event } from "@goodsongs/api-client";
import { RootStackParamList } from "@/navigation/types";

const TABS = [
  { key: "users", label: "Fans", icon: "users" },
  { key: "bands", label: "Bands", icon: "music" },
  { key: "reviews", label: "Songs", icon: "message-circle" },
  { key: "events", label: "Shows", icon: "calendar" },
] as const;

type TabType = (typeof TABS)[number]["key"];

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function DiscoverScreen({ navigation }: Props) {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Per-tab pagination
  const [pages, setPages] = useState<Record<TabType, number>>({
    users: 1,
    bands: 1,
    reviews: 1,
    events: 1,
  });
  const [hasMore, setHasMore] = useState<Record<TabType, boolean>>({
    users: true,
    bands: true,
    reviews: true,
    events: true,
  });

  const fetchData = useCallback(
    async (tab: TabType, pageNum: number, query?: string, refresh = false) => {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        switch (tab) {
          case "users": {
            const res = await apiClient.discoverUsers(
              pageNum,
              query || undefined,
            );
            const items = res?.users || [];
            setUsers((prev) =>
              refresh || pageNum === 1 ? items : [...prev, ...items],
            );
            setHasMore((prev) => ({
              ...prev,
              users: res?.pagination?.has_next_page ?? false,
            }));
            break;
          }
          case "bands": {
            const res = await apiClient.discoverBands(
              pageNum,
              query || undefined,
            );
            const items = res?.bands || [];
            setBands((prev) =>
              refresh || pageNum === 1 ? items : [...prev, ...items],
            );
            setHasMore((prev) => ({
              ...prev,
              bands: res?.pagination?.has_next_page ?? false,
            }));
            break;
          }
          case "reviews": {
            const res = await apiClient.discoverReviews(
              pageNum,
              query || undefined,
            );
            const items = res?.reviews || [];
            setReviews((prev) =>
              refresh || pageNum === 1 ? items : [...prev, ...items],
            );
            setHasMore((prev) => ({
              ...prev,
              reviews: res?.pagination?.has_next_page ?? false,
            }));
            break;
          }
          case "events": {
            const res = await apiClient.discoverEvents(
              pageNum,
              query || undefined,
            );
            const items = res?.events || [];
            setEvents((prev) =>
              refresh || pageNum === 1 ? items : [...prev, ...items],
            );
            setHasMore((prev) => ({
              ...prev,
              events: res?.pagination?.has_next_page ?? false,
            }));
            break;
          }
        }
        setPages((prev) => ({ ...prev, [tab]: pageNum }));
      } catch (error) {
        console.error("Failed to fetch:", error);
        if (refresh || pageNum === 1) {
          switch (tab) {
            case "users":
              setUsers([]);
              break;
            case "bands":
              setBands([]);
              break;
            case "reviews":
              setReviews([]);
              break;
            case "events":
              setEvents([]);
              break;
          }
        }
        setHasMore((prev) => ({ ...prev, [tab]: false }));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [],
  );

  // Refetch when tab or search query changes
  useEffect(() => {
    // Reset pagination when search changes
    setPages({ users: 1, bands: 1, reviews: 1, events: 1 });
    fetchData(activeTab, 1, debouncedSearch);
  }, [activeTab, debouncedSearch, fetchData]);

  const handleRefresh = () => {
    fetchData(activeTab, 1, debouncedSearch, true);
  };

  const loadingMoreRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || !hasMore[activeTab]) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    fetchData(activeTab, pages[activeTab] + 1, debouncedSearch);
  }, [loading, hasMore, activeTab, pages, debouncedSearch, fetchData]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromEnd =
        contentSize.height - contentOffset.y - layoutMeasurement.height;
      if (distanceFromEnd < 300) {
        handleLoadMore();
      }
    },
    [handleLoadMore],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const handleUserPress = (username: string) => {
    if (username === currentUser?.username) {
      // Navigate to own profile tab
      navigation.navigate("Main", { screen: "Profile" });
    } else {
      navigation.navigate("UserProfile", { username });
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
        fallback={item.username || "U"}
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

  const renderBandItem = ({ item }: { item: Band }) => {
    // Check if band has ANY image URL (before fixImageUrl processing)
    const hasImageUrl = !!(item.profile_picture_url || item.spotify_image_url);

    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate("BandProfile", { slug: item.slug })}
      >
        {hasImageUrl ? (
          <ProfilePhoto
            src={item.profile_picture_url || item.spotify_image_url}
            alt={item.name}
            size={40}
            fallback={item.name || "B"}
          />
        ) : (
          <View style={styles.bandPlaceholder}>
            <Logo size={24} color={colors.grape[4]} />
          </View>
        )}
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
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <ReviewCard
        review={item}
        onPressAuthor={handleUserPress}
        onPressBand={(slug: string) => navigation.navigate("BandProfile", { slug })}
      />
    </View>
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate("EventDetails", { eventId: item.id })}
    >
      <View style={styles.eventDate}>
        <Text style={styles.eventDay}>
          {new Date(item.event_date).getDate()}
        </Text>
        <Text style={styles.eventMonth}>
          {new Date(item.event_date).toLocaleString("default", {
            month: "short",
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
      case "users":
        return { icon: "users", title: "No users found" };
      case "bands":
        return { icon: "music", title: "No bands found" };
      case "reviews":
        return { icon: "message-circle", title: "No recommendations found" };
      case "events":
        return { icon: "calendar", title: "No events found" };
    }
  };

  const renderContent = () => {
    if (loading) return <LoadingScreen />;

    const emptyProps = getEmptyMessage();

    switch (activeTab) {
      case "users":
        return (
          <FlatList
            data={users}
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
            onScroll={handleScroll}
            scrollEventThrottle={400}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case "bands":
        return (
          <FlatList
            data={bands}
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
            onScroll={handleScroll}
            scrollEventThrottle={400}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case "reviews":
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
            onScroll={handleScroll}
            scrollEventThrottle={400}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
      case "events":
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
            onScroll={handleScroll}
            scrollEventThrottle={400}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={<EmptyState {...emptyProps} />}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
                activeTab === tab.key ? theme.colors.primary : colors.grape[5]
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
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: theme.fonts.thecoaMedium,
    color: colors.blue.base,
    lineHeight: 24,
  },
  listItemSubtitle: {
    fontSize: theme.fontSizes.xs,
    color: colors.grey[5],
    marginTop: 2,
  },
  bandPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grape[2],
    justifyContent: "center",
    alignItems: "center",
  },
  reviewItem: {
    marginBottom: theme.spacing.md,
  },
  eventItem: {
    flexDirection: "row",
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  eventDate: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.grape[2],
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  eventDay: {
    fontSize: theme.fontSizes.xl,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  eventMonth: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[6],
    textTransform: "uppercase",
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.fontSizes.base,
    fontWeight: "600",
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
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
