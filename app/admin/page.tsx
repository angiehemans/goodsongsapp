'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconMicrophone2,
  IconUsers,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, User } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user, isLoading, isOnboardingComplete, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && !isAdmin) {
      router.push('/user/dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isAdmin, router]);

  const fetchData = useCallback(async () => {
    if (!user || !isAdmin) return;

    setDataLoading(true);

    try {
      // Fetch bands (uses public /bands endpoint)
      const bandsData = await apiClient.getAllBands();
      setBands(bandsData);
    } catch (error) {
      console.error('Failed to fetch bands:', error);
    }

    try {
      // Fetch users (requires /admin/users endpoint on backend)
      const usersData = await apiClient.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users (endpoint may not exist):', error);
      setUsers([]);
    }

    setDataLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin && isOnboardingComplete) {
      fetchData();
    }
  }, [user, isAdmin, isOnboardingComplete, fetchData]);

  const handleToggleDisabled = async (userId: number, username: string | undefined) => {
    setTogglingUserId(userId);
    try {
      const response = await apiClient.toggleUserDisabled(userId);
      // Handle both { user: {...} } and direct user object responses
      const updatedUser = (response as any).user || response;
      const isDisabled = updatedUser.disabled === true;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, disabled: isDisabled } : u))
      );
      notifications.show({
        title: isDisabled ? 'User Disabled' : 'User Enabled',
        message: `${username || 'User'} has been ${isDisabled ? 'disabled' : 'enabled'} successfully.`,
        color: isDisabled ? 'red' : 'green',
      });
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update user status. Please try again.',
        color: 'red',
      });
    } finally {
      setTogglingUserId(null);
    }
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

  if (!user || !isAdmin) {
    return null;
  }

  const getAccountTypeBadge = (accountType: string | number | undefined) => {
    if (accountType === 'fan' || accountType === 0) {
      return <Badge color="blue">Fan</Badge>;
    }
    if (accountType === 'band' || accountType === 1) {
      return <Badge color="grape">Band</Badge>;
    }
    if (accountType === 'admin' || accountType === 2) {
      return <Badge color="red">Admin</Badge>;
    }
    return <Badge color="gray">Unknown</Badge>;
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Admin Dashboard</Title>
              <Text size="sm" c="dimmed">
                Manage users and bands
              </Text>
            </div>
            <Badge color="red" size="lg">
              Admin
            </Badge>
          </Group>
        </Paper>

        {/* Stats */}
        <Group grow>
          <Card p="lg" radius="md">
            <Group>
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="xl" fw={700}>
                  {users.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Users
                </Text>
              </div>
            </Group>
          </Card>
          <Card p="lg" radius="md">
            <Group>
              <IconMicrophone2 size={32} color="var(--mantine-color-grape-6)" />
              <div>
                <Text size="xl" fw={700}>
                  {bands.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Bands
                </Text>
              </div>
            </Group>
          </Card>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Users ({users.length})
            </Tabs.Tab>
            <Tabs.Tab value="bands" leftSection={<IconMicrophone2 size={16} />}>
              Bands ({bands.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="users" pt="md">
            {dataLoading ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : users.length === 0 ? (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconUsers size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed" ta="center">
                      No users found. The /admin/users endpoint may need to be implemented on the backend.
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Paper radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Account Type</Table.Th>
                      <Table.Th>Reviews</Table.Th>
                      <Table.Th>Onboarding</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((u) => (
                      <Table.Tr key={u.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar
                              size="sm"
                              src={fixImageUrl(u.profile_image_url)}
                              color="grape"
                            >
                              {u.username?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </Avatar>
                            {u.username ? (
                              <Text
                                component={Link}
                                href={`/users/${u.username}`}
                                size="sm"
                                c="grape.6"
                                style={{ textDecoration: 'none' }}
                              >
                                {u.username}
                              </Text>
                            ) : (
                              <Text size="sm" c="dimmed">
                                No username
                              </Text>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{u.email}</Text>
                        </Table.Td>
                        <Table.Td>{getAccountTypeBadge(u.account_type)}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="grape">
                            {u.reviews_count || 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {u.onboarding_completed ? (
                            <Badge color="green" variant="light">
                              Complete
                            </Badge>
                          ) : (
                            <Badge color="yellow" variant="light">
                              Incomplete
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {u.admin ? (
                            <Badge color="blue" variant="light">
                              Admin
                            </Badge>
                          ) : (
                            <Switch
                              checked={!u.disabled}
                              onChange={() => handleToggleDisabled(u.id, u.username)}
                              disabled={togglingUserId === u.id}
                              label={u.disabled ? 'Disabled' : 'Active'}
                              color="green"
                              size="sm"
                            />
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Button
                            component={Link}
                            href={`/admin/users/${u.id}`}
                            variant="light"
                            size="xs"
                          >
                            View Reviews
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="bands" pt="md">
            {dataLoading ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : bands.length === 0 ? (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconMicrophone2 size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed" ta="center">
                      No bands found.
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Paper radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Band</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Owner</Table.Th>
                      <Table.Th>Reviews</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {bands.map((band) => (
                      <Table.Tr key={band.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar
                              size="sm"
                              src={fixImageUrl(band.profile_picture_url)}
                              color="grape"
                            >
                              {band.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Text
                              component={Link}
                              href={`/bands/${band.slug}`}
                              size="sm"
                              c="grape.6"
                              style={{ textDecoration: 'none' }}
                            >
                              {band.name}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {band.location || 'Not specified'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {band.owner?.username ? (
                            <Text
                              component={Link}
                              href={`/users/${band.owner.username}`}
                              size="sm"
                              c="grape.6"
                              style={{ textDecoration: 'none' }}
                            >
                              @{band.owner.username}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">
                              Unknown
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="grape">
                            {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
