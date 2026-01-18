'use client';

import { lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { IconLogout } from '@tabler/icons-react';
import { Button, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';

// Lazy load components
const LastFmConnection = lazy(() =>
  import('@/components/LastFmConnection/LastFmConnection').then((mod) => ({
    default: mod.LastFmConnection,
  }))
);

export default function SettingsPage() {
  const { user, logout, isBand, isFan } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

  return (
    <>
      <Title order={2} my="sm" c="blue.8" fw={500}>
        Settings
      </Title>

      <Stack gap="md">
        {/* Last.fm Connection - Only for fan accounts */}
        {isFan && (
          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Last.fm Connection
            </Title>
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
                  {user?.email}
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
    </>
  );
}
