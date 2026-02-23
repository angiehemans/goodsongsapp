'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IconSearch,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
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
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { AdminUserDrawer } from '@/components/AdminUserDrawer/AdminUserDrawer';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, DiscoverPagination, User } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from '../page.module.css';

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  // Search state
  const [usersSearch, setUsersSearch] = useState('');
  const [debouncedUsersSearch] = useDebouncedValue(usersSearch, 300);

  // Pagination state
  const [usersPagination, setUsersPagination] = useState<DiscoverPagination | null>(null);
  const [usersPage, setUsersPage] = useState(1);

  // Delete confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User drawer state
  const [userDrawerOpened, { open: openUserDrawer, close: closeUserDrawer }] = useDisclosure(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers(1);
    }
  }, [user, isAdmin, fetchUsers]);

  useEffect(() => {
    setUsersPage(1);
    fetchUsers(1, debouncedUsersSearch);
  }, [debouncedUsersSearch, fetchUsers]);

  const handleUsersPageChange = (page: number) => {
    setUsersPage(page);
    fetchUsers(page, debouncedUsersSearch);
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

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
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
        message: 'Failed to delete user. Please try again.',
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

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
  };

  const handleUserDeleteFromDrawer = (userId: number, displayName: string) => {
    closeUserDrawer();
    handleDeleteClick(userId, displayName);
  };

  const getRoleBadge = (u: User) => {
    const roleOrAccountType = u.role ?? u.account_type;
    if (roleOrAccountType === 'fan' || roleOrAccountType === 0) {
      return <Badge color="blue">Fan</Badge>;
    }
    if (roleOrAccountType === 'band' || roleOrAccountType === 1) {
      return <Badge color="grape">Band</Badge>;
    }
    if (roleOrAccountType === 'blogger' || roleOrAccountType === 'music_blogger' || roleOrAccountType === 3) {
      return <Badge color="teal">Blogger</Badge>;
    }
    if (roleOrAccountType === 'admin' || roleOrAccountType === 2) {
      return <Badge color="red">Admin</Badge>;
    }
    return <Badge color="gray">Unknown</Badge>;
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="md">
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Users</Title>
              <Text size="sm" c="dimmed">
                Manage user accounts
              </Text>
            </div>
            <Badge size="lg" variant="light">
              {usersPagination?.total_count ?? users.length} total
            </Badge>
          </Group>
        </Paper>

        <TextInput
          placeholder="Search by username or email..."
          leftSection={<IconSearch size={16} />}
          value={usersSearch}
          onChange={(e) => setUsersSearch(e.target.value)}
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
                        <Table.Td>{getRoleBadge(u)}</Table.Td>
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
                              onClick={() => handleDeleteClick(u.id, u.username || u.email)}
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
            Are you sure you want to delete user{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.name}
            </Text>
            ?
          </Text>
          <Text size="sm" c="red">
            This will permanently delete the user and all their reviews, bands, and follows.
          </Text>
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
    </Container>
  );
}
