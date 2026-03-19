import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  IconMessageCircle,
  IconHeart,
} from "@tabler/icons-react-native";
import { ProfilePhoto } from "./ProfilePhoto";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { FeedEventItem } from "@/utils/api";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getEventDay = (dateString: string) => {
  const date = new Date(dateString);
  return date.getDate().toString();
};

const getEventMonth = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
};

const isPastEvent = (dateString: string) => {
  const eventDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
};

interface FeedEventCardProps {
  event: FeedEventItem;
  onPressAuthor?: (username: string) => void;
  onPressEvent?: (event: FeedEventItem) => void;
}

export const FeedEventCard = memo(function FeedEventCard({
  event,
  onPressAuthor,
  onPressEvent,
}: FeedEventCardProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  const authorUsername = event.author?.username;
  const authorDisplayName = event.author?.display_name || authorUsername;
  const authorProfileImage = event.author?.profile_image_url;
  const commentsCount = event.comments_count ?? 0;
  const likesCount = event.likes_count ?? 0;
  const past = isPastEvent(event.event_date);

  const venueLine = [event.venue?.name, event.venue?.city]
    .filter(Boolean)
    .join(", ");

  return (
    <TouchableOpacity
      style={[styles.card, themedStyles.card]}
      onPress={() => onPressEvent?.(event)}
      activeOpacity={onPressEvent ? 0.7 : 1}
      disabled={!onPressEvent}
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
          {formatDate(event.created_at)}
        </Text>
      </TouchableOpacity>

      {/* Event Layout Row */}
      <View style={styles.eventRow}>
        {/* Date Badge */}
        <View style={[styles.dateBadge, themedStyles.dateBadge]}>
          <Text style={[styles.dateBadgeDay, themedStyles.dateBadgeDay]}>
            {getEventDay(event.event_date)}
          </Text>
          <Text style={[styles.dateBadgeMonth, themedStyles.dateBadgeMonth]}>
            {getEventMonth(event.event_date)}
          </Text>
        </View>

        {/* Event Details */}
        <View style={styles.eventDetails}>
          <Text style={[styles.eventName, themedStyles.eventName]} numberOfLines={2}>
            {event.name}
          </Text>
          {venueLine ? (
            <Text style={[styles.venueName, themedStyles.venueName]} numberOfLines={1}>
              {venueLine}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Past Event Badge */}
      {past && (
        <View style={[styles.pastBadge, themedStyles.pastBadge]}>
          <Text style={[styles.pastBadgeText, themedStyles.pastBadgeText]}>
            Past Event
          </Text>
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
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
    dateBadge: {
      backgroundColor: colors.btnPrimaryBg,
    },
    dateBadgeDay: {
      color: colors.btnPrimaryText,
    },
    dateBadgeMonth: {
      color: colors.btnPrimaryText,
    },
    eventName: {
      color: colors.textPrimary,
    },
    venueName: {
      color: colors.textMuted,
    },
    pastBadge: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    pastBadgeText: {
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
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeDay: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 26,
  },
  dateBadgeMonth: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.thecoaMedium,
    textTransform: "uppercase",
  },
  eventDetails: {
    flex: 1,
    gap: 2,
  },
  eventName: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 22,
  },
  venueName: {
    fontSize: theme.fontSizes.sm,
    lineHeight: 18,
  },
  pastBadge: {
    alignSelf: "flex-start",
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginBottom: theme.spacing.xs,
  },
  pastBadgeText: {
    fontSize: theme.fontSizes.xs,
    fontFamily: theme.fonts.thecoaMedium,
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
