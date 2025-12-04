'use client';

import { lazy, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconLogout } from '@tabler/icons-react';
import {
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
import { Header } from '@/components/Header/Header';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

// Lazy load components
const SpotifyConnection = lazy(() =>
  import('@/components/SpotifyConnection/SpotifyConnection').then((mod) => ({
    default: mod.SpotifyConnection,
  }))
);

export default function SettingsPage() {
  const { user, isLoading, logout, isOnboardingComplete, isBand, isFan } = useAuth();
  const router = useRouter();

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

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

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
      <Header showBackArrow />

      <Flex className={styles.content}>
        {/* User Sidebar */}
        <UserSidebar badgeText={isBand ? 'Band Account' : 'Fan Account'} />

        {/* Main Content */}
        <Flex direction="column" flex={1} px="md" pb="lg">
          <Title order={2} my="sm" c="blue.8" fw={500}>
            Settings
          </Title>

          <Stack gap="md">
            {/* Spotify Connection - Only for fan accounts */}
            {isFan && (
              <Paper p="lg" radius="md" withBorder>
                <Title order={4} mb="md">
                  Spotify Connection
                </Title>
                <Suspense
                  fallback={
                    <Group>
                      <Loader size="sm" />
                      <Text size="sm">Loading Spotify status...</Text>
                    </Group>
                  }
                >
                  <SpotifyConnection />
                </Suspense>
              </Paper>
            )}

            {/* Account Section */}
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Account
              </Title>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>Email</Text>
                    <Text size="sm" c="dimmed">
                      {user.email}
                    </Text>
                  </div>
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
