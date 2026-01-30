import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Alert,
  ActivityIndicator,
  AppState,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@react-native-vector-icons/feather";
import { Header, ReviewCard, LoadingScreen, EmptyState, Logo } from "@/components";
import { theme, colors } from "@/theme";
import { useAuthStore } from "@/context/authStore";
import { useScrobbleStore } from "@/context/scrobbleStore";
import { ScrobbleStatus } from "@/types/scrobble";
import { apiClient } from "@/utils/api";
import { Review, RecentlyPlayedTrack } from "@goodsongs/api-client";
import { fixImageUrl } from "@/utils/imageUrl";

export function FeedScreen({ navigation, route }: any) {
  const { user: currentUser, refreshUser } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Recently played state (Last.fm fallback)
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(
    [],
  );
  const [lastFmConnected, setLastFmConnected] = useState(false);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(true);

  // Scrobble state (Android)
  const isAndroid = Platform.OS === 'android';
  const {
    status: scrobbleStatus,
    nowPlaying,
    recentScrobbles,
    recentScrobblesLoading,
    localScrobbles,
    refreshStatus: refreshScrobbleStatus,
    fetchRecentScrobbles,
    fetchLocalScrobbles,
  } = useScrobbleStore();
  const scrobblingActive = isAndroid && scrobbleStatus === ScrobbleStatus.active;

  // Email verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Success banner state
  const [showSuccess, setShowSuccess] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Handle success banner from CreateReview
  useEffect(() => {
    if (route.params?.showSuccess) {
      setShowSuccess(true);
      // Refresh feed to show new review
      fetchFeed(1, true);
      // Clear the param immediately
      navigation.setParams({ showSuccess: undefined });
    }
  }, [route.params?.showSuccess, navigation, fetchFeed]);

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
      Alert.alert("Email Sent", response.message || "Confirmation email has been sent.");
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send confirmation email";
      Alert.alert("Error", message);
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = currentUser?.can_resend_confirmation && retryAfter === 0;

  const fetchFeed = useCallback(async (pageNum: number, refresh = false) => {
    try {
      const response = await apiClient.getFollowingFeed(pageNum);
      const reviews = response?.reviews || [];

      if (refresh) {
        setReviews(reviews);
      } else {
        setReviews((prev) => [...prev, ...reviews]);
      }

      const totalPages = response?.meta?.total_pages || 1;
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
    }
  }, []);

  // Fetch Last.fm data
  const fetchRecentlyPlayed = useCallback(async () => {
    setRecentlyPlayedLoading(true);
    try {
      const status = await apiClient.getLastFmStatus();
      setLastFmConnected(status?.connected || false);

      if (status?.connected) {
        try {
          const response = await apiClient.getRecentlyPlayed(12);
          setRecentlyPlayed(response?.tracks || []);
        } catch (tracksError) {
          // Silently fail for tracks - user is still connected, just can't fetch tracks
          console.error("Failed to fetch tracks:", tracksError);
          setRecentlyPlayed([]);
        }
      }
    } catch (error) {
      // If status check fails, assume not connected and don't show the section
      console.error("Failed to fetch Last.fm status:", error);
      setLastFmConnected(false);
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1, true);
    // Always fetch Last.fm data as fallback
    fetchRecentlyPlayed();
    // On Android, refresh scrobble status (which also fetches local scrobbles)
    if (isAndroid) {
      refreshScrobbleStatus();
    }
  }, [fetchFeed, fetchRecentlyPlayed, isAndroid, refreshScrobbleStatus]);

  // When scrobbling becomes active, also try to fetch API scrobbles
  useEffect(() => {
    if (scrobblingActive) {
      fetchRecentScrobbles();
      fetchLocalScrobbles();
    }
  }, [scrobblingActive, fetchRecentScrobbles, fetchLocalScrobbles]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchFeed(1, true);
    fetchRecentlyPlayed();
    if (scrobblingActive) {
      fetchRecentScrobbles();
      fetchLocalScrobbles();
    }
  };

  // Render scrobbled tracks section (when scrobbling is active on Android)
  const renderScrobbledTracks = () => {
    const hasNowPlaying = nowPlaying != null;
    const hasApiTracks = recentScrobbles.length > 0;
    const hasLocalTracks = localScrobbles.length > 0;
    const hasTracks = hasApiTracks || hasLocalTracks;

    // Build a unified track list: prefer API scrobbles, fall back to local pending
    const tracks: { id: string; trackName: string; artistName: string; coverArtUrl?: string; source: 'api' | 'local' }[] = [];

    if (hasApiTracks) {
      for (const s of recentScrobbles) {
        tracks.push({
          id: `api-${s.id}`,
          trackName: s.track_name,
          artistName: s.artist_name,
          coverArtUrl: s.track?.album?.cover_art_url || undefined,
          source: 'api',
        });
      }
    }

    // Add local scrobbles that aren't already in API results (dedup by track+artist)
    if (hasLocalTracks) {
      const apiTrackKeys = new Set(
        recentScrobbles.map((s) => `${s.track_name}::${s.artist_name}`.toLowerCase())
      );
      for (const s of localScrobbles) {
        const key = `${s.trackName}::${s.artistName}`.toLowerCase();
        if (!apiTrackKeys.has(key)) {
          tracks.push({
            id: `local-${s.id}`,
            trackName: s.trackName,
            artistName: s.artistName,
            source: 'local',
          });
        }
      }
    }

    // Try to find cover art for the now-playing track from API scrobbles
    const nowPlayingArt = nowPlaying
      ? recentScrobbles.find(
          (s) =>
            s.track_name.toLowerCase() === nowPlaying.trackName.toLowerCase() &&
            s.artist_name.toLowerCase() === nowPlaying.artistName.toLowerCase()
        )?.track?.album?.cover_art_url
      : undefined;

    if (!hasNowPlaying && !hasTracks) {
      // No scrobble data at all — fall back to Last.fm
      return renderLastFmRecentlyPlayed();
    }

    return (
      <View style={styles.recentlyPlayedSection}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentlyPlayedList}
        >
          {/* Now Playing card */}
          {hasNowPlaying && (
            <View style={styles.trackCard}>
              <View style={styles.artworkContainer}>
                {nowPlayingArt ? (
                  <Image
                    source={{ uri: fixImageUrl(nowPlayingArt) || '' }}
                    style={styles.trackArtwork}
                  />
                ) : (
                  <View
                    style={[styles.trackArtwork, styles.trackArtworkPlaceholder]}
                  >
                    <Logo size={28} color={colors.grape[4]} />
                  </View>
                )}
                <View style={styles.nowPlayingOverlay}>
                  <Icon name="volume-2" size={28} color={colors.grape[0]} />
                </View>
              </View>
              <Text style={styles.trackName} numberOfLines={1}>
                {nowPlaying!.trackName}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {nowPlaying!.artistName}
              </Text>
              <TouchableOpacity
                style={styles.recommendButton}
                onPress={() =>
                  navigation.navigate("CreateReview", {
                    song_name: nowPlaying!.trackName,
                    band_name: nowPlaying!.artistName,
                  })
                }
              >
                <Icon name="plus" size={12} color={colors.grape[0]} />
                <Text style={styles.recommendButtonText}>Recommend</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scrobbled tracks (merged API + local) */}
          {tracks.map((track) => (
            <View key={track.id} style={styles.trackCard}>
              <View style={styles.artworkContainer}>
                {track.coverArtUrl ? (
                  <Image
                    source={{ uri: fixImageUrl(track.coverArtUrl) || '' }}
                    style={styles.trackArtwork}
                  />
                ) : (
                  <View
                    style={[styles.trackArtwork, styles.trackArtworkPlaceholder]}
                  >
                    <Logo size={28} color={colors.grape[4]} />
                  </View>
                )}
              </View>
              <Text style={styles.trackName} numberOfLines={1}>
                {track.trackName}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artistName}
              </Text>
              <TouchableOpacity
                style={styles.recommendButton}
                onPress={() =>
                  navigation.navigate("CreateReview", {
                    song_name: track.trackName,
                    band_name: track.artistName,
                  })
                }
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

  // Render Last.fm recently played section (fallback when scrobbling is not active)
  const renderLastFmRecentlyPlayed = () => {
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

    if (!lastFmConnected) {
      return (
        <View style={styles.recentlyPlayedSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <View style={styles.connectLastFm}>
            <Icon name="music" size={24} color={colors.grape[5]} />
            <Text style={styles.connectText}>
              Connect Last.fm to see your recently played tracks
            </Text>
          </View>
        </View>
      );
    }

    if (recentlyPlayed.length === 0) {
      return (
        <View style={styles.recentlyPlayedSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <View style={styles.connectLastFm}>
            <Icon name="music" size={24} color={colors.grape[5]} />
            <Text style={styles.connectText}>
              No recently played tracks found
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
          {recentlyPlayed.map((track, index) => {
            const albumImage =
              track.album?.images?.find((img) => img.size === "large") ||
              track.album?.images?.find((img) => img.size === "medium") ||
              track.album?.images?.[0];
            const artistNames =
              track.artists?.map((a) => a.name).join(", ") || "";

            return (
              <View
                key={`${track.mbid || track.name}-${index}`}
                style={styles.trackCard}
              >
                <View style={styles.artworkContainer}>
                  {albumImage?.url ? (
                    <Image
                      source={{ uri: fixImageUrl(albumImage.url) || "" }}
                      style={styles.trackArtwork}
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
                </View>
                <Text style={styles.trackName} numberOfLines={1}>
                  {track.name}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {artistNames}
                </Text>
                <TouchableOpacity
                  style={styles.recommendButton}
                  onPress={() => handleRecommendTrack(track)}
                >
                  <Icon name="plus" size={12} color={colors.grape[0]} />
                  <Text style={styles.recommendButtonText}>Recommend</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

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
    const artistNames = track.artists?.map((a) => a.name).join(", ") || "";
    const primaryArtist = track.artists?.[0];
    const albumImage =
      track.album?.images?.find((img) => img.size === "extralarge") ||
      track.album?.images?.find((img) => img.size === "large") ||
      track.album?.images?.find((img) => img.size === "medium") ||
      track.album?.images?.[0];

    navigation.navigate("CreateReview", {
      song_name: track.name,
      band_name: artistNames,
      song_link: track.lastfm_url || "",
      artwork_url: albumImage?.url || "",
      band_lastfm_artist_name: primaryArtist?.name,
      band_musicbrainz_id: primaryArtist?.mbid,
    });
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
                    (!canResend || resendLoading) && styles.resendButtonDisabled,
                  ]}
                  onPress={handleResendConfirmation}
                  disabled={!canResend || resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#c05621" />
                  ) : (
                    <Text style={styles.resendButtonText}>
                      {retryAfter > 0 ? `Resend (${retryAfter}s)` : "Resend email"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {scrobblingActive ? renderScrobbledTracks() : renderLastFmRecentlyPlayed()}
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
          <Text style={styles.successText}>Recommendation posted!</Text>
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
    fontFamily: theme.fonts.cooperBold,
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
    fontFamily: theme.fonts.cooperMedium,
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
    fontFamily: theme.fonts.cooperBold,
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
    color: colors.grape[0],
    fontWeight: "600",
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
});
