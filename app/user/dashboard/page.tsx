'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Avatar,
  Card,
  Grid,
} from '@mantine/core';
import { IconMusic, IconPlaylist, IconUsers, IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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
        <Text>Loading...</Text>
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
        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between">
            <Group>
              <Avatar 
                size="lg" 
                color="grape.6"
                component={Link}
                href={`/users/${user.username}`}
                style={{ cursor: 'pointer' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={2}>Welcome back, {user.username}!</Title>
                <Text size="sm" c="dimmed">{user.email}</Text>
                <Text 
                  size="xs" 
                  c="grape.6" 
                  component={Link} 
                  href={`/users/${user.username}`}
                  style={{ textDecoration: 'none' }}
                >
                  View your profile →
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<IconLogout size={16} />}
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Paper>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="lg" radius="md">
              <Group>
                <IconMusic size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Songs Discovered</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="lg" radius="md">
              <Group>
                <IconPlaylist size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Playlists</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card withBorder p="lg" radius="md">
              <Group>
                <IconUsers size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Following</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Quick Actions */}
        <Paper withBorder p="lg" radius="md">
          <Title order={3} mb="md">Quick Actions</Title>
          <Group>
            <Button component={Link} href="/user/create-review" variant="filled">
              Create Review
            </Button>
            <Button variant="outline">Connect Spotify</Button>
            <Button variant="outline">Discover Music</Button>
            <Button variant="outline">Create Playlist</Button>
          </Group>
        </Paper>

        {/* Recent Activity */}
        <Paper withBorder p="lg" radius="md">
          <Title order={3} mb="md">Recent Activity</Title>
          <Text c="dimmed">No recent activity yet. Start discovering music!</Text>
        </Paper>
      </Stack>
    </Container>
  );
}
