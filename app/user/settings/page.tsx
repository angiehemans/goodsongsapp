'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Paper,
  Stack,
  Group,
  Skeleton,
  Button,
} from '@mantine/core';
import { IconArrowLeft, IconSettings } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { lazy } from 'react';

// Lazy load components
const SpotifyConnection = lazy(() => 
  import('@/components/SpotifyConnection/SpotifyConnection').then(mod => ({ 
    default: mod.SpotifyConnection 
  }))
);

const ProfileSettings = lazy(() => 
  import('@/components/ProfileSettings/ProfileSettings').then(mod => ({ 
    default: mod.ProfileSettings 
  }))
);

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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
    <Container size="lg" py="xl">
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
              href="/user/dashboard"
              leftSection={<IconArrowLeft size={16} />}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </Group>
        </Paper>

        {/* Profile Settings */}
        <Suspense fallback={
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
        }>
          <ProfileSettings />
        </Suspense>

        {/* Spotify Connection */}
        <Suspense fallback={
          <Paper p="md" radius="md">
            <Group>
              <Skeleton height={20} width={20} radius="xl" />
              <Skeleton height={20} width={200} />
            </Group>
          </Paper>
        }>
          <SpotifyConnection />
        </Suspense>
      </Stack>
    </Container>
  );
}