'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconBell, IconCheck, IconChecks, IconHeart, IconMessage, IconMusic, IconUserPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, Notification } from '@/lib/api';
import styles from './page.module.css';

export default function NotificationsPage() {
  const { user, isLoading: authLoading, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const { setUnreadCount } = useNotifications();
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [band, setBand] = useState<Band | null>(null);
  const [bandLoading, setBandLoading] = useState(false);

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }
  }, [user, authLoading, isOnboardingComplete, router]);

  // Fetch band data for band accounts
  useEffect(() => {
    const fetchBand = async () => {
      if (!user || !isBand) return;
      setBandLoading(true);
      try {
        const bands = await apiClient.getUserBands();
        if (bands.length > 0) {
          setBand(bands[0]);
        }
      } catch {
        // Silently fail
      } finally {
        setBandLoading(false);
      }
    };
    fetchBand();
  }, [user, isBand]);

  const fetchNotifications = useCallback(
    async (page: number = 1, append: boolean = false) => {
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
    },
    [user, setUnreadCount]
  );

  // Mark all notifications as read when visiting the page
  const markAllAsReadOnVisit = useCallback(async () => {
    if (!user) return;
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      setLocalUnreadCount(0);
      setUnreadCount(0);
    } catch {
      // Silently fail - not critical
    }
  }, [user, setUnreadCount]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

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

  const getNotificationLink = (notification: Notification) => {
    const type = getNotificationType(notification);
    switch (type) {
      case 'new_follower':
        return `/users/${notification.actor.username}`;
      case 'new_review':
        return `/users/${notification.actor.username}`;
      case 'review_like':
      case 'review_comment':
        // Link to the review page if we have review info
        if (notification.review?.id && user) {
          return `/users/${user.username}/reviews/${notification.review.id}`;
        }
        return '#';
      default:
        return '#';
    }
  };

  const getNotificationIcon = (type: string | undefined) => {
    switch (type) {
      case 'new_follower':
        return <IconUserPlus size={12} color="white" />;
      case 'new_review':
        return <IconMusic size={12} color="white" />;
      case 'review_like':
        return <IconHeart size={12} color="white" />;
      case 'review_comment':
        return <IconMessage size={12} color="white" />;
      default:
        return <IconBell size={12} color="white" />;
    }
  };

  const getNotificationIconColor = (type: string | undefined) => {
    switch (type) {
      case 'new_follower':
        return 'var(--mantine-color-grape-6)';
      case 'new_review':
        return 'var(--mantine-color-blue-6)';
      case 'review_like':
        return 'var(--mantine-color-red-6)';
      case 'review_comment':
        return 'var(--mantine-color-green-6)';
      default:
        return 'var(--mantine-color-gray-6)';
    }
  };

  // Get the action text (without username) for mobile-style layout
  const getActionText = (notification: Notification) => {
    const type = getNotificationType(notification);

    switch (type) {
      case 'new_follower':
        return 'started following you';
      case 'new_review':
        if (notification.song_name && notification.band_name) {
          return `recommended "${notification.song_name}" by ${notification.band_name}`;
        } else if (notification.song_name) {
          return `recommended "${notification.song_name}"`;
        }
        return 'recommended your music';
      case 'review_like':
        return 'liked your recommendation';
      case 'review_comment': {
        const songName = notification.review?.song_name || notification.song_name;
        if (songName) return `commented on "${songName}"`;
        return 'commented on your recommendation';
      }
      default:
        return 'interacted with you';
    }
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

  if (authLoading) {
    return (
      <Container>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container p={0} fluid className={styles.container}>
      <Header />

      <Flex className={styles.content}>
        {/* Sidebar - Show BandSidebar for bands, UserSidebar for fans */}
        {isBand ? (
          bandLoading ? (
            <Flex p="md" direction="column" className={styles.sidebar}>
              <Center py="xl">
                <Loader size="md" />
              </Center>
            </Flex>
          ) : band ? (
            <BandSidebar band={band} onBandSaved={setBand} />
          ) : (
            <Flex p="md" direction="column" className={styles.sidebar} />
          )
        ) : (
          <UserSidebar />
        )}

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" flex={1}>
          <Box maw={700}>
            <Group justify="space-between" align="center" mb="md" mt="md">
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
                {notificationsList.map((notification) => (
                  <Box
                    key={notification.id}
                    component={Link}
                    href={getNotificationLink(notification)}
                    className={`${styles.notificationCard} ${!notification.read ? styles.notificationCardUnread : ''}`}
                  >
                    <Group gap="md" wrap="nowrap" align="flex-start">
                      <Box pos="relative">
                        <ProfilePhoto
                          src={notification.actor.profile_image_url}
                          fallback={notification.actor.username}
                          size={40}
                        />
                        <Box
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            backgroundColor: getNotificationIconColor(getNotificationType(notification)),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getNotificationIcon(getNotificationType(notification))}
                        </Box>
                      </Box>

                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        {/* Line 1: @username · time */}
                        <Group gap="xs" wrap="nowrap">
                          <Text size="sm" fw={notification.read ? 500 : 700} c="blue.8">
                            @{notification.actor.username}
                          </Text>
                          <Text size="xs" c="dimmed">
                            · {formatTimeAgo(notification.created_at)}
                          </Text>
                        </Group>

                        {/* Line 2: Action text */}
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {getActionText(notification)}
                        </Text>

                        {/* Line 3: Comment preview (if applicable) */}
                        {getNotificationType(notification) === 'review_comment' &&
                          notification.comment?.body && (
                            <Text size="sm" c="dark" lineClamp={2} fs="italic">
                              "{notification.comment.body}"
                            </Text>
                          )}
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
        </Flex>
      </Flex>
    </Container>
  );
}
