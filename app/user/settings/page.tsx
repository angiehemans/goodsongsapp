'use client';

import { lazy, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconLogout, IconSettings } from '@tabler/icons-react';
import { Button, Container, Divider, Group, Paper, Skeleton, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';

// Lazy load components
const SpotifyConnection = lazy(() =>
  import('@/components/SpotifyConnection/SpotifyConnection').then((mod) => ({
    default: mod.SpotifyConnection,
  }))
);

const ProfileSettings = lazy(() =>
  import('@/components/ProfileSettings/ProfileSettings').then((mod) => ({
    default: mod.ProfileSettings,
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

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

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
        <Stack>
          <Skeleton height={40} />
          <Skeleton height={200} />
          <Skeleton height={100} />
        </Stack>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container py="xl" size="sm">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <Group>
              <IconSettings size={32} color="var(--mantine-color-grape-6)" />
              <Title order={1}>Settings</Title>
            </Group>
            <Button
              component={Link}
              href={dashboardUrl}
              leftSection={<IconArrowLeft size={16} />}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </Group>
        </Paper>

        {/* Profile Settings */}
        <Suspense
          fallback={
            <Paper p="lg" radius="md">
              <Stack>
                <Group>
                  <Skeleton height={20} width={120} />
                </Group>
                <Group>
                  <Skeleton height={80} width={80} radius="xl" />
                  <Stack flex={1}>
                    <Skeleton height={20} width="60%" />
                    <Skeleton height={20} width="40%" />
                  </Stack>
                </Group>
                <Skeleton height={80} />
                <Group justify="flex-end">
                  <Skeleton height={36} width={80} />
                  <Skeleton height={36} width={120} />
                </Group>
              </Stack>
            </Paper>
          }
        >
          <ProfileSettings />
        </Suspense>

        {/* Spotify Connection - Only for fan accounts */}
        {isFan && (
          <Suspense
            fallback={
              <Paper p="md" radius="md">
                <Group>
                  <Skeleton height={20} width={20} radius="xl" />
                  <Skeleton height={20} width={200} />
                </Group>
              </Paper>
            }
          >
            <SpotifyConnection />
          </Suspense>
        )}

        {/* Logout Section */}
        <Divider my="md" />
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Sign Out</Title>
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
    </Container>
  );
}
