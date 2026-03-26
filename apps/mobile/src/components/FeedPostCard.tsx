import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import FastImage from "react-native-fast-image";
import {
  IconMessageCircle,
  IconHeart,
  IconShare,
} from "@tabler/icons-react-native";
import { ProfilePhoto } from "./ProfilePhoto";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { fixImageUrl } from "@/utils/imageUrl";
import { FeedPostItem } from "@/utils/api";
import { showShareMenu } from "@/utils/share";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface FeedPostCardProps {
  post: FeedPostItem;
  onPressAuthor?: (username: string) => void;
  onPressPost?: (post: FeedPostItem) => void;
}

export const FeedPostCard = memo(function FeedPostCard({
  post,
  onPressAuthor,
  onPressPost,
}: FeedPostCardProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  const authorUsername = post.author?.username;
  const authorDisplayName = post.author?.display_name || authorUsername;
  const authorProfileImage = post.author?.profile_image_url;
  const commentsCount = post.comments_count ?? 0;
  const likesCount = post.likes_count ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, themedStyles.card]}
      onPress={() => onPressPost?.(post)}
      activeOpacity={onPressPost ? 0.7 : 1}
      disabled={!onPressPost}
    >
      {/* Author Row */}
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
          <Text style={[styles.authorName, themedStyles.authorName]}>
            {authorDisplayName || "unknown"}
          </Text>
        </View>
        <Text style={[styles.dateText, themedStyles.dateText]}>
          {formatDate(post.publish_date || post.created_at)}
        </Text>
      </TouchableOpacity>

      {/* Featured Image */}
      {post.featured_image_url && (
        <FastImage
          source={{ uri: fixImageUrl(post.featured_image_url) || "" }}
          style={styles.featuredImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}

      {/* Post Title */}
      <Text style={[styles.postTitle, themedStyles.postTitle]} numberOfLines={2}>
        {post.title}
      </Text>

      {/* Excerpt */}
      {post.excerpt && (
        <Text style={[styles.excerpt, themedStyles.excerpt]} numberOfLines={3}>
          {post.excerpt}
        </Text>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            const fallbackUrl = `https://goodsongs.app/blog/${post.author?.username || ''}/${post.slug}`;
            showShareMenu('post', post.id, post.title, fallbackUrl);
          }}
        >
          <IconShare size={22} color={colors.iconMuted} />
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <IconMessageCircle size={22} color={colors.iconMuted} />
          {commentsCount > 0 && (
            <Text style={[styles.actionCount, themedStyles.actionCount]}>
              {commentsCount}
            </Text>
          )}
        </View>

        <View style={styles.actionButton}>
          <IconHeart size={22} color={colors.iconMuted} />
          {likesCount > 0 && (
            <Text style={[styles.actionCount, themedStyles.actionCount]}>
              {likesCount}
            </Text>
          )}
        </View>
      </View>
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
    postTitle: {
      color: colors.textPrimary,
    },
    excerpt: {
      color: colors.textSecondary,
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
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaMedium,
  },
  dateText: {
    fontSize: theme.fontSizes.xs,
  },
  featuredImage: {
    width: "100%",
    height: 180,
    borderRadius: theme.radii.sm,
    marginBottom: theme.spacing.sm,
  },
  postTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 26,
    marginBottom: theme.spacing.xs,
  },
  excerpt: {
    fontSize: theme.fontSizes.base,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
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
});
