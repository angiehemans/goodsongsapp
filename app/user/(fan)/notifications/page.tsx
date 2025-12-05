'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconBell, IconCheck, IconChecks, IconMusic, IconUserPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNotifications } from '@/contexts/NotificationContext';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Notification } from '@/lib/api';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { setUnreadCount } = useNotifications();
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!user) return;

    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiClient.getNotifications(page);
      const newNotifications = response?.notifications || [];

      if (append) {
        setNotificationsList((prev) => [...prev, ...newNotifications]);
      } else {
        setNotificationsList(newNotifications);
      }

      const newUnreadCount = response?.unread_count || 0;
      setLocalUnreadCount(newUnreadCount);
      setUnreadCount(newUnreadCount);
      setCurrentPage(response?.meta?.current_page || 1);
      setTotalPages(response?.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load notifications',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  // Mark all notifications as read when visiting the page
  const markAllAsReadOnVisit = useCallback(async () => {
    if (!user) return;
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      setLocalUnreadCount(0);
      setUnreadCount(0); // Update global context (clears header badge)
    } catch {
      // Silently fail - not critical
    }
  }, [user, setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark all as read after initial load completes
  useEffect(() => {
    if (!isLoading && notificationsList.length > 0 && localUnreadCount > 0) {
      markAllAsReadOnVisit();
    }
  }, [isLoading, notificationsList.length, localUnreadCount, markAllAsReadOnVisit]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setLocalUnreadCount((prev) => Math.max(0, prev - 1));
      setUnreadCount(Math.max(0, localUnreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      setLocalUnreadCount(0);
      setUnreadCount(0);
      notifications.show({
        title: 'Success',
        message: 'All notifications marked as read',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to mark notifications as read',
        color: 'red',
      });
    }
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchNotifications(currentPage + 1, true);
    }
  };

  // Helper to get notification type (handles both field names from API)
  const getNotificationType = (notification: Notification) => {
    return notification.notification_type || notification.type;
  };

  const getNotificationIcon = (type: string | undefined) => {
    switch (type) {
      case 'new_follower':
        return <IconUserPlus size={20} />;
      case 'new_review':
        return <IconMusic size={20} />;
      default:
        return <IconBell size={20} />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const type = getNotificationType(notification);
    switch (type) {
      case 'new_follower':
        return `/users/${notification.actor.username}`;
      case 'new_review':
        return `/users/${notification.actor.username}`;
      default:
        return '#';
    }
  };

  const getNotificationLabel = (notification: Notification) => {
    const type = getNotificationType(notification);
    switch (type) {
      case 'new_follower':
        return 'New Follower';
      case 'new_review':
        return 'New Review';
      default:
        return 'Notification';
    }
  };

  const getNotificationColor = (notification: Notification) => {
    const type = getNotificationType(notification);
    return type === 'new_follower' ? 'grape' : 'blue';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Group justify="space-between" align="center" my="sm">
        <Group gap="sm">
          <Title order={2} c="blue.8" fw={500}>
            Notifications
          </Title>
          {localUnreadCount > 0 && (
            <Badge color="red" variant="filled" size="lg">
              {localUnreadCount} unread
            </Badge>
          )}
        </Group>
        {localUnreadCount > 0 && (
          <Button
            variant="light"
            size="sm"
            leftSection={<IconChecks size={16} />}
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : notificationsList.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center py="xl">
            <Stack align="center" gap="md">
              <IconBell size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center">
                No notifications yet
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                When someone follows you or reviews your band, you'll see it here.
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="xs">
          {notificationsList.map((notification) => (
            <Paper
              key={notification.id}
              p="md"
              radius="md"
              withBorder
              style={{
                backgroundColor: notification.read
                  ? undefined
                  : 'var(--mantine-color-blue-light)',
                borderColor: notification.read
                  ? undefined
                  : 'var(--mantine-color-blue-4)',
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="md" wrap="nowrap" style={{ flex: 1 }}>
                  <Link href={`/users/${notification.actor.username}`}>
                    <ProfilePhoto
                      src={notification.actor.profile_image_url}
                      fallback={notification.actor.username}
                      size={48}
                    />
                  </Link>

                  <Stack gap={4} style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Badge
                        variant="light"
                        color={getNotificationColor(notification)}
                        size="sm"
                        leftSection={getNotificationIcon(getNotificationType(notification))}
                      >
                        {getNotificationLabel(notification)}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {formatTimeAgo(notification.created_at)}
                      </Text>
                    </Group>

                    <Link
                      href={getNotificationLink(notification)}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Text size="sm" fw={notification.read ? 400 : 500}>
                        {notification.message}
                      </Text>
                    </Link>

                    {getNotificationType(notification) === 'new_review' &&
                      (notification.song_name || notification.band_name) && (
                        <Text size="xs" c="dimmed">
                          {notification.song_name && `"${notification.song_name}"`}
                          {notification.song_name && notification.band_name && ' by '}
                          {notification.band_name}
                        </Text>
                      )}
                  </Stack>
                </Group>

                {!notification.read && (
                  <Tooltip label="Mark as read">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <IconCheck size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Paper>
          ))}

          {currentPage < totalPages && (
            <Center mt="md">
              <Button variant="light" onClick={handleLoadMore} loading={loadingMore}>
                Load More
              </Button>
            </Center>
          )}
        </Stack>
      )}
    </>
  );
}
