import React, { useState } from "react";
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
  IconExternalLink,
  IconShare,
  IconMessageCircle,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react-native";
import { Review } from "@goodsongs/api-client";
import { ProfilePhoto } from "./ProfilePhoto";
import { Tag } from "./Tag";
import { theme, colors } from "@/theme";
import { fixImageUrl } from "@/utils/imageUrl";
import { apiClient } from "@/utils/api";

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

export function ReviewCard({
  review,
  onPressAuthor,
  onPressBand,
  onPressReview,
}: ReviewCardProps) {
  const authorUsername = review.author?.username || review.user?.username;
  const authorProfileImage = review.author?.profile_image_url;

  // Like state
  const [isLiked, setIsLiked] = useState(review.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(review.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  // Comments count
  const commentsCount = review.comments_count ?? 0;

  const handleOpenLink = () => {
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
      style={styles.card}
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
          <Text style={styles.authorName}>@{authorUsername || "unknown"}</Text>
          <Text style={styles.dateText}>{formatDate(review.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {/* Song Content Container */}
      <View style={styles.songContainer}>
        {/* Song Info */}
        <View style={styles.songRow}>
          <View style={styles.songInfo}>
            {review.artwork_url ? (
              <FastImage
                source={{ uri: fixImageUrl(review.artwork_url) || "" }}
                style={styles.artwork}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder]} />
            )}
            <View style={styles.songDetails}>
              <Text style={styles.songName} numberOfLines={1}>
                {review.song_name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  review.band?.slug && onPressBand?.(review.band.slug)
                }
                disabled={!review.band?.slug || !onPressBand}
              >
                <Text style={styles.bandName} numberOfLines={1}>
                  {review.band_name}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {review.song_link && (
            <TouchableOpacity
              onPress={handleOpenLink}
              style={styles.linkButton}
            >
              <IconExternalLink size={20} color={colors.grape[6]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Review Text */}
        <Text style={styles.reviewText} numberOfLines={3}>
          {review.review_text}
        </Text>

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
              <Text style={styles.moreText}>
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
          <IconShare size={22} color={colors.grape[6]} />
        </TouchableOpacity>

        {/* Comments Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPressReview?.(review)}
          disabled={!onPressReview}
        >
          <IconMessageCircle size={22} color={colors.grape[6]} />
          {commentsCount > 0 && (
            <Text style={styles.actionCount}>{commentsCount}</Text>
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
            <ActivityIndicator size="small" color={colors.grape[6]} />
          ) : isLiked ? (
            <IconHeartFilled size={22} color="#ef4444" />
          ) : (
            <IconHeart size={22} color={colors.grape[6]} />
          )}
          {likesCount > 0 && (
            <Text
              style={[styles.actionCount, isLiked && styles.actionCountLiked]}
            >
              {likesCount}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 2,
    borderBottomColor: colors.grape[3],
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
    color: colors.grape[6],
  },
  dateText: {
    fontSize: theme.fontSizes.xs,
    color: colors.grey[5],
  },
  songContainer: {
    marginTop: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.grape[2],
    borderStyle: "dotted",
    paddingBottom: theme.spacing.md,
  },
  songRow: {
    backgroundColor: colors.grape[2],
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
  artworkPlaceholder: {
    backgroundColor: colors.grape[2],
  },
  songDetails: {
    flex: 1,
  },
  songName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
    color: colors.grey[9],
    lineHeight: 24,
  },
  bandName: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  linkButton: {
    padding: theme.spacing.xs,
  },
  reviewText: {
    fontSize: theme.fontSizes.base,
    color: colors.grey[8],
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
    color: colors.grape[5],
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
    color: colors.grape[6],
  },
  actionCountLiked: {
    color: "#ef4444",
  },
});
