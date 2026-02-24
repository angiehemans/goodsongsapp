import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "@react-native-vector-icons/feather";
import { RootStackParamList } from "@/navigation/types";
import { Header, ProfilePhoto } from "@/components";
import { apiClient } from "@/utils/api";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { useAuthStore } from "@/context/authStore";
import { useNotificationStore } from "@/context/notificationStore";

type NotificationType =
  | "new_follower"
  | "new_review"
  | "review_like"
  | "review_comment"
  | "comment_like"
  | "mention";

interface NotificationActor {
  id: number;
  username: string;
  profile_image_url?: string;
}

interface Notification {
  id: number;
  notification_type?: NotificationType;
  type?: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
  actor: NotificationActor;
  song_name?: string;
  band_name?: string;
  review?: {
    id: number;
    song_name?: string;
    band_name?: string;
  };
  comment?: {
    id: number;
    body: string;
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuthStore();
  const { clearUnreadCount, pausePolling, resumePolling } =
    useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (page === 1 && !append) {
          setIsLoading(true);
        }

        const response = await apiClient.getNotifications(page);
        const newNotifications = response?.notifications || [];

        if (append) {
          setNotifications((prev) => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        setCurrentPage(response?.meta?.current_page || 1);
        setTotalPages(response?.meta?.total_pages || 1);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Pause polling while viewing notifications to prevent count from refreshing
    pausePolling();

    fetchNotifications(1);

    // Mark all as read and clear badge
    const markAsRead = async () => {
      try {
        await apiClient.markAllNotificationsAsRead();
      } catch {
        // Ignore errors
      }
      clearUnreadCount();
    };
    markAsRead();

    // Resume polling when leaving the screen
    return () => {
      resumePolling();
    };
  }, [fetchNotifications, clearUnreadCount, pausePolling, resumePolling]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);
    fetchNotifications(currentPage + 1, true);
  }, [currentPage, totalPages, isLoadingMore, fetchNotifications]);

  const getNotificationType = (
    notification: Notification,
  ): NotificationType | undefined => {
    return notification.notification_type || notification.type;
  };

  const getNotificationIcon = (
    type: NotificationType | undefined,
  ):
    | "user-plus"
    | "music"
    | "heart"
    | "message-circle"
    | "bell"
    | "at-sign" => {
    switch (type) {
      case "new_follower":
        return "user-plus";
      case "new_review":
        return "music";
      case "review_like":
        return "heart";
      case "comment_like":
        return "heart";
      case "review_comment":
        return "message-circle";
      case "mention":
        return "at-sign";
      default:
        return "bell";
    }
  };

  const getNotificationBadgeStyle = (type: NotificationType | undefined) => {
    switch (type) {
      case "new_follower":
        return styles.followerBadge;
      case "new_review":
        return styles.reviewBadge;
      case "review_like":
        return styles.likeBadge;
      case "comment_like":
        return styles.likeBadge;
      case "review_comment":
        return styles.commentBadge;
      case "mention":
        return styles.mentionBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getActionText = (
    type: NotificationType | undefined,
    notification: Notification,
  ): string => {
    // Use the message from the API if available
    if (notification.message) {
      return notification.message;
    }

    // Fallback to generating text based on type
    switch (type) {
      case "new_follower":
        return "started following you";
      case "new_review": {
        const songPart = notification.song_name
          ? `"${notification.song_name}"`
          : "";
        const bandPart = notification.band_name || "";
        if (songPart && bandPart)
          return `recommended ${songPart} by ${bandPart}`;
        if (songPart) return `recommended ${songPart}`;
        return "recommended your music";
      }
      case "review_like":
        return "liked your recommendation";
      case "comment_like":
        return "liked your comment";
      case "review_comment": {
        const songName =
          notification.review?.song_name || notification.song_name;
        if (songName) return `commented on "${songName}"`;
        return "commented on your recommendation";
      }
      case "mention": {
        const songName =
          notification.review?.song_name || notification.song_name;
        if (notification.comment) {
          if (songName) return `mentioned you in a comment on "${songName}"`;
          return "mentioned you in a comment";
        }
        if (songName) return `mentioned you in "${songName}"`;
        return "mentioned you";
      }
      default:
        return "interacted with you";
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    const notificationType = getNotificationType(notification);

    switch (notificationType) {
      case "new_follower":
        navigation.navigate("UserProfile", {
          username: notification.actor.username,
        });
        break;
      case "new_review":
        navigation.navigate("UserProfile", {
          username: notification.actor.username,
        });
        break;
      case "review_like":
      case "review_comment":
      case "comment_like":
      case "mention":
        if (notification.review?.id && currentUser) {
          navigation.navigate("ReviewDetail", {
            reviewId: notification.review.id,
            username: currentUser.username,
          });
        }
        break;
    }
  };

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => {
      const notificationType = getNotificationType(item);

      return (
        <TouchableOpacity
          style={[
            styles.notificationItem,
            themedStyles.notificationItem,
            !item.read && themedStyles.unreadNotification,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <ProfilePhoto
              src={item.actor?.profile_image_url}
              name={item.actor?.username || "?"}
              size={40}
            />
            <View
              style={[
                styles.typeBadge,
                getNotificationBadgeStyle(notificationType),
                notificationType === undefined && themedStyles.defaultBadge,
              ]}
            >
              <Icon
                name={getNotificationIcon(notificationType)}
                size={10}
                color={themeColors.textInverse}
              />
            </View>
          </View>

          <View style={styles.notificationContent}>
            {/* Line 1: Username and time */}
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationUsername,
                  themedStyles.notificationUsername,
                  !item.read && styles.unreadText,
                ]}
              >
                @{item.actor?.username}
              </Text>
              <Text
                style={[styles.notificationTime, themedStyles.notificationTime]}
              >
                · {formatTimeAgo(item.created_at)}
              </Text>
            </View>

            {/* Line 2: Action */}
            <Text
              style={[
                styles.notificationAction,
                themedStyles.notificationAction,
              ]}
              numberOfLines={2}
            >
              {getActionText(notificationType, item)}
            </Text>

            {/* Line 3: Comment preview (if applicable) */}
            {(notificationType === "review_comment" ||
              notificationType === "mention") &&
              item.comment?.body && (
                <Text
                  style={[styles.commentPreview, themedStyles.commentPreview]}
                  numberOfLines={2}
                >
                  "{item.comment.body}"
                </Text>
              )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleNotificationPress, themedStyles, themeColors],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={48} color={themeColors.iconMuted} />
      <Text style={[styles.emptyTitle, themedStyles.emptyTitle]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptySubtitle, themedStyles.emptySubtitle]}>
        When someone follows you or interacts with your reviews, you'll see it
        here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={themeColors.btnPrimaryBg} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, themedStyles.container]}
        edges={["top"]}
      >
        <Header title="Alerts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.btnPrimaryBg} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, themedStyles.container]}
      edges={["top"]}
    >
      <Header title="Alerts" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.listContent
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.btnPrimaryBg}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    notificationItem: {
      borderBottomColor: colors.borderSubtle,
    },
    unreadNotification: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    defaultBadge: {
      backgroundColor: colors.iconMuted,
    },
    notificationUsername: {
      color: colors.textHeading,
    },
    notificationTime: {
      color: colors.textMuted,
    },
    notificationAction: {
      color: colors.textMuted,
    },
    commentPreview: {
      color: colors.textPrimary,
    },
    emptyTitle: {
      color: colors.textHeading,
    },
    emptySubtitle: {
      color: colors.textMuted,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 2,
    borderStyle: "solid",
    borderRadius: 0,
  },
  avatarContainer: {
    position: "relative",
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  followerBadge: {
    backgroundColor: "#6366f1",
  },
  reviewBadge: {
    backgroundColor: "#3b82f6",
  },
  likeBadge: {
    backgroundColor: "#ef4444",
  },
  commentBadge: {
    backgroundColor: "#10b981",
  },
  mentionBadge: {
    backgroundColor: "#f97316",
  },
  defaultBadge: {
    // Color applied via themedStyles
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  notificationUsername: {
    fontSize: theme.fontSizes.sm,
    fontFamily: theme.fonts.thecoaMedium,
  },
  unreadText: {
    fontFamily: theme.fonts.thecoaBold,
  },
  notificationTime: {
    fontSize: theme.fontSizes.xs,
  },
  notificationAction: {
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  commentPreview: {
    fontSize: theme.fontSizes.sm,
    marginTop: 4,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.thecoaBold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    lineHeight: 30,
  },
  emptySubtitle: {
    fontSize: theme.fontSizes.base,
    textAlign: "center",
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});
