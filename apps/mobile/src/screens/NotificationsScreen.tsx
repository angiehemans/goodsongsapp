import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/feather';
import { Header, ProfilePhoto } from '@/components';
import { apiClient } from '@/utils/api';
import { theme, colors } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { useNotificationStore } from '@/context/notificationStore';
import { PaginationMeta } from '@goodsongs/api-client';

type NotificationType = 'new_follower' | 'new_review' | 'review_like' | 'review_comment';

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

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuthStore();
  const { clearUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
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
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
    // Mark all as read when viewing and clear badge
    apiClient.markAllNotificationsAsRead().catch(() => {});
    clearUnreadCount();
  }, [fetchNotifications, clearUnreadCount]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || currentPage >= totalPages) return;
    setIsLoadingMore(true);
    fetchNotifications(currentPage + 1, true);
  }, [currentPage, totalPages, isLoadingMore, fetchNotifications]);

  const getNotificationType = (notification: Notification): NotificationType | undefined => {
    return notification.notification_type || notification.type;
  };

  const getNotificationIcon = (type: NotificationType | undefined): string => {
    switch (type) {
      case 'new_follower':
        return 'user-plus';
      case 'new_review':
        return 'music';
      case 'review_like':
        return 'heart';
      case 'review_comment':
        return 'message-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationBadgeStyle = (type: NotificationType | undefined) => {
    switch (type) {
      case 'new_follower':
        return styles.followerBadge;
      case 'new_review':
        return styles.reviewBadge;
      case 'review_like':
        return styles.likeBadge;
      case 'review_comment':
        return styles.commentBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    const notificationType = getNotificationType(notification);

    switch (notificationType) {
      case 'new_follower':
        navigation.navigate('UserProfile' as never, { username: notification.actor.username } as never);
        break;
      case 'new_review':
        navigation.navigate('UserProfile' as never, { username: notification.actor.username } as never);
        break;
      case 'review_like':
      case 'review_comment':
        if (notification.review?.id && currentUser) {
          navigation.navigate('ReviewDetail' as never, {
            reviewId: notification.review.id,
            username: currentUser.username,
          } as never);
        }
        break;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const notificationType = getNotificationType(item);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <ProfilePhoto
            src={item.actor?.profile_image_url}
            name={item.actor?.username || '?'}
            size={48}
          />
          <View style={[styles.typeBadge, getNotificationBadgeStyle(notificationType)]}>
            <Icon
              name={getNotificationIcon(notificationType)}
              size={12}
              color={colors.grape[0]}
            />
          </View>
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationMessage, !item.read && styles.unreadMessage]}>
            {item.message}
          </Text>

          {/* Show song info for new_review notifications */}
          {notificationType === 'new_review' && (item.song_name || item.band_name) && (
            <Text style={styles.notificationMeta} numberOfLines={1}>
              {item.song_name && `"${item.song_name}"`}
              {item.song_name && item.band_name && ' by '}
              {item.band_name}
            </Text>
          )}

          {/* Show comment preview for review_comment notifications */}
          {notificationType === 'review_comment' && item.comment?.body && (
            <Text style={styles.commentPreview} numberOfLines={1}>
              "{item.comment.body}"
            </Text>
          )}

          <Text style={styles.notificationTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={48} color={colors.grape[4]} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When someone follows you or interacts with your reviews, you'll see it here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Alerts" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Alerts" />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  unreadNotification: {
    backgroundColor: colors.grape[1],
    borderColor: colors.grape[3],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grape[0],
  },
  followerBadge: {
    backgroundColor: theme.colors.primary,
  },
  reviewBadge: {
    backgroundColor: theme.colors.secondary,
  },
  likeBadge: {
    backgroundColor: '#ef4444',
  },
  commentBadge: {
    backgroundColor: '#10b981',
  },
  defaultBadge: {
    backgroundColor: colors.grape[5],
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationMessage: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  notificationMeta: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  commentPreview: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    lineHeight: 30,
  },
  emptySubtitle: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});
