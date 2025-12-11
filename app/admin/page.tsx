'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconMessage,
  IconMicrophone2,
  IconTrash,
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
  Modal,
  Paper,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, Review, User } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { user, isLoading, isOnboardingComplete, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('users');
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [togglingBandId, setTogglingBandId] = useState<number | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'user' | 'band' | 'review';
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const [usersData, bandsData, reviewsData] = await Promise.all([
        apiClient.getAllUsers().catch(() => []),
        apiClient.getAdminBands().catch(() => []),
        apiClient.getAdminReviews().catch(() => []),
      ]);
      setUsers(usersData);
      setBands(bandsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }

    setDataLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin && isOnboardingComplete) {
      fetchData();
    }
  }, [user, isAdmin, isOnboardingComplete, fetchData]);

  const handleToggleUserDisabled = async (userId: number, username: string | undefined) => {
    setTogglingUserId(userId);
    try {
      const response = await apiClient.toggleUserDisabled(userId);
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

  const handleToggleBandDisabled = async (bandId: number, bandName: string) => {
    setTogglingBandId(bandId);
    try {
      const response = await apiClient.toggleBandDisabled(bandId);
      const updatedBand = (response as any).band || response;
      const isDisabled = updatedBand.disabled === true;

      setBands((prev) =>
        prev.map((b) => (b.id === bandId ? { ...b, disabled: isDisabled } : b))
      );
      notifications.show({
        title: isDisabled ? 'Band Disabled' : 'Band Enabled',
        message: `${bandName} has been ${isDisabled ? 'disabled' : 'enabled'} successfully.`,
        color: isDisabled ? 'red' : 'green',
      });
    } catch (error) {
      console.error('Failed to toggle band status:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update band status. Please try again.',
        color: 'red',
      });
    } finally {
      setTogglingBandId(null);
    }
  };

  const handleDeleteClick = (type: 'user' | 'band' | 'review', id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'user') {
        await apiClient.deleteUser(deleteTarget.id);
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'band') {
        await apiClient.deleteBand(deleteTarget.id);
        setBands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'review') {
        await apiClient.deleteReview(deleteTarget.id);
        setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      }

      notifications.show({
        title: 'Deleted',
        message: `${deleteTarget.name} has been deleted successfully.`,
        color: 'green',
      });
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete:', error);
      notifications.show({
        title: 'Error',
        message: `Failed to delete ${deleteTarget.type}. Please try again.`,
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
                Manage users, bands, and reviews
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
          <Card p="lg" radius="md">
            <Group>
              <IconMessage size={32} color="var(--mantine-color-teal-6)" />
              <div>
                <Text size="xl" fw={700}>
                  {reviews.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Reviews
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
            <Tabs.Tab value="reviews" leftSection={<IconMessage size={16} />}>
              Reviews ({reviews.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Users Tab */}
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
                      No users found.
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
                              onChange={() => handleToggleUserDisabled(u.id, u.username)}
                              disabled={togglingUserId === u.id}
                              label={u.disabled ? 'Disabled' : 'Active'}
                              color="green"
                              size="sm"
                            />
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              component={Link}
                              href={`/admin/users/${u.id}`}
                              variant="light"
                              size="xs"
                            >
                              View
                            </Button>
                            {!u.admin && u.id !== user.id && (
                              <Button
                                variant="light"
                                color="red"
                                size="xs"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDeleteClick('user', u.id, u.username || u.email)}
                              >
                                Delete
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Bands Tab */}
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
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {bands.map((band) => (
                      <Table.Tr key={band.id} style={{ opacity: band.disabled ? 0.6 : 1 }}>
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar
                              size="sm"
                              src={fixImageUrl(band.profile_picture_url) || band.spotify_image_url}
                              color="grape"
                            >
                              {band.name?.charAt(0).toUpperCase() || 'B'}
                            </Avatar>
                            {band.disabled ? (
                              <Text size="sm" c="dimmed">
                                {band.name}
                              </Text>
                            ) : (
                              <Text
                                component={Link}
                                href={`/bands/${band.slug}`}
                                size="sm"
                                c="grape.6"
                                style={{ textDecoration: 'none' }}
                              >
                                {band.name}
                              </Text>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {[band.city, band.region].filter(Boolean).join(', ') || band.location || 'Not specified'}
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
                            {band.reviews_count || 0} review{band.reviews_count !== 1 ? 's' : ''}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={!band.disabled}
                            onChange={() => handleToggleBandDisabled(band.id, band.name)}
                            disabled={togglingBandId === band.id}
                            label={band.disabled ? 'Disabled' : 'Active'}
                            color="green"
                            size="sm"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDeleteClick('band', band.id, band.name)}
                          >
                            Delete
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>

          {/* Reviews Tab */}
          <Tabs.Panel value="reviews" pt="md">
            {dataLoading ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : reviews.length === 0 ? (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconMessage size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed" ta="center">
                      No reviews found.
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Paper radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Song</Table.Th>
                      <Table.Th>Band</Table.Th>
                      <Table.Th>Author</Table.Th>
                      <Table.Th>Review</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {reviews.map((review) => (
                      <Table.Tr key={review.id}>
                        <Table.Td>
                          <Group gap="sm">
                            {review.artwork_url && (
                              <Avatar size="sm" src={review.artwork_url} radius="sm" />
                            )}
                            <Text size="sm" lineClamp={1} maw={150}>
                              {review.song_name}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {review.band ? (
                            <Text
                              component={Link}
                              href={`/bands/${review.band.slug}`}
                              size="sm"
                              c="grape.6"
                              style={{ textDecoration: 'none' }}
                            >
                              {review.band.name}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">
                              {review.band_name}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {review.author?.username ? (
                            <Text
                              component={Link}
                              href={`/users/${review.author.username}`}
                              size="sm"
                              c="grape.6"
                              style={{ textDecoration: 'none' }}
                            >
                              @{review.author.username}
                            </Text>
                          ) : (
                            <Text size="sm" c="dimmed">
                              Unknown
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={2} maw={250}>
                            {review.review_text}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(review.created_at).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDeleteClick('review', review.id, `"${review.song_name}"`)}
                          >
                            Delete
                          </Button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirm Delete"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete {deleteTarget?.type}{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.name}
            </Text>
            ?
          </Text>
          {deleteTarget?.type === 'user' && (
            <Text size="sm" c="red">
              This will permanently delete the user and all their reviews, bands, and follows.
            </Text>
          )}
          {deleteTarget?.type === 'band' && (
            <Text size="sm" c="red">
              This will permanently delete the band and all its reviews.
            </Text>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleConfirmDelete}
              loading={isDeleting}
              leftSection={<IconTrash size={16} />}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
