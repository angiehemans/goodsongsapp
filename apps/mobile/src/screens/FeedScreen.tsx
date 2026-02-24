import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
  AppState,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FastImage from "react-native-fast-image";
import {
  IconMusic,
  IconVolume,
  IconRefresh,
  IconPlus,
  IconSettings,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import {
  Header,
  ReviewCard,
  LoadingScreen,
  EmptyState,
  Logo,
  ArtworkPickerModal,
} from "@/components";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { useAuthStore } from "@/context/authStore";
import { useScrobbleStore } from "@/context/scrobbleStore";
import { useNotificationStore } from "@/context/notificationStore";
import { apiClient, FanDashboardFeedItem, FanDashboardRecentlyPlayed, CreateScrobbleFromLastfmData } from "@/utils/api";
import { Review, RecentlyPlayedTrack } from "@goodsongs/api-client";
import { fixImageUrl } from "@/utils/imageUrl";
import { RootStackParamList, MainTabParamList } from "@/navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<MainTabParamList, "Home">;
};

export function FeedScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  const { user: currentUser, refreshUser } = useAuthStore();
  const nowPlaying = useScrobbleStore((state) => state.nowPlaying);
  const pendingCount = useScrobbleStore((state) => state.pendingCount);
  const syncing = useScrobbleStore((state) => state.syncing);
  const setNotificationInitialCount = useNotificationStore((state) => state.setInitialCount);
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

  // Combine now playing with recently played tracks
  // Shows currently playing track first, then recently played (excluding duplicates)
  const tracksToDisplay = React.useMemo(() => {
    if (!nowPlaying) return recentlyPlayed;

    // Check if we already have this track in recentlyPlayed with artwork
    const existingTrack = recentlyPlayed.find(
      (track) =>
        track.name.toLowerCase() === nowPlaying.trackName.toLowerCase() &&
        track.artist.toLowerCase() === nowPlaying.artistName.toLowerCase(),
    );

    // Convert nowPlaying to RecentlyPlayedTrack format
    // Use artwork from native (artworkUri or base64 albumArt), fallback to existing track
    const nativeArtwork = nowPlaying.artworkUri || nowPlaying.albumArt || null;
    const nowPlayingTrack: RecentlyPlayedTrack = {
      name: nowPlaying.trackName,
      artist: nowPlaying.artistName,
      album: nowPlaying.albumName,
      played_at: existingTrack?.played_at ?? null,
      now_playing: true,
      source: "scrobble",
      album_art_url: nativeArtwork ?? existingTrack?.album_art_url ?? null,
      loved: existingTrack?.loved ?? false,
      metadata_status: nativeArtwork
        ? "enriched"
        : (existingTrack?.metadata_status ?? "pending"),
      scrobble_id: existingTrack?.scrobble_id,
      has_preferred_artwork: existingTrack?.has_preferred_artwork,
      can_refresh_artwork: existingTrack?.can_refresh_artwork,
    };

    // Filter out the now playing track from recently played to avoid duplicates
    const filteredRecent = recentlyPlayed.filter(
      (track) =>
        !(
          track.name.toLowerCase() === nowPlaying.trackName.toLowerCase() &&
          track.artist.toLowerCase() === nowPlaying.artistName.toLowerCase()
        ),
    );

    return [nowPlayingTrack, ...filteredRecent];
  }, [nowPlaying, recentlyPlayed]);

  // Email verification state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Success banner state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    "Recommendation posted!",
  );
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Artwork picker modal state
  const [artworkPickerVisible, setArtworkPickerVisible] = useState(false);
  const [selectedTrackForArtwork, setSelectedTrackForArtwork] =
    useState<RecentlyPlayedTrack | null>(null);

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

  // Refresh dashboard when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        // Refresh dashboard data silently when app becomes active
        fetchDashboard(true);
        // Also refresh user if email not confirmed (in case they just confirmed)
        if (currentUser?.email_confirmed === false) {
          refreshUser();
        }
      }
    });
    return () => subscription.remove();
  }, [currentUser?.email_confirmed, refreshUser, fetchDashboard]);

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

  // Convert dashboard feed preview to Review format
  const convertFeedPreviewToReviews = (feedItems: FanDashboardFeedItem[]): Review[] => {
    return feedItems.map((item) => ({
      id: item.id,
      song_name: item.song_name,
      band_name: item.band_name,
      artwork_url: item.artwork_url,
      review_text: item.review_text,
      created_at: item.created_at,
      likes_count: item.likes_count,
      liked_by_current_user: item.liked_by_current_user,
      comments_count: item.comments_count,
      author: {
        id: item.author.id,
        username: item.author.username,
        profile_image_url: item.author.profile_image_url,
      },
      // Include band data for band links
      band: item.band,
      // Include track data for streaming links
      track: item.track,
    } as Review));
  };

  // Fetch initial dashboard data (optimized single endpoint)
  // silent mode updates data without affecting loading states (for background refresh)
  const fetchDashboard = useCallback(async (silent = false) => {
    try {
      const response = await apiClient.getFanDashboard();

      // Set notification count from dashboard (avoids extra API call)
      setNotificationInitialCount(response.unread_notifications_count);

      // Set recently played from dashboard
      const tracks = response.recently_played.map((track: FanDashboardRecentlyPlayed) => ({
        name: track.name,
        artist: track.artist,
        album: track.album || "",
        played_at: track.played_at,
        now_playing: track.now_playing,
        source: track.source,
        album_art_url: track.album_art_url || null,
        loved: false,
        scrobble_id: track.scrobble_id,
        metadata_status: track.metadata_status,
        has_preferred_artwork: track.has_preferred_artwork,
        can_refresh_artwork: track.can_refresh_artwork,
        // Last.fm specific metadata
        lastfm_url: track.lastfm_url,
        mbid_recording: track.mbid_recording,
        mbid_artist: track.mbid_artist,
        mbid_album: track.mbid_album,
      })) as RecentlyPlayedTrack[];
      setRecentlyPlayed(tracks);

      // Set feed preview from dashboard
      const feedReviews = convertFeedPreviewToReviews(response.following_feed_preview);
      setReviews(feedReviews);
      // Dashboard only returns preview, so we always have more
      setHasMore(feedReviews.length >= 5);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      // Only clear data on initial load, not on silent refresh
      if (!silent) {
        setReviews([]);
        setRecentlyPlayed([]);
        setHasMore(false);
      }
    } finally {
      // Only update loading states on initial load
      if (!silent) {
        setLoading(false);
        setRecentlyPlayedLoading(false);
      }
    }
  }, [setNotificationInitialCount]);

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
  // silent mode updates tracks without showing loading state (for polling)
  const fetchRecentlyPlayed = useCallback(async (silent = false) => {
    if (!silent) {
      setRecentlyPlayedLoading(true);
    }
    try {
      const response = await apiClient.getRecentlyPlayed({ limit: 12 });
      const newTracks = response?.tracks || [];

      if (silent) {
        // In silent mode, only update tracks that have changed
        // This prevents UI flicker and maintains scroll position
        setRecentlyPlayed((prevTracks) => {
          // If lengths differ, just replace
          if (prevTracks.length !== newTracks.length) {
            return newTracks;
          }
          // Check if any track's metadata has updated
          let hasChanges = false;
          const updatedTracks = prevTracks.map((prevTrack, idx) => {
            const newTrack = newTracks[idx];
            // Check if this track's artwork or metadata changed
            if (
              prevTrack.album_art_url !== newTrack.album_art_url ||
              prevTrack.metadata_status !== newTrack.metadata_status ||
              prevTrack.has_preferred_artwork !== newTrack.has_preferred_artwork
            ) {
              hasChanges = true;
              return newTrack;
            }
            return prevTrack;
          });
          return hasChanges ? updatedTracks : prevTracks;
        });
      } else {
        setRecentlyPlayed(newTracks);
      }
    } catch (error) {
      console.error("Failed to fetch recently played:", error);
      if (!silent) {
        setRecentlyPlayed([]);
      }
    } finally {
      if (!silent) {
        setRecentlyPlayedLoading(false);
      }
    }
  }, []);

  // Initial load uses optimized dashboard endpoint
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Refresh dashboard when screen regains focus (e.g. navigating back from another screen)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      // Skip the initial focus since fetchDashboard is already called above
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      // Use silent mode to avoid UI blinking
      fetchDashboard(true);
    }, [fetchDashboard])
  );

  // Poll for pending artwork updates
  // When tracks have metadata_status === 'pending', poll every 3 seconds
  useEffect(() => {
    const hasPendingTracks = recentlyPlayed.some(
      (track) => track.metadata_status === "pending",
    );

    if (!hasPendingTracks) return;

    const pollInterval = setInterval(() => {
      fetchRecentlyPlayed(true); // silent fetch
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [recentlyPlayed, fetchRecentlyPlayed]);

  // Track when sync completes to refresh recently played
  const wasSyncingRef = useRef(false);

  useEffect(() => {
    if (wasSyncingRef.current && !syncing) {
      // Sync completed, refresh recently played to show new tracks
      fetchRecentlyPlayed();
    }
    wasSyncingRef.current = syncing;
  }, [syncing, fetchRecentlyPlayed]);

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
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Recently Played</Text>
          <View style={[styles.recentlyPlayedLoading, themedStyles.recentlyPlayedLoading]}>
            <Text style={[styles.loadingText, themedStyles.loadingText]}>Loading...</Text>
          </View>
        </View>
      );
    }

    // Show connection prompt only when there are no tracks and nothing playing
    if (tracksToDisplay.length === 0) {
      return (
        <View style={styles.recentlyPlayedSection}>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Recently Played</Text>
          <View style={[styles.connectLastFm, themedStyles.connectLastFm]}>
            <IconMusic size={24} color={colors.textMuted} />
            <Text style={[styles.connectText, themedStyles.connectText]}>
              Connect Last.fm or enable scrobbling to see your recently played
              tracks
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.recentlyPlayedSection}>
        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>
          {nowPlaying ? "Now Playing" : "Recently Played"}
        </Text>
        {/* Offline sync notice */}
        {syncing && pendingCount > 0 && (
          <View style={[styles.syncingNotice, themedStyles.syncingNotice]}>
            <ActivityIndicator size="small" color={colors.textMuted} />
            <Text style={[styles.syncingNoticeText, themedStyles.syncingNoticeText]}>
              Loading {pendingCount} {pendingCount === 1 ? 'track' : 'tracks'} played while offline
            </Text>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentlyPlayedList}
        >
          {tracksToDisplay.map((track, index) => (
            <View
              key={`${track.name}-${track.artist}-${index}`}
              style={[styles.trackCard, themedStyles.trackCard]}
            >
              <Pressable
                style={styles.artworkContainer}
                onLongPress={() => handleArtworkLongPress(track)}
                delayLongPress={400}
              >
                {track.album_art_url ? (
                  <FastImage
                    source={{ uri: fixImageUrl(track.album_art_url) || "" }}
                    style={styles.trackArtwork}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : track.metadata_status === "pending" ? (
                  <View
                    style={[
                      styles.trackArtwork,
                      styles.trackArtworkPlaceholder,
                      themedStyles.trackArtworkPlaceholder,
                    ]}
                  >
                    <Logo size={28} color={colors.iconSubtle} />
                    <Text style={[styles.pendingArtworkText, themedStyles.pendingArtworkText]}>
                      Loading artwork
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.trackArtwork,
                      styles.trackArtworkPlaceholder,
                      themedStyles.trackArtworkPlaceholder,
                    ]}
                  >
                    <Logo size={28} color={colors.iconSubtle} />
                  </View>
                )}
                {track.now_playing && (
                  <View style={styles.nowPlayingOverlay}>
                    <IconVolume size={28} color={colors.textInverse} />
                  </View>
                )}
                {!track.album_art_url && track.can_refresh_artwork && (
                  <TouchableOpacity
                    style={[styles.refreshArtworkButton, themedStyles.refreshArtworkButton]}
                    onPress={() => {
                      const scrobbleId = getScrobbleId(track);
                      if (scrobbleId) {
                        handleRefreshArtwork(scrobbleId, track.name);
                      }
                    }}
                    disabled={refreshingArtworkId !== null}
                  >
                    {refreshingArtworkId === getScrobbleId(track) ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <IconRefresh size={14} color={colors.textPrimary} />
                    )}
                  </TouchableOpacity>
                )}
              </Pressable>
              <Text style={[styles.trackName, themedStyles.trackName]} numberOfLines={1}>
                {track.name}
              </Text>
              <Text style={[styles.trackArtist, themedStyles.trackArtist]} numberOfLines={1}>
                {track.artist}
              </Text>
              <TouchableOpacity
                style={[styles.recommendButton, themedStyles.recommendButton]}
                onPress={() => handleRecommendTrack(track)}
              >
                <IconPlus size={12} color={colors.btnPrimaryText} />
                <Text style={[styles.recommendButtonText, themedStyles.recommendButtonText]}>Recommend</Text>
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

  const handlePressAuthor = useCallback((username: string) => {
    if (username === currentUser?.username) {
      navigation.navigate("Main", { screen: "Profile" });
    } else {
      navigation.navigate("UserProfile", { username });
    }
  }, [currentUser?.username, navigation]);

  const handlePressBand = useCallback((slug: string) => {
    navigation.navigate("BandProfile", { slug });
  }, [navigation]);

  const handlePressReview = useCallback((review: Review) => {
    const username = review.author?.username || review.user?.username;
    if (username) {
      navigation.navigate("ReviewDetail", { reviewId: review.id, username });
    }
  }, [navigation]);

  // Memoized render function for FlatList - must be defined at top level, not inline
  const renderReviewItem = useCallback(
    ({ item }: { item: Review }) => (
      <View style={styles.cardWrapper}>
        <ReviewCard
          review={item}
          onPressAuthor={handlePressAuthor}
          onPressBand={handlePressBand}
          onPressReview={handlePressReview}
        />
      </View>
    ),
    [handlePressAuthor, handlePressBand, handlePressReview]
  );

  const keyExtractor = useCallback((item: Review) => item.id.toString(), []);

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
        // Optimistically update local state with new artwork
        setRecentlyPlayed((prev) =>
          prev.map((track) =>
            track.scrobble_id === scrobbleId
              ? { ...track, album_art_url: response.artwork_url, metadata_status: "enriched" as const }
              : track
          )
        );
        showSuccessBanner(`Found artwork for "${trackName}"`);
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

  // Handle long press on artwork to open picker
  // Works for both scrobbles and Last.fm tracks
  const handleArtworkLongPress = (track: RecentlyPlayedTrack) => {
    setSelectedTrackForArtwork(track);
    setArtworkPickerVisible(true);
  };

  // Handle artwork selection from picker
  const handleArtworkSelect = async (artworkUrl: string) => {
    if (!selectedTrackForArtwork) return;

    const isLastfmTrack = selectedTrackForArtwork.source === "lastfm";
    const scrobbleId = getScrobbleId(selectedTrackForArtwork);

    // For scrobbles, we need a scrobble_id
    if (!isLastfmTrack && !scrobbleId) return;

    // Clear FastImage cache for the old artwork URL to ensure new artwork is fetched
    if (selectedTrackForArtwork.album_art_url) {
      FastImage.clearMemoryCache();
    }

    if (isLastfmTrack) {
      // Convert Last.fm track to scrobble with preferred artwork
      // Optimistically update the local state
      setRecentlyPlayed((prev) =>
        prev.map((track) =>
          track.name === selectedTrackForArtwork.name &&
          track.artist === selectedTrackForArtwork.artist &&
          track.source === "lastfm"
            ? {
                ...track,
                album_art_url: artworkUrl,
                has_preferred_artwork: true,
                source: "scrobble" as const, // Will become a scrobble after API call
              }
            : track
        )
      );

      showSuccessBanner("Artwork updated!");

      // Save to API - this converts the Last.fm track to a scrobble
      try {
        const data: CreateScrobbleFromLastfmData = {
          track_name: selectedTrackForArtwork.name,
          artist_name: selectedTrackForArtwork.artist,
          album_name: selectedTrackForArtwork.album,
          played_at: selectedTrackForArtwork.played_at,
          preferred_artwork_url: artworkUrl,
          original_artwork_url: selectedTrackForArtwork.album_art_url || undefined,
          lastfm_url: selectedTrackForArtwork.lastfm_url,
          mbid_recording: selectedTrackForArtwork.mbid_recording,
          mbid_artist: selectedTrackForArtwork.mbid_artist,
          mbid_album: selectedTrackForArtwork.mbid_album,
          loved: selectedTrackForArtwork.loved,
        };

        const response = await apiClient.createScrobbleFromLastfm(data);

        // Update the track with the new scrobble_id
        // Response may have scrobble.id or id directly at root level
        const newScrobbleId = response.scrobble?.id || (response as any).id;
        if (newScrobbleId) {
          setRecentlyPlayed((prev) =>
            prev.map((track) =>
              track.name === selectedTrackForArtwork.name &&
              track.artist === selectedTrackForArtwork.artist
                ? {
                    ...track,
                    scrobble_id: newScrobbleId,
                    source: "scrobble" as const,
                  }
                : track
            )
          );
        }
      } catch (error) {
        // Revert on failure
        console.error('Failed to convert Last.fm track to scrobble:', error);
        fetchRecentlyPlayed();
      }
    } else {
      // Existing scrobble - just update the artwork
      // Optimistically update the local state immediately for instant UI feedback
      setRecentlyPlayed((prev) =>
        prev.map((track) =>
          track.scrobble_id === scrobbleId
            ? { ...track, album_art_url: artworkUrl, has_preferred_artwork: true }
            : track
        )
      );

      showSuccessBanner("Artwork updated!");

      // Save to API in background
      try {
        await apiClient.setScrobbleArtwork(scrobbleId!, artworkUrl);
      } catch (error) {
        // Revert on failure
        console.error('Failed to save artwork:', error);
        fetchRecentlyPlayed();
      }
    }
  };

  // Handle clearing preferred artwork (only for scrobbles, not Last.fm tracks)
  const handleClearPreferredArtwork = async () => {
    if (!selectedTrackForArtwork) return;

    // Can only clear artwork for scrobbles, not Last.fm tracks
    if (selectedTrackForArtwork.source === "lastfm") return;

    const scrobbleId = getScrobbleId(selectedTrackForArtwork);
    if (!scrobbleId) return;

    // Clear FastImage cache to ensure default artwork is fetched
    FastImage.clearMemoryCache();

    showSuccessBanner("Artwork reset to default");

    // Clear to API and refetch to get the default artwork URL
    try {
      await apiClient.clearScrobbleArtwork(scrobbleId);
      // Need to refetch to get the default artwork URL from the server
      fetchRecentlyPlayed();
    } catch (error) {
      console.error('Failed to clear artwork:', error);
    }
  };

  if (loading && reviews.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={["top"]}>
      <Header
        title="Home"
        rightContent={
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.settingsButton}
          >
            <IconSettings size={24} color={colors.iconDefault} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={reviews}
        keyExtractor={keyExtractor}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.btnPrimaryBg]}
            tintColor={colors.btnPrimaryBg}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        ListFooterComponent={
          reviews.length > 0 ? (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator
                    size="small"
                    color={colors.btnPrimaryBg}
                  />
                </View>
              ) : hasMore ? (
                <TouchableOpacity
                  style={[styles.loadMoreButton, themedStyles.loadMoreButton]}
                  onPress={handleLoadMore}
                >
                  <Text style={[styles.loadMoreButtonText, themedStyles.loadMoreButtonText]}>Load More</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.endOfListText, themedStyles.endOfListText]}>You're all caught up!</Text>
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
                  <IconAlertCircle size={18} color="#c05621" />
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

            {/* Discord Notice */}
            <TouchableOpacity
              style={[styles.discordBanner, themedStyles.discordBanner]}
              onPress={() => Linking.openURL("https://discord.gg/33MCPDwws")}
            >
              <Text style={[styles.discordText, themedStyles.discordText]}>
                Want to give us feedback? Join our Discord community!
              </Text>
              <View style={[styles.discordButton, themedStyles.discordButton]}>
                <Text style={[styles.discordButtonText, themedStyles.discordButtonText]}>Join Discord</Text>
              </View>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Following</Text>
          </>
        }
      />

      {/* Success Banner */}
      {showSuccess && (
        <Animated.View
          style={[styles.successBanner, themedStyles.successBanner, { opacity: bannerOpacity }]}
        >
          <IconCircleCheck size={20} color={colors.btnPrimaryText} />
          <Text style={[styles.successText, themedStyles.successText]}>{successMessage}</Text>
        </Animated.View>
      )}

      {/* Artwork Picker Modal */}
      <ArtworkPickerModal
        visible={artworkPickerVisible}
        onClose={() => {
          setArtworkPickerVisible(false);
          setSelectedTrackForArtwork(null);
        }}
        onSelect={handleArtworkSelect}
        trackName={selectedTrackForArtwork?.name || ""}
        artistName={selectedTrackForArtwork?.artist || ""}
        albumName={selectedTrackForArtwork?.album}
        currentArtworkUrl={selectedTrackForArtwork?.album_art_url}
        hasPreferredArtwork={selectedTrackForArtwork?.has_preferred_artwork}
        onClearPreferred={handleClearPreferredArtwork}
      />
    </SafeAreaView>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    recentlyPlayedLoading: {
      backgroundColor: colors.bgSurface,
    },
    loadingText: {
      color: colors.textMuted,
    },
    connectLastFm: {
      backgroundColor: colors.bgSurface,
    },
    connectText: {
      color: colors.textMuted,
    },
    syncingNotice: {
      backgroundColor: colors.bgSurface,
    },
    syncingNoticeText: {
      color: colors.textMuted,
    },
    trackCard: {
      backgroundColor: colors.bgSurface,
    },
    trackArtworkPlaceholder: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    pendingArtworkText: {
      color: colors.textMuted,
    },
    refreshArtworkButton: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    trackName: {
      color: colors.textSecondary,
    },
    trackArtist: {
      color: colors.textMuted,
    },
    recommendButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    recommendButtonText: {
      color: colors.btnPrimaryText,
    },
    successBanner: {
      backgroundColor: colors.btnPrimaryBg,
    },
    successText: {
      color: colors.btnPrimaryText,
    },
    endOfListText: {
      color: colors.textMuted,
    },
    loadMoreButton: {
      backgroundColor: colors.bgSurface,
    },
    loadMoreButtonText: {
      color: colors.btnPrimaryBg,
    },
    // Discord banner themed styles
    discordBanner: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    discordText: {
      color: colors.textSecondary,
    },
    discordButton: {
      backgroundColor: colors.bgSurface,
    },
    discordButtonText: {
      color: colors.textSecondary,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginVertical: theme.spacing.md,
    lineHeight: 32,
  },
  cardWrapper: {
    marginBottom: theme.spacing.md,
  },
  // Discord banner styles
  discordBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  discordText: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
  },
  discordButton: {
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  discordButtonText: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.thecoaMedium,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  // Recently Played styles
  recentlyPlayedSection: {
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  recentlyPlayedLoading: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.radii.md,
  },
  loadingText: {
    fontSize: theme.fontSizes.sm,
  },
  connectLastFm: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.md,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  connectText: {
    fontSize: theme.fontSizes.sm,
    textAlign: "center",
  },
  recentlyPlayedList: {
    paddingRight: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  trackCard: {
    width: 120,
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
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  refreshArtworkButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
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
  pendingArtworkText: {
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },
  trackName: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 22,
  },
  trackArtist: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  recommendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  recommendButtonText: {
    fontSize: 11,
    lineHeight: 12,
    fontFamily: theme.fonts.thecoa,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  syncingNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  syncingNoticeText: {
    fontSize: theme.fontSizes.sm,
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
    fontSize: theme.fontSizes.sm,
    paddingVertical: theme.spacing.md,
  },
  loadMoreButton: {
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    alignItems: "center",
  },
  loadMoreButtonText: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
});
