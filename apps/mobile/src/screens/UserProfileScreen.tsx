import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/feather";
import {
  Header,
  ProfilePhoto,
  Badge,
  ReviewCard,
  EmptyState,
} from "@/components";
import { theme, colors } from "@/theme";
import { useAuthStore } from "@/context/authStore";
import { apiClient } from "@/utils/api";
import { fixImageUrl } from "@/utils/imageUrl";
import { UserProfile, Review } from "@goodsongs/api-client";

export function UserProfileScreen({ route, navigation }: any) {
  const { username } = route.params;
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Pagination state
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  const fetchProfile = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      if (isLoadMore) {
        setLoadingMoreReviews(true);
      } else {
        setLoading(true);
      }

      try {
        const userProfile = await apiClient.getUserProfile(username, page);
        setProfile(userProfile);
        setIsFollowing(
          userProfile.following ?? userProfile.is_following ?? false,
        );

        const newReviews = userProfile.reviews || [];
        if (isLoadMore) {
          setReviews((prev) => [...prev, ...newReviews]);
        } else {
          setReviews(newReviews);
        }

        setHasMoreReviews(
          userProfile.reviews_pagination?.has_next_page || false,
        );
        setReviewsPage(page);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (!isLoadMore) {
          setReviews([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMoreReviews(false);
      }
    },
    [username],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile(1, false);
  };

  const handleLoadMore = () => {
    if (hasMoreReviews && !loadingMoreReviews) {
      fetchProfile(reviewsPage + 1, true);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiClient.unfollowUser(profile.id);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followers_count: (prev.followers_count || 1) - 1,
              }
            : null,
        );
      } else {
        await apiClient.followUser(profile.id);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                followers_count: (prev.followers_count || 0) + 1,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileSection}>
      {/* Profile Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={fixImageUrl(profile?.profile_image_url)}
          alt={profile?.username}
          size={72}
          fallback={profile?.username || "U"}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>@{profile?.username || username}</Text>
          {(profile?.location || profile?.city) && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={colors.grape[5]} />
              <Text style={styles.location}>
                {profile?.city && profile?.region
                  ? `${profile.city}, ${profile.region}`
                  : profile?.location || profile?.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Follow Button */}
      {!isOwnProfile && profile && (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollowToggle}
          disabled={followLoading}
        >
          {followLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? colors.grape[6] : colors.grape[0]}
            />
          ) : (
            <>
              <Icon
                name={isFollowing ? "user-check" : "user-plus"}
                size={16}
                color={isFollowing ? colors.grape[6] : colors.grape[0]}
              />
              <Text
                style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Bio */}
      {profile?.about_me && <Text style={styles.bio}>{profile.about_me}</Text>}

      {/* Stats Badges */}
      <View style={styles.badgesRow}>
        <Badge
          text={`${profile?.reviews_count || reviews.length} recommendation${(profile?.reviews_count || reviews.length) !== 1 ? "s" : ""}`}
        />
        {profile?.followers_count !== undefined && (
          <Badge
            text={`${profile.followers_count} follower${profile.followers_count !== 1 ? "s" : ""}`}
          />
        )}
        {profile?.following_count !== undefined && (
          <Badge text={`${profile.following_count} following`} />
        )}
      </View>

      {/* Recommendations Title */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
    </View>
  );

  // Memoized render function - must be defined before any early returns
  const renderReviewItem = useCallback(({ item }: { item: Review }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard
        review={item}
        onPressBand={(slug: string) =>
          navigation.navigate("BandProfile", { slug })
        }
        onPressReview={(review: Review) => {
          const reviewUsername =
            review.author?.username || review.user?.username;
          if (reviewUsername) {
            navigation.navigate("ReviewDetail", {
              reviewId: review.id,
              username: reviewUsername,
            });
          }
        }}
      />
    </View>
  ), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title=""
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="" showBackButton onBackPress={() => navigation.goBack()} />

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
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderProfileHeader}
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message={`${profile?.username || username} hasn't shared any recommendations yet.`}
          />
        }
        ListFooterComponent={
          loadingMoreReviews ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: theme.spacing.md,
  },
  profileSection: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.thecoaMedium,
    color: theme.colors.secondary,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  location: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  followingButton: {
    backgroundColor: colors.grape[2],
    borderWidth: 1,
    borderColor: colors.grape[4],
  },
  followButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
    color: colors.grape[0],
  },
  followingButtonText: {
    color: colors.grape[6],
  },
  bio: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[7],
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
