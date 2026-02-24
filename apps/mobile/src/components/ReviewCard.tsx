import React, { useState, memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
} from "react-native";
import FastImage from "react-native-fast-image";
import {
  IconPlayerPlay,
  IconShare,
  IconMessageCircle,
  IconHeart,
  IconHeartFilled,
  IconLink,
} from "@tabler/icons-react-native";
import { Review, StreamingPlatform } from "@goodsongs/api-client";
import { ProfilePhoto } from "./ProfilePhoto";
import { MentionText } from "./MentionText";
import { Tag } from "./Tag";
import { StreamingLinksModal } from "./StreamingLinksModal";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { fixImageUrl } from "@/utils/imageUrl";
import { apiClient, StreamingLinks } from "@/utils/api";
import { useAuthStore } from "@/context/authStore";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface ReviewCardProps {
  review: Review;
  onPressAuthor?: (username: string) => void;
  onPressBand?: (slug: string) => void;
  onPressReview?: (review: Review) => void;
}

export const ReviewCard = memo(function ReviewCard({
  review,
  onPressAuthor,
  onPressBand,
  onPressReview,
}: ReviewCardProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);
  const { user } = useAuthStore();

  const authorUsername = review.author?.username || review.user?.username;
  const authorProfileImage = review.author?.profile_image_url;

  // Like state
  const [isLiked, setIsLiked] = useState(review.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(review.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  // Streaming links modal state
  const [showStreamingModal, setShowStreamingModal] = useState(false);

  // Comments count
  const commentsCount = review.comments_count ?? 0;

  // Get streaming data from track object or review directly
  const track = (review as any).track;
  const band = review.band as any;
  const streamingLinks: StreamingLinks | undefined = track?.streaming_links || (review as any).streaming_links;
  const preferredTrackLink: string | undefined = track?.preferred_track_link;
  const songlinkUrl: string | undefined = track?.songlink_url || (review as any).songlink_url;
  const songlinkSearchUrl: string | undefined = track?.songlink_search_url || (review as any).songlink_search_url;
  const preferredBandLink: string | undefined = band?.preferred_band_link;

  // Get available streaming links from track
  const getAvailableStreamingLinks = (): Array<{ platform: StreamingPlatform; url: string }> => {
    if (!streamingLinks) return [];
    return (Object.entries(streamingLinks) as [StreamingPlatform, string | undefined][])
      .filter(([_, url]) => url)
      .map(([platform, url]) => ({ platform, url: url! }));
  };

  // Get available band links
  const getAvailableBandLinks = (): Array<{ platform: string; url: string }> => {
    if (!band) return [];
    const bandLinks: Array<{ platform: string; url: string }> = [];
    if (band.spotify_link) bandLinks.push({ platform: 'spotify', url: band.spotify_link });
    if (band.apple_music_link) bandLinks.push({ platform: 'appleMusic', url: band.apple_music_link });
    if (band.youtube_music_link) bandLinks.push({ platform: 'youtubeMusic', url: band.youtube_music_link });
    if (band.bandcamp_link) bandLinks.push({ platform: 'bandcamp', url: band.bandcamp_link });
    if (band.soundcloud_link) bandLinks.push({ platform: 'soundcloud', url: band.soundcloud_link });
    return bandLinks;
  };

  const availableLinks = getAvailableStreamingLinks();
  const availableBandLinks = getAvailableBandLinks();
  const preferredPlatform = user?.preferred_streaming_platform as StreamingPlatform | undefined;
  const preferredLink = preferredPlatform && streamingLinks?.[preferredPlatform];

  // Get the best URL following the fallback chain:
  // preferred_track_link > streaming_links > songlink_url > preferred_band_link > band_links > songlink_search_url
  const getBestUrl = (): string | undefined => {
    if (preferredTrackLink) return preferredTrackLink;
    if (availableLinks.length > 0) return availableLinks[0].url;
    if (songlinkUrl) return songlinkUrl;
    if (preferredBandLink) return preferredBandLink;
    if (availableBandLinks.length > 0) return availableBandLinks[0].url;
    if (songlinkSearchUrl) return songlinkSearchUrl;
    return review.song_link;
  };

  // Should show modal when we have multiple options at the current priority level
  // (for band links modal title and behavior)
  const shouldShowBandModal = availableLinks.length === 0 && !songlinkUrl && !preferredBandLink && availableBandLinks.length > 1 && !preferredTrackLink;

  // Check if we have any playable link
  const hasPlayableLink = !!getBestUrl();

  // Determine if the best link is a direct song link (play icon) or not (link icon)
  // Song links: preferred_track_link, streaming_links, songlink_url
  // Non-song links: preferred_band_link, band_links, songlink_search_url, song_link
  const isSongLink = !!(preferredTrackLink || availableLinks.length > 0 || songlinkUrl);

  const handlePlayClick = () => {
    // Priority 1: preferred_track_link
    if (preferredTrackLink) {
      Linking.openURL(preferredTrackLink);
      return;
    }

    // Priority 2: User's preferred platform from streaming_links
    if (preferredLink) {
      Linking.openURL(preferredLink);
      return;
    }

    // Priority 3: If only one streaming link, direct open
    if (availableLinks.length === 1) {
      Linking.openURL(availableLinks[0].url);
      return;
    }

    // Priority 4: Multiple streaming links - show modal
    if (availableLinks.length > 1) {
      setShowStreamingModal(true);
      return;
    }

    // Priority 5: songlink_url
    if (songlinkUrl) {
      Linking.openURL(songlinkUrl);
      return;
    }

    // Priority 6: preferred_band_link
    if (preferredBandLink) {
      Linking.openURL(preferredBandLink);
      return;
    }

    // Priority 7: If only one band link, direct open
    if (availableBandLinks.length === 1) {
      Linking.openURL(availableBandLinks[0].url);
      return;
    }

    // Priority 8: Multiple band links - show modal
    if (availableBandLinks.length > 1) {
      setShowStreamingModal(true);
      return;
    }

    // Priority 9: songlink_search_url
    if (songlinkSearchUrl) {
      Linking.openURL(songlinkSearchUrl);
      return;
    }

    // Final fallback: song_link
    if (review.song_link) {
      Linking.openURL(review.song_link);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://goodsongs.app/users/${authorUsername}/reviews/${review.id}`;
      await Share.share({
        message: `Check out this song recommendation on GoodSongs: "${review.song_name}" by ${review.band_name}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleLikePress = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeReview(review.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likeReview(review.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error("Failed to like/unlike review:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, themedStyles.card]}
      onPress={() => onPressReview?.(review)}
      activeOpacity={onPressReview ? 0.7 : 1}
      disabled={!onPressReview}
    >
      {/* Author Info */}
      <TouchableOpacity
        style={styles.authorRow}
        onPress={() => authorUsername && onPressAuthor?.(authorUsername)}
        disabled={!authorUsername || !onPressAuthor}
      >
        <ProfilePhoto
          src={authorProfileImage}
          alt={authorUsername || "Unknown user"}
          size={36}
          fallback={authorUsername || "?"}
        />
        <View style={styles.authorInfo}>
          <Text style={[styles.authorName, themedStyles.authorName]}>@{authorUsername || "unknown"}</Text>
          <Text style={[styles.dateText, themedStyles.dateText]}>{formatDate(review.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Song Content Container */}
      <View style={[styles.songContainer, themedStyles.songContainer]}>
        {/* Song Info */}
        <View style={[styles.songRow, themedStyles.songRow]}>
          <View style={styles.songInfo}>
            {review.artwork_url ? (
              <FastImage
                source={{ uri: fixImageUrl(review.artwork_url) || "" }}
                style={styles.artwork}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder, themedStyles.artworkPlaceholder]} />
            )}
            <View style={styles.songDetails}>
              <Text style={[styles.songName, themedStyles.songName]} numberOfLines={1}>
                {review.song_name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  review.band?.slug && onPressBand?.(review.band.slug)
                }
                disabled={!review.band?.slug || !onPressBand}
              >
                <Text style={[styles.bandName, themedStyles.bandName]} numberOfLines={1}>
                  {review.band_name}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {hasPlayableLink && (
            <TouchableOpacity
              onPress={handlePlayClick}
              style={styles.linkButton}
            >
              {isSongLink ? (
                <IconPlayerPlay size={20} color={colors.iconMuted} />
              ) : (
                <IconLink size={20} color={colors.iconMuted} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Review Text */}
        <MentionText
          text={(review as any).formatted_review_text || review.review_text}
          style={[styles.reviewText, themedStyles.reviewText]}
          numberOfLines={3}
        />

        {/* Tags */}
        {review.liked_aspects && review.liked_aspects.length > 0 && (
          <View style={styles.tagsRow}>
            {review.liked_aspects.slice(0, 3).map((aspect, index) => (
              <Tag
                key={index}
                text={
                  typeof aspect === "string"
                    ? aspect
                    : aspect.name || String(aspect)
                }
              />
            ))}
            {review.liked_aspects.length > 3 && (
              <Text style={[styles.moreText, themedStyles.moreText]}>
                +{review.liked_aspects.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {/* Share Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleShare();
          }}
        >
          <IconShare size={22} color={colors.iconMuted} />
        </TouchableOpacity>

        {/* Comments Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPressReview?.(review)}
          disabled={!onPressReview}
        >
          <IconMessageCircle size={22} color={colors.iconMuted} />
          {commentsCount > 0 && (
            <Text style={[styles.actionCount, themedStyles.actionCount]}>{commentsCount}</Text>
          )}
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleLikePress();
          }}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color={colors.iconMuted} />
          ) : isLiked ? (
            <IconHeartFilled size={22} color="#ef4444" />
          ) : (
            <IconHeart size={22} color={colors.iconMuted} />
          )}
          {likesCount > 0 && (
            <Text
              style={[styles.actionCount, themedStyles.actionCount, isLiked && styles.actionCountLiked]}
            >
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Streaming Links Modal */}
      {(availableLinks.length > 0 || availableBandLinks.length > 0) && (
        <StreamingLinksModal
          visible={showStreamingModal}
          onClose={() => setShowStreamingModal(false)}
          streamingLinks={streamingLinks}
          bandLinks={availableBandLinks}
          songName={review.song_name}
          bandName={review.band_name}
          songlinkUrl={songlinkUrl || songlinkSearchUrl}
          isBandLinks={shouldShowBandModal}
        />
      )}
    </TouchableOpacity>
  );
});

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    card: {
      borderBottomColor: colors.borderDefault,
    },
    authorName: {
      color: colors.textMuted,
    },
    dateText: {
      color: colors.textMuted,
    },
    songContainer: {
      borderBottomColor: colors.borderSubtle,
    },
    songRow: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    artworkPlaceholder: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    songName: {
      color: colors.textPrimary,
    },
    bandName: {
      color: colors.textMuted,
    },
    reviewText: {
      color: colors.textSecondary,
    },
    moreText: {
      color: colors.textMuted,
    },
    actionCount: {
      color: colors.textMuted,
    },
  });

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 2,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
  dateText: {
    fontSize: theme.fontSizes.xs,
  },
  songContainer: {
    marginTop: theme.spacing.sm,
    borderBottomWidth: 2,
    borderStyle: "dotted",
    paddingBottom: theme.spacing.md,
  },
  songRow: {
    borderRadius: theme.radii.sm,
    padding: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  songInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.sm,
  },
  artworkPlaceholder: {},
  songDetails: {
    flex: 1,
  },
  songName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
    lineHeight: 24,
  },
  bandName: {
    fontSize: theme.fontSizes.sm,
  },
  linkButton: {
    padding: theme.spacing.xs,
  },
  reviewText: {
    fontSize: theme.fontSizes.base,
    lineHeight: 20,
    marginVertical: theme.spacing.sm,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  moreText: {
    fontSize: theme.fontSizes.xs,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.fontSizes.sm,
  },
  actionCountLiked: {
    color: "#ef4444",
  },
});
