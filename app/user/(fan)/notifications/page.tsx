'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconBell, IconCheck, IconChecks, IconMusic, IconUserPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
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
    <Box maw={700}>
      <Group justify="space-between" align="center" mb="md">
        <Group gap="sm">
          <Title order={2} c="blue.8" fw={500}>
            Notifications
          </Title>
          {localUnreadCount > 0 && (
            <Badge color="red" variant="filled" size="sm" radius="xl">
              {localUnreadCount}
            </Badge>
          )}
        </Group>
        {localUnreadCount > 0 && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconChecks size={14} />}
            onClick={handleMarkAllAsRead}
          >
            Mark all read
          </Button>
        )}
      </Group>

      {isLoading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : notificationsList.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-gray-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconBell size={36} color="var(--mantine-color-gray-5)" />
            </Box>
            <Text c="dimmed" ta="center" fw={500}>
              No notifications yet
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={300}>
              When someone follows you or interacts with your content, you'll see it here.
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap={0}>
          {notificationsList.map((notification, index) => (
            <Box
              key={notification.id}
              component={Link}
              href={getNotificationLink(notification)}
              py="md"
              px="sm"
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                borderBottom:
                  index < notificationsList.length - 1
                    ? '1px solid var(--mantine-color-gray-2)'
                    : 'none',
                backgroundColor: notification.read
                  ? 'transparent'
                  : 'var(--mantine-color-grape-0)',
                borderRadius: 'var(--mantine-radius-md)',
                marginBottom: index < notificationsList.length - 1 ? 4 : 0,
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = notification.read
                  ? 'var(--mantine-color-gray-0)'
                  : 'var(--mantine-color-grape-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.read
                  ? 'transparent'
                  : 'var(--mantine-color-grape-0)';
              }}
            >
              <Group gap="md" wrap="nowrap" align="flex-start">
                <Box pos="relative">
                  <ProfilePhoto
                    src={notification.actor.profile_image_url}
                    fallback={notification.actor.username}
                    size={44}
                  />
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor:
                        getNotificationType(notification) === 'new_follower'
                          ? 'var(--mantine-color-grape-6)'
                          : 'var(--mantine-color-blue-6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                    }}
                  >
                    {getNotificationType(notification) === 'new_follower' ? (
                      <IconUserPlus size={12} color="white" />
                    ) : (
                      <IconMusic size={12} color="white" />
                    )}
                  </Box>
                </Box>

                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={notification.read ? 400 : 600} lineClamp={2}>
                    <Text span fw={600} c="dark">
                      @{notification.actor.username}
                    </Text>{' '}
                    <Text span c={notification.read ? 'dimmed' : 'dark'}>
                      {getNotificationType(notification) === 'new_follower'
                        ? 'started following you'
                        : 'posted a new recommendation'}
                    </Text>
                  </Text>

                  {getNotificationType(notification) === 'new_review' &&
                    (notification.song_name || notification.band_name) && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {notification.song_name && `"${notification.song_name}"`}
                        {notification.song_name && notification.band_name && ' by '}
                        {notification.band_name}
                      </Text>
                    )}

                  <Text size="xs" c="dimmed">
                    {formatTimeAgo(notification.created_at)}
                  </Text>
                </Stack>

                {!notification.read && (
                  <Tooltip label="Mark as read">
                    <ActionIcon
                      variant="subtle"
                      color="grape"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      <IconCheck size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Box>
          ))}

          {currentPage < totalPages && (
            <Center mt="lg">
              <Button variant="light" size="sm" onClick={handleLoadMore} loading={loadingMore}>
                Load More
              </Button>
            </Center>
          )}
        </Stack>
      )}
    </Box>
  );
}
