import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  AppState,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FastImage from "react-native-fast-image";
import Icon from "@react-native-vector-icons/feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import {
  Header,
  ReviewCard,
  LoadingScreen,
  EmptyState,
  Logo,
} from "@/components";
import { theme, colors } from "@/theme";
import { useAuthStore } from "@/context/authStore";
import { apiClient } from "@/utils/api";
import { Review, RecentlyPlayedTrack } from "@goodsongs/api-client";
import { fixImageUrl } from "@/utils/imageUrl";
import { RootStackParamList, MainTabParamList } from "@/navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<MainTabParamList, "Home">;
};

export function FeedScreen({ navigation, route }: Props) {
  const { user: currentUser, refreshUser } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Recently played state
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(
    [],
  );
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(true);
  const [refreshingArtworkId, setRefreshingArtworkId] = useState<
    number | string | null
  >(null);

  // Email verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Success banner state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "Recommendation posted!",
  );
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Animate success banner
  useEffect(() => {
    if (showSuccess) {
      // Fade in
      bannerOpacity.setValue(1);
      // Fade out after 1 second
      const timer = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowSuccess(false);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, bannerOpacity]);

  // Refresh user when app returns to foreground (e.g. after confirming email)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && currentUser?.email_confirmed === false) {
        refreshUser();
      }
    });
    return () => subscription.remove();
  }, [currentUser?.email_confirmed, refreshUser]);

  // Email resend countdown timer
  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      Alert.alert(
        "Email Sent",
        response.message || "Confirmation email has been sent.",
      );
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send confirmation email";
      Alert.alert("Error", message);
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = currentUser?.can_resend_confirmation && retryAfter === 0;

  const fetchFeed = useCallback(async (pageNum: number, refresh = false) => {
    try {
      const response = await apiClient.getFollowingFeed(pageNum);
      const newReviews = response?.reviews || [];

      if (refresh) {
        setReviews(newReviews);
      } else {
        setReviews((prev) => [...prev, ...newReviews]);
      }

      const totalPages = response?.pagination?.total_pages || 1;
      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      // Set empty state on error
      if (refresh) {
        setReviews([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, []);

  // Fetch recently played tracks (from any source)
  const fetchRecentlyPlayed = useCallback(async () => {
    setRecentlyPlayedLoading(true);
    try {
      const response = await apiClient.getRecentlyPlayed({ limit: 12 });
      setRecentlyPlayed(response?.tracks || []);
    } catch (error) {
      console.error("Failed to fetch recently played:", error);
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, true);
    fetchRecentlyPlayed();
  }, [fetchFeed, fetchRecentlyPlayed]);

  // Handle success banner from CreateReview
  useEffect(() => {
    if (route.params?.showSuccess) {
      setSuccessMessage("Recommendation posted!");
      setShowSuccess(true);
      // Refresh feed to show new review
      fetchFeed(1, true);
      // Clear the param immediately
      navigation.setParams({ showSuccess: undefined });
    }
  }, [route.params?.showSuccess, navigation, fetchFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchFeed(1, true);
    fetchRecentlyPlayed();
  };

  // Render recently played section
  const renderRecentlyPlayed = () => {
    if (recentlyPlayedLoading) {
      return (
        <View style={styles.recentlyPlayedSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <View style={styles.recentlyPlayedLoading}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      );
    }

    // Show connection prompt only when there are no tracks
    if (recentlyPlayed.length === 0) {
      return (
        <View style={styles.recentlyPlayedSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <View style={styles.connectLastFm}>
            <Icon name="music" size={24} color={colors.grape[5]} />
            <Text style={styles.connectText}>
              Connect Last.fm or enable scrobbling to see your recently played
              tracks
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.recentlyPlayedSection}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentlyPlayedList}
        >
          {recentlyPlayed.map((track, index) => (
            <View
              key={`${track.name}-${track.artist}-${index}`}
              style={styles.trackCard}
            >
              <View style={styles.artworkContainer}>
                {track.album_art_url ? (
                  <FastImage
                    source={{ uri: fixImageUrl(track.album_art_url) || "" }}
                    style={styles.trackArtwork}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View
                    style={[
                      styles.trackArtwork,
                      styles.trackArtworkPlaceholder,
                    ]}
                  >
                    <Logo size={28} color={colors.grape[4]} />
                  </View>
                )}
                {track.now_playing && (
                  <View style={styles.nowPlayingOverlay}>
                    <Icon name="volume-2" size={28} color={colors.grape[0]} />
                  </View>
                )}
                {!track.album_art_url && track.can_refresh_artwork && (
                  <TouchableOpacity
                    style={styles.refreshArtworkButton}
                    onPress={() => {
                      const scrobbleId = getScrobbleId(track);
                      if (scrobbleId) {
                        handleRefreshArtwork(scrobbleId, track.name);
                      }
                    }}
                    disabled={refreshingArtworkId !== null}
                  >
                    {refreshingArtworkId === getScrobbleId(track) ? (
                      <ActivityIndicator size="small" color={colors.grape[8]} />
                    ) : (
                      <Icon
                        name="refresh-cw"
                        size={14}
                        color={colors.grape[8]}
                      />
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.trackName} numberOfLines={1}>
                {track.name}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artist}
              </Text>
              <TouchableOpacity
                style={styles.recommendButton}
                onPress={() => handleRecommendTrack(track)}
              >
                <Icon name="plus" size={12} color={colors.grape[0]} />
                <Text style={styles.recommendButtonText}>Recommend</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const loadingMoreRef = useRef(false);

  const handleLoadMore = useCallback(() => {
    if (loadingMoreRef.current || loading || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFeed(nextPage);
  }, [loading, hasMore, page, fetchFeed]);

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

  const handlePressAuthor = (username: string) => {
    if (username === currentUser?.username) {
      navigation.navigate("Main", { screen: "Profile" });
    } else {
      navigation.navigate("UserProfile", { username });
    }
  };

  const handlePressBand = (slug: string) => {
    navigation.navigate("BandProfile", { slug });
  };

  const handlePressReview = (review: Review) => {
    const username = review.author?.username || review.user?.username;
    if (username) {
      navigation.navigate("ReviewDetail", { reviewId: review.id, username });
    }
  };

  const handleRecommendTrack = (track: RecentlyPlayedTrack) => {
    navigation.navigate("Main", {
      screen: "CreateReview",
      params: {
        song_name: track.name,
        band_name: track.artist,
        artwork_url: track.album_art_url || "",
      },
    });
  };

  const getScrobbleId = (
    track: RecentlyPlayedTrack,
  ): number | string | undefined => {
    return track.scrobble_id ?? track.id;
  };

  const showSuccessBanner = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const handleRefreshArtwork = async (
    scrobbleId: number | string,
    trackName: string,
  ) => {
    setRefreshingArtworkId(scrobbleId);
    try {
      const response = await apiClient.refreshScrobbleArtwork(scrobbleId);
      if (response.status === "success" && response.artwork_url) {
        showSuccessBanner(`Found artwork for "${trackName}"`);
        fetchRecentlyPlayed();
      } else if (response.status === "not_found") {
        showSuccessBanner(`No artwork found for "${trackName}"`);
      } else {
        showSuccessBanner(response.message || "Artwork refreshed");
        fetchRecentlyPlayed();
      }
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error ||
        String(error) ||
        "Failed to refresh artwork";
      Alert.alert("Error", message);
    } finally {
      setRefreshingArtworkId(null);
    }
  };

  if (loading && reviews.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Home"
        rightContent={
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.settingsButton}
          >
            <Icon name="settings" size={24} color={colors.grape[8]} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ReviewCard
              review={item}
              onPressAuthor={handlePressAuthor}
              onPressBand={handlePressBand}
              onPressReview={handlePressReview}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        ListFooterComponent={
          reviews.length > 0 ? (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : hasMore ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreButtonText}>Load More</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.endOfListText}>You're all caught up!</Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="No recommendations yet"
            message="Follow some users to see their recommendations here"
          />
        }
        ListHeaderComponent={
          <>
            {currentUser && currentUser.email_confirmed === false && (
              <View style={styles.emailBanner}>
                <View style={styles.emailBannerContent}>
                  <Icon name="alert-circle" size={18} color="#c05621" />
                  <View style={styles.emailBannerText}>
                    <Text style={styles.emailBannerTitle}>
                      Please confirm your email address
                    </Text>
                    <Text style={styles.emailBannerMessage}>
                      We sent a confirmation email to {currentUser.email}.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    (!canResend || resendLoading) &&
                      styles.resendButtonDisabled,
                  ]}
                  onPress={handleResendConfirmation}
                  disabled={!canResend || resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#c05621" />
                  ) : (
                    <Text style={styles.resendButtonText}>
                      {retryAfter > 0
                        ? `Resend (${retryAfter}s)`
                        : "Resend email"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {renderRecentlyPlayed()}
            <Text style={styles.sectionTitle}>Following</Text>
          </>
        }
      />

      {/* Success Banner */}
      {showSuccess && (
        <Animated.View
          style={[styles.successBanner, { opacity: bannerOpacity }]}
        >
          <Icon name="check-circle" size={20} color={colors.grape[0]} />
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  title: {
    fontSize: theme.fontSizes["2xl"],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginVertical: theme.spacing.md,
    lineHeight: 32,
  },
  cardWrapper: {
    marginBottom: theme.spacing.md,
  },
  // Recently Played styles
  recentlyPlayedSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  recentlyPlayedLoading: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
  },
  loadingText: {
    color: colors.grape[5],
    fontSize: theme.fontSizes.sm,
  },
  connectLastFm: {
    padding: theme.spacing.lg,
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  connectText: {
    color: colors.grape[6],
    fontSize: theme.fontSizes.sm,
    textAlign: "center",
  },
  recentlyPlayedList: {
    paddingRight: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  trackCard: {
    width: 120,
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.xs,
  },
  artworkContainer: {
    position: "relative",
    marginBottom: theme.spacing.xs,
  },
  trackArtwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radii.sm,
  },
  trackArtworkPlaceholder: {
    backgroundColor: colors.grape[2],
    justifyContent: "center",
    alignItems: "center",
  },
  refreshArtworkButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.grape[2],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  nowPlayingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: theme.radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  trackName: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.thecoaBold,
    color: colors.grape[8],
    lineHeight: 22,
  },
  trackArtist: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginTop: 2,
  },
  recommendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  recommendButtonText: {
    fontSize: 11,
    lineHeight: 12,
    color: colors.grape[0],
    fontFamily: theme.fonts.thecoa,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  successBanner: {
    position: "absolute",
    bottom: 16,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successText: {
    color: colors.grape[0],
    fontSize: theme.fontSizes.base,
    fontWeight: "600",
  },
  // Email verification banner
  emailBanner: {
    backgroundColor: "#fef3e2",
    borderWidth: 1,
    borderColor: "#f6ad55",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emailBannerContent: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  emailBannerText: {
    flex: 1,
    gap: 2,
  },
  emailBannerTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
    color: "#c05621",
  },
  emailBannerMessage: {
    fontSize: theme.fontSizes.xs,
    color: "#c05621",
    lineHeight: 18,
  },
  resendButton: {
    alignSelf: "flex-start",
    backgroundColor: "#feebc8",
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginLeft: 26,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: theme.fontSizes.xs,
    fontWeight: "600",
    color: "#c05621",
  },
  footerContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  endOfListText: {
    color: colors.grape[5],
    fontSize: theme.fontSizes.sm,
    paddingVertical: theme.spacing.md,
  },
  loadMoreButton: {
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    alignItems: "center",
  },
  loadMoreButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
});
