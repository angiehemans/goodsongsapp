'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCrown,
  IconMessage,
  IconMicrophone2,
  IconUsers,
  IconArrowRight,
} from '@tabler/icons-react';
import {
  Card,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, DiscoverPagination } from '@/lib/api';

export default function AdminDashboardPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    bands: 0,
    reviews: 0,
    plans: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user || !isAdmin) return;
    setDataLoading(true);

    try {
      const [usersRes, bandsRes, reviewsRes, plansRes] = await Promise.all([
        apiClient.getAllUsers(1, 1).catch(() => ({ pagination: { total_count: 0 } })),
        apiClient.getAdminBands(1, 1).catch(() => ({ pagination: { total_count: 0 } })),
        apiClient.getAdminReviews(1, 1).catch(() => ({ pagination: { total_count: 0 } })),
        apiClient.getAdminPlans().catch(() => ({ plans: [] })),
      ]);

      setStats({
        users: (usersRes.pagination as DiscoverPagination)?.total_count ?? 0,
        bands: (bandsRes.pagination as DiscoverPagination)?.total_count ?? 0,
        reviews: (reviewsRes.pagination as DiscoverPagination)?.total_count ?? 0,
        plans: plansRes.plans?.length ?? 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }

    setDataLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin, fetchStats]);

  if (isLoading || dataLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: IconUsers,
      color: 'blue',
      href: '/admin/users',
    },
    {
      label: 'Total Bands',
      value: stats.bands,
      icon: IconMicrophone2,
      color: 'grape',
      href: '/admin/bands',
    },
    {
      label: 'Total Reviews',
      value: stats.reviews,
      icon: IconMessage,
      color: 'teal',
      href: '/admin/reviews',
    },
    {
      label: 'Plans',
      value: stats.plans,
      icon: IconCrown,
      color: 'orange',
      href: '/admin/plans',
    },
  ];

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Paper p="lg" radius="md" withBorder>
          <Title order={2}>Dashboard</Title>
          <Text size="sm" c="dimmed">
            Overview of your platform statistics
          </Text>
        </Paper>

        <Grid>
          {statCards.map((stat) => (
            <Grid.Col key={stat.label} span={{ base: 12, xs: 6, md: 3 }}>
              <UnstyledButton
                onClick={() => router.push(stat.href)}
                style={{ width: '100%' }}
              >
                <Card
                  p="lg"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                >
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        {stat.label}
                      </Text>
                      <Text size="xl" fw={700} mt="xs">
                        {stat.value.toLocaleString()}
                      </Text>
                    </div>
                    <stat.icon
                      size={32}
                      color={`var(--mantine-color-${stat.color}-6)`}
                    />
                  </Group>
                  <Group gap={4} mt="md">
                    <Text size="xs" c={`${stat.color}.6`}>
                      View all
                    </Text>
                    <IconArrowRight size={14} color={`var(--mantine-color-${stat.color}-6)`} />
                  </Group>
                </Card>
              </UnstyledButton>
            </Grid.Col>
          ))}
        </Grid>

        <Paper p="lg" radius="md" withBorder>
          <Title order={3} mb="md">Quick Actions</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <UnstyledButton
                onClick={() => router.push('/admin/users')}
                style={{ width: '100%' }}
              >
                <Paper p="md" radius="md" withBorder>
                  <Group>
                    <IconUsers size={24} color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>Manage Users</Text>
                  </Group>
                </Paper>
              </UnstyledButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <UnstyledButton
                onClick={() => router.push('/admin/bands')}
                style={{ width: '100%' }}
              >
                <Paper p="md" radius="md" withBorder>
                  <Group>
                    <IconMicrophone2 size={24} color="var(--mantine-color-grape-6)" />
                    <Text size="sm" fw={500}>Manage Bands</Text>
                  </Group>
                </Paper>
              </UnstyledButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <UnstyledButton
                onClick={() => router.push('/admin/reviews')}
                style={{ width: '100%' }}
              >
                <Paper p="md" radius="md" withBorder>
                  <Group>
                    <IconMessage size={24} color="var(--mantine-color-teal-6)" />
                    <Text size="sm" fw={500}>Manage Reviews</Text>
                  </Group>
                </Paper>
              </UnstyledButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <UnstyledButton
                onClick={() => router.push('/admin/plans')}
                style={{ width: '100%' }}
              >
                <Paper p="md" radius="md" withBorder>
                  <Group>
                    <IconCrown size={24} color="var(--mantine-color-orange-6)" />
                    <Text size="sm" fw={500}>Manage Plans</Text>
                  </Group>
                </Paper>
              </UnstyledButton>
            </Grid.Col>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
}
