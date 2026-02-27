'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconLogout, IconMail, IconMessage, IconMusic } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { Header } from '@/components/Header/Header';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band } from '@/lib/api';
import { StreamingPlatform, STREAMING_PLATFORMS } from '@/lib/streaming';
import styles from './page.module.css';

// Lazy load components
const LastFmConnection = lazy(() =>
  import('@/components/LastFmConnection/LastFmConnection').then((mod) => ({
    default: mod.LastFmConnection,
  }))
);

export default function SettingsPage() {
  const { user, logout, isLoading, isOnboardingComplete, isBand, isFan, isBlogger, refreshUser } = useAuth();
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [band, setBand] = useState<Band | null>(null);
  const [bandLoading, setBandLoading] = useState(false);
  const [streamingPlatformLoading, setStreamingPlatformLoading] = useState(false);
  const [anonymousCommentsLoading, setAnonymousCommentsLoading] = useState(false);

  // Auth redirects
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, router]);

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

  // Countdown timer for retry
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      notifications.show({
        title: 'Email sent',
        message: response.message || 'Confirmation email has been sent.',
        color: 'green',
      });
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send confirmation email';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = user?.can_resend_confirmation && retryAfter === 0;

  const handleStreamingPlatformChange = async (value: string | null) => {
    setStreamingPlatformLoading(true);
    try {
      // Convert empty string to null for "No preference"
      const platform = (value === '' || value === null) ? null : value as StreamingPlatform;
      await apiClient.updatePreferredStreamingPlatform(platform);
      await refreshUser();
      notifications.show({
        title: 'Preferences updated',
        message: platform
          ? `${STREAMING_PLATFORMS[platform].name} set as your preferred platform`
          : 'Streaming preference cleared',
        color: 'green',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update streaming preference';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setStreamingPlatformLoading(false);
    }
  };

  const handleAllowAnonymousCommentsChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setAnonymousCommentsLoading(true);
    try {
      await apiClient.updateAllowAnonymousComments(checked);
      await refreshUser();
      notifications.show({
        title: 'Settings updated',
        message: checked
          ? 'Anonymous comments are now allowed on your posts'
          : 'Anonymous comments are now disabled',
        color: 'green',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update setting';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setAnonymousCommentsLoading(false);
    }
  };

  // Streaming platform select options
  const streamingPlatformOptions = [
    { value: '', label: 'No preference' },
    ...Object.entries(STREAMING_PLATFORMS).map(([key, { name }]) => ({
      value: key,
      label: name,
    })),
  ];

  if (isLoading) {
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
        <Flex direction="column" px="md" pb="lg" flex={1} maw={700}>
          <Title order={2} my="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
            Settings
          </Title>

          <Stack gap="md">
            {/* Last.fm Connection - Only for fan accounts */}
            {isFan && (
              <Suspense
                fallback={
                  <Group>
                    <Loader size="sm" />
                    <Text size="sm">Loading Last.fm status...</Text>
                  </Group>
                }
              >
                <LastFmConnection />
              </Suspense>
            )}

            {/* Streaming Preferences Section */}
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                <Group gap="xs">
                  <IconMusic size={20} />
                  Streaming Preferences
                </Group>
              </Title>
              <Stack gap="sm">
                <Text size="sm" c="dimmed">
                  Choose your preferred streaming platform. When available, songs will open directly
                  in this app.
                </Text>
                <Select
                  label="Preferred Platform"
                  placeholder="Select a platform"
                  data={streamingPlatformOptions}
                  value={user?.preferred_streaming_platform ?? ''}
                  onChange={handleStreamingPlatformChange}
                  disabled={streamingPlatformLoading}
                  clearable={false}
                />
              </Stack>
            </Paper>

            {/* Blog Settings - Only for blogger accounts */}
            {isBlogger && (
              <Paper p="lg" radius="md" withBorder>
                <Title order={4} mb="md">
                  <Group gap="xs">
                    <IconMessage size={20} />
                    Blog Settings
                  </Group>
                </Title>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <div>
                      <Text fw={500}>Allow Anonymous Comments</Text>
                      <Text size="sm" c="dimmed">
                        Allow visitors without accounts to comment on your posts
                      </Text>
                    </div>
                    <Switch
                      checked={user?.allow_anonymous_comments ?? false}
                      onChange={handleAllowAnonymousCommentsChange}
                      disabled={anonymousCommentsLoading}
                    />
                  </Group>
                </Stack>
              </Paper>
            )}

            {/* Account Section */}
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Account
              </Title>
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Group gap="xs" mb={4}>
                      <Text fw={500}>Email</Text>
                      {user?.email_confirmed ? (
                        <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                          Confirmed
                        </Badge>
                      ) : (
                        <Badge color="orange" size="sm">
                          Unconfirmed
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {user?.email}
                    </Text>
                  </div>
                  {!user?.email_confirmed && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconMail size={14} />}
                      onClick={handleResendConfirmation}
                      loading={resendLoading}
                      disabled={!canResend}
                    >
                      {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend confirmation'}
                    </Button>
                  )}
                </Group>
              </Stack>
            </Paper>

            {/* Logout Section */}
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4}>Sign Out</Title>
                  <Text size="sm" c="dimmed">
                    Sign out of your account on this device
                  </Text>
                </div>
                <Button
                  leftSection={<IconLogout size={16} />}
                  variant="outline"
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Flex>
      </Flex>
    </Container>
  );
}
