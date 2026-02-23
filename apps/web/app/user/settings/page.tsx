'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconLogout, IconMail } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { Header } from '@/components/Header/Header';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band } from '@/lib/api';
import styles from './page.module.css';

// Lazy load components
const LastFmConnection = lazy(() =>
  import('@/components/LastFmConnection/LastFmConnection').then((mod) => ({
    default: mod.LastFmConnection,
  }))
);

export default function SettingsPage() {
  const { user, logout, isLoading, isOnboardingComplete, isBand, isFan, refreshUser } = useAuth();
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [band, setBand] = useState<Band | null>(null);
  const [bandLoading, setBandLoading] = useState(false);

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
