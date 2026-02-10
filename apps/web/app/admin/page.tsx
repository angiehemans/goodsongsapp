'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconCopy,
  IconFingerprint,
  IconMessage,
  IconMicrophone2,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { AdminBandDrawer } from '@/components/AdminBandDrawer/AdminBandDrawer';
import { AdminUserDrawer } from '@/components/AdminUserDrawer/AdminUserDrawer';
import { Header } from '@/components/Header/Header';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, DiscoverPagination, Review, User } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './page.module.css';

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

  // Duplicate bands filter state
  const [findDuplicates, setFindDuplicates] = useState(false);
  const [duplicateGroupsCount, setDuplicateGroupsCount] = useState<number | null>(null);
  const [totalDuplicateBands, setTotalDuplicateBands] = useState<number | null>(null);

  // Duplicate MusicBrainz IDs filter state
  const [findDuplicateMbids, setFindDuplicateMbids] = useState(false);
  const [duplicateMbidCount, setDuplicateMbidCount] = useState<number | null>(null);
  const [totalDuplicateMbidBands, setTotalDuplicateMbidBands] = useState<number | null>(null);

  // Enrichment loading state
  const [enrichingBandId, setEnrichingBandId] = useState<number | null>(null);
  const [enrichingReviewId, setEnrichingReviewId] = useState<number | null>(null);

  // Search state
  const [usersSearch, setUsersSearch] = useState('');
  const [bandsSearch, setBandsSearch] = useState('');
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [debouncedUsersSearch] = useDebouncedValue(usersSearch, 300);
  const [debouncedBandsSearch] = useDebouncedValue(bandsSearch, 300);
  const [debouncedReviewsSearch] = useDebouncedValue(reviewsSearch, 300);

  // Pagination state
  const [usersPagination, setUsersPagination] = useState<DiscoverPagination | null>(null);
  const [bandsPagination, setBandsPagination] = useState<DiscoverPagination | null>(null);
  const [reviewsPagination, setReviewsPagination] = useState<DiscoverPagination | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [bandsPage, setBandsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  // Delete confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'user' | 'band' | 'review';
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User drawer state
  const [userDrawerOpened, { open: openUserDrawer, close: closeUserDrawer }] = useDisclosure(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Band drawer state
  const [bandDrawerOpened, { open: openBandDrawer, close: closeBandDrawer }] = useDisclosure(false);
  const [selectedBandId, setSelectedBandId] = useState<number | null>(null);

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

  const fetchUsers = useCallback(async (page: number, query?: string) => {
    if (!user || !isAdmin) return;
    setDataLoading(true);
    try {
      const response = await apiClient.getAllUsers(page, 20, query || undefined);
      setUsers(response.users || []);
      setUsersPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
    setDataLoading(false);
  }, [user, isAdmin]);

  const fetchBands = useCallback(async (
    page: number,
    options?: { duplicatesOnly?: boolean; duplicateMbids?: boolean; search?: string }
  ) => {
    if (!user || !isAdmin) return;
    setDataLoading(true);
    try {
      const response = await apiClient.getAdminBands(page, 20, {
        findDuplicates: options?.duplicatesOnly,
        duplicateMbids: options?.duplicateMbids,
        search: options?.search,
      });
      setBands(response.bands || []);
      setBandsPagination(response.pagination);
      setDuplicateGroupsCount(response.duplicate_groups_count ?? null);
      setTotalDuplicateBands(response.total_duplicate_bands ?? null);
      setDuplicateMbidCount(response.duplicate_mbid_count ?? null);
      setTotalDuplicateMbidBands(response.total_duplicate_bands ?? null);
    } catch (error) {
      console.error('Failed to fetch bands:', error);
      setBands([]);
    }
    setDataLoading(false);
  }, [user, isAdmin]);

  const fetchReviews = useCallback(async (page: number, query?: string) => {
    if (!user || !isAdmin) return;
    setDataLoading(true);
    try {
      const response = await apiClient.getAdminReviews(page, 20, query || undefined);
      setReviews(response.reviews || []);
      setReviewsPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    }
    setDataLoading(false);
  }, [user, isAdmin]);

  const fetchAllData = useCallback(async () => {
    if (!user || !isAdmin) return;

    setDataLoading(true);

    try {
      const [usersRes, bandsRes, reviewsRes] = await Promise.all([
        apiClient.getAllUsers(1).catch(() => ({ users: [], pagination: null })),
        apiClient.getAdminBands(1).catch(() => ({ bands: [], pagination: null })),
        apiClient.getAdminReviews(1).catch(() => ({ reviews: [], pagination: null })),
      ]);
      setUsers(usersRes.users || []);
      setUsersPagination(usersRes.pagination);
      setBands(bandsRes.bands || []);
      setBandsPagination(bandsRes.pagination);
      setReviews(reviewsRes.reviews || []);
      setReviewsPagination(reviewsRes.pagination);
      setUsersPage(1);
      setBandsPage(1);
      setReviewsPage(1);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }

    setDataLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin && isOnboardingComplete) {
      fetchAllData();
    }
  }, [user, isAdmin, isOnboardingComplete, fetchAllData]);

  const handleUsersPageChange = (page: number) => {
    setUsersPage(page);
    fetchUsers(page, debouncedUsersSearch);
  };

  const handleBandsPageChange = (page: number) => {
    setBandsPage(page);
    fetchBands(page, { duplicatesOnly: findDuplicates, duplicateMbids: findDuplicateMbids, search: debouncedBandsSearch });
  };

  // Refetch when search changes
  useEffect(() => {
    setUsersPage(1);
    fetchUsers(1, debouncedUsersSearch);
  }, [debouncedUsersSearch, fetchUsers]);

  useEffect(() => {
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: findDuplicates, duplicateMbids: findDuplicateMbids, search: debouncedBandsSearch });
  }, [debouncedBandsSearch, findDuplicates, findDuplicateMbids, fetchBands]);

  useEffect(() => {
    setReviewsPage(1);
    fetchReviews(1, debouncedReviewsSearch);
  }, [debouncedReviewsSearch, fetchReviews]);

  const handleFindDuplicatesToggle = (checked: boolean) => {
    setFindDuplicates(checked);
    if (checked) setFindDuplicateMbids(false); // Only one filter at a time
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: checked, duplicateMbids: false, search: debouncedBandsSearch });
  };

  const handleFindDuplicateMbidsToggle = (checked: boolean) => {
    setFindDuplicateMbids(checked);
    if (checked) setFindDuplicates(false); // Only one filter at a time
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: false, duplicateMbids: checked });
  };

  const handleReviewsPageChange = (page: number) => {
    setReviewsPage(page);
    fetchReviews(page, debouncedReviewsSearch);
  };

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

  const handleUserClick = (userId: number) => {
    setSelectedUserId(userId);
    openUserDrawer();
  };

  const handleBandClick = (bandId: number) => {
    setSelectedBandId(bandId);
    openBandDrawer();
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const handleBandUpdated = (updatedBand: Band) => {
    setBands((prev) =>
      prev.map((b) => (b.id === updatedBand.id ? { ...b, ...updatedBand } : b))
    );
  };

  const handleUserDeleteFromDrawer = (userId: number, displayName: string) => {
    closeUserDrawer();
    handleDeleteClick('user', userId, displayName);
  };

  const handleBandDeleteFromDrawer = (bandId: number, bandName: string) => {
    closeBandDrawer();
    handleDeleteClick('band', bandId, bandName);
  };

  const handleEnrichBand = async (bandId: number, bandName: string) => {
    setEnrichingBandId(bandId);
    try {
      const response = await apiClient.enrichBand(bandId);
      notifications.show({
        title: 'Enrichment Queued',
        message: response.message || `Enrichment job queued for "${bandName}"`,
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to enrich band:', error);
      notifications.show({
        title: 'Error',
        message: `Failed to enrich "${bandName}". Please try again.`,
        color: 'red',
      });
    } finally {
      setEnrichingBandId(null);
    }
  };

  const handleEnrichReview = async (reviewId: number, songName: string) => {
    setEnrichingReviewId(reviewId);
    try {
      const response = await apiClient.enrichReview(reviewId);
      const trackStatus = response.track_lookup?.status;
      let message = response.message;
      if (trackStatus === 'found') {
        message += ` Track found: "${response.track_lookup.title}"`;
      } else if (trackStatus === 'not_found') {
        message += ' Track not found in MusicBrainz.';
      }
      notifications.show({
        title: 'Enrichment Queued',
        message,
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to enrich review:', error);
      notifications.show({
        title: 'Error',
        message: `Failed to enrich review "${songName}". Please try again.`,
        color: 'red',
      });
    } finally {
      setEnrichingReviewId(null);
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.container}>
        <Header showBackButton />
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Box>
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
    <Box className={styles.container}>
      <Header showBackButton />
      <Container size="lg" className={styles.content}>
        <Stack gap="xl">
          {/* Page Header */}
          <Paper p="lg" radius="md">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
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
          <div className={styles.statsGrid}>
            <Card p="lg" radius="md">
              <Group>
                <IconUsers size={32} color="var(--mantine-color-blue-6)" />
                <div>
                  <Text size="xl" fw={700}>
                    {usersPagination?.total_count ?? users.length}
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
                    {bandsPagination?.total_count ?? bands.length}
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
                    {reviewsPagination?.total_count ?? reviews.length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Total Reviews
                  </Text>
                </div>
              </Group>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab} className={styles.tabs}>
          <Tabs.List>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              Users ({usersPagination?.total_count ?? users.length})
            </Tabs.Tab>
            <Tabs.Tab value="bands" leftSection={<IconMicrophone2 size={16} />}>
              Bands ({bandsPagination?.total_count ?? bands.length})
            </Tabs.Tab>
            <Tabs.Tab value="reviews" leftSection={<IconMessage size={16} />}>
              Reviews ({reviewsPagination?.total_count ?? reviews.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Users Tab */}
          <Tabs.Panel value="users" pt="md">
            <TextInput
              placeholder="Search by username or email..."
              leftSection={<IconSearch size={16} />}
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              mb="md"
            />
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
                      {debouncedUsersSearch ? 'No users found matching your search.' : 'No users found.'}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Stack gap="md">
                <Paper radius="md" withBorder>
                  <div className={styles.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>User</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Email</Table.Th>
                          <Table.Th>Account Type</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Reviews</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Onboarding</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {users.map((u) => (
                          <Table.Tr key={u.id}>
                            <Table.Td>
                              <UnstyledButton onClick={() => handleUserClick(u.id)}>
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
                              </UnstyledButton>
                            </Table.Td>
                            <Table.Td className={styles.hideOnMobile}>
                              <Text size="sm">{u.email}</Text>
                            </Table.Td>
                            <Table.Td>{getAccountTypeBadge(u.account_type)}</Table.Td>
                            <Table.Td className={styles.hideOnMobile}>
                              <Badge variant="light" color="grape">
                                {u.reviews_count || 0}
                              </Badge>
                            </Table.Td>
                            <Table.Td className={styles.hideOnMobile}>
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
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                </Paper>
                {usersPagination && usersPagination.total_pages > 1 && (
                  <Center>
                    <Pagination
                      value={usersPage}
                      onChange={handleUsersPageChange}
                      total={usersPagination.total_pages}
                      color="grape"
                    />
                  </Center>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          {/* Bands Tab */}
          <Tabs.Panel value="bands" pt="md">
            {/* Duplicate Finder Toggles */}
            <Paper p="md" radius="md" mb="md" withBorder>
              <Stack gap="md">
                {/* Duplicate Names Toggle */}
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Group gap="sm">
                    <IconCopy size={20} color="var(--mantine-color-orange-6)" />
                    <div>
                      <Text size="sm" fw={500}>Find Duplicate Names</Text>
                      <Text size="xs" c="dimmed">
                        Show bands with similar names that may be duplicates
                      </Text>
                    </div>
                  </Group>
                  <Group gap="md">
                    {findDuplicates && duplicateGroupsCount !== null && (
                      <Badge color="orange" variant="light">
                        {duplicateGroupsCount} groups ({totalDuplicateBands} bands)
                      </Badge>
                    )}
                    <Switch
                      checked={findDuplicates}
                      onChange={(e) => handleFindDuplicatesToggle(e.currentTarget.checked)}
                      label={findDuplicates ? 'On' : 'Off'}
                      color="orange"
                    />
                  </Group>
                </Group>

                {/* Duplicate MusicBrainz IDs Toggle */}
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Group gap="sm">
                    <IconFingerprint size={20} color="var(--mantine-color-violet-6)" />
                    <div>
                      <Text size="sm" fw={500}>Find Duplicate MusicBrainz IDs</Text>
                      <Text size="xs" c="dimmed">
                        Show bands sharing the same MusicBrainz ID
                      </Text>
                    </div>
                  </Group>
                  <Group gap="md">
                    {findDuplicateMbids && duplicateMbidCount !== null && (
                      <Badge color="violet" variant="light">
                        {duplicateMbidCount} MBIDs ({totalDuplicateMbidBands} bands)
                      </Badge>
                    )}
                    <Switch
                      checked={findDuplicateMbids}
                      onChange={(e) => handleFindDuplicateMbidsToggle(e.currentTarget.checked)}
                      label={findDuplicateMbids ? 'On' : 'Off'}
                      color="violet"
                    />
                  </Group>
                </Group>
              </Stack>
            </Paper>

            <TextInput
              placeholder="Search by band name..."
              leftSection={<IconSearch size={16} />}
              value={bandsSearch}
              onChange={(e) => setBandsSearch(e.target.value)}
              mb="md"
            />

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
                      {debouncedBandsSearch
                        ? 'No bands found matching your search.'
                        : findDuplicates
                          ? 'No duplicate bands found.'
                          : findDuplicateMbids
                            ? 'No bands with duplicate MusicBrainz IDs found.'
                            : 'No bands found.'}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Stack gap="md">
                <Paper radius="md" withBorder>
                  <div className={styles.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Band</Table.Th>
                          {findDuplicates && <Table.Th className={styles.hideOnMobile}>Normalized</Table.Th>}
                          {findDuplicates && <Table.Th>Duplicates</Table.Th>}
                          {findDuplicateMbids && <Table.Th className={styles.hideOnMobile}>MusicBrainz ID</Table.Th>}
                          {findDuplicateMbids && <Table.Th>Duplicates</Table.Th>}
                          <Table.Th className={styles.hideOnMobile}>Location</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Owner</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Reviews</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {bands.map((band) => (
                          <Table.Tr key={band.id} style={{ opacity: band.disabled ? 0.6 : 1 }}>
                            <Table.Td>
                              <UnstyledButton onClick={() => handleBandClick(band.id)}>
                                <Group gap="sm">
                                  <Avatar
                                    size="sm"
                                    src={fixImageUrl(band.profile_picture_url) || band.spotify_image_url}
                                    color="grape"
                                  >
                                    {band.name?.charAt(0).toUpperCase() || 'B'}
                                  </Avatar>
                                  <Text
                                    size="sm"
                                    c={band.disabled ? 'dimmed' : 'grape.6'}
                                    style={{ textDecoration: 'none' }}
                                  >
                                    {band.name}
                                  </Text>
                                </Group>
                              </UnstyledButton>
                            </Table.Td>
                            {findDuplicates && (
                              <Table.Td className={styles.hideOnMobile}>
                                <Text size="xs" c="dimmed" ff="monospace">
                                  {(band as any).normalized_name || '-'}
                                </Text>
                              </Table.Td>
                            )}
                            {findDuplicates && (
                              <Table.Td>
                                {(band as any).duplicate_group_size > 1 ? (
                                  <Badge color="orange" variant="light">
                                    {(band as any).duplicate_group_size} matches
                                  </Badge>
                                ) : (
                                  <Text size="xs" c="dimmed">-</Text>
                                )}
                              </Table.Td>
                            )}
                            {findDuplicateMbids && (
                              <Table.Td className={styles.hideOnMobile}>
                                <Text size="xs" c="dimmed" ff="monospace" lineClamp={1} maw={120}>
                                  {band.musicbrainz_id || '-'}
                                </Text>
                              </Table.Td>
                            )}
                            {findDuplicateMbids && (
                              <Table.Td>
                                {(band as any).duplicate_mbid_count > 1 ? (
                                  <Badge color="violet" variant="light">
                                    {(band as any).duplicate_mbid_count} matches
                                  </Badge>
                                ) : (
                                  <Text size="xs" c="dimmed">-</Text>
                                )}
                              </Table.Td>
                            )}
                            <Table.Td className={styles.hideOnMobile}>
                              <Text size="sm" c="dimmed">
                                {[band.city, band.region].filter(Boolean).join(', ') || band.location || 'Not specified'}
                              </Text>
                            </Table.Td>
                            <Table.Td className={styles.hideOnMobile}>
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
                            <Table.Td className={styles.hideOnMobile}>
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
                              <Group gap="xs" wrap="nowrap">
                                <Button
                                  variant="light"
                                  color="grape"
                                  size="xs"
                                  leftSection={<IconSparkles size={14} />}
                                  onClick={() => handleEnrichBand(band.id, band.name)}
                                  loading={enrichingBandId === band.id}
                                  disabled={enrichingBandId !== null && enrichingBandId !== band.id}
                                >
                                  Enrich
                                </Button>
                                <Button
                                  variant="light"
                                  color="red"
                                  size="xs"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleDeleteClick('band', band.id, band.name)}
                                >
                                  Delete
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                </Paper>
                {bandsPagination && bandsPagination.total_pages > 1 && (
                  <Center>
                    <Pagination
                      value={bandsPage}
                      onChange={handleBandsPageChange}
                      total={bandsPagination.total_pages}
                      color="grape"
                    />
                  </Center>
                )}
              </Stack>
            )}
          </Tabs.Panel>

          {/* Reviews Tab */}
          <Tabs.Panel value="reviews" pt="md">
            <TextInput
              placeholder="Search by song name or band name..."
              leftSection={<IconSearch size={16} />}
              value={reviewsSearch}
              onChange={(e) => setReviewsSearch(e.target.value)}
              mb="md"
            />
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
                      {debouncedReviewsSearch ? 'No reviews found matching your search.' : 'No reviews found.'}
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Stack gap="md">
                <Paper radius="md" withBorder>
                  <div className={styles.tableWrapper}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Song</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Band</Table.Th>
                          <Table.Th>Author</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Review</Table.Th>
                          <Table.Th className={styles.hideOnMobile}>Date</Table.Th>
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
                            <Table.Td className={styles.hideOnMobile}>
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
                            <Table.Td className={styles.hideOnMobile}>
                              <Text size="sm" lineClamp={2} maw={250}>
                                {review.review_text}
                              </Text>
                            </Table.Td>
                            <Table.Td className={styles.hideOnMobile}>
                              <Text size="sm" c="dimmed">
                                {new Date(review.created_at).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <Button
                                  variant="light"
                                  color="grape"
                                  size="xs"
                                  leftSection={<IconSparkles size={14} />}
                                  onClick={() => handleEnrichReview(review.id, review.song_name)}
                                  loading={enrichingReviewId === review.id}
                                  disabled={enrichingReviewId !== null && enrichingReviewId !== review.id}
                                >
                                  Enrich
                                </Button>
                                <Button
                                  variant="light"
                                  color="red"
                                  size="xs"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleDeleteClick('review', review.id, `"${review.song_name}"`)}
                                >
                                  Delete
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                </Paper>
                {reviewsPagination && reviewsPagination.total_pages > 1 && (
                  <Center>
                    <Pagination
                      value={reviewsPage}
                      onChange={handleReviewsPageChange}
                      total={reviewsPagination.total_pages}
                      color="grape"
                    />
                  </Center>
                )}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>

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

      {/* User Detail Drawer */}
      <AdminUserDrawer
        userId={selectedUserId}
        opened={userDrawerOpened}
        onClose={closeUserDrawer}
        onUserUpdated={handleUserUpdated}
        onDeleteClick={handleUserDeleteFromDrawer}
        currentUserId={user?.id}
      />

      {/* Band Detail Drawer */}
      <AdminBandDrawer
        bandId={selectedBandId}
        opened={bandDrawerOpened}
        onClose={closeBandDrawer}
        onBandUpdated={handleBandUpdated}
        onDeleteClick={handleBandDeleteFromDrawer}
      />
    </Box>
  );
}
