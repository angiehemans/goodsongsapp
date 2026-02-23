'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconCopy,
  IconFingerprint,
  IconMicrophone2,
  IconSearch,
  IconSparkles,
  IconTrash,
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
import { AdminBandDrawer } from '@/components/AdminBandDrawer/AdminBandDrawer';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, DiscoverPagination } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from '../page.module.css';

export default function AdminBandsPage() {
  const { user, isAdmin } = useAuth();
  const [bands, setBands] = useState<Band[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
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

  // Search state
  const [bandsSearch, setBandsSearch] = useState('');
  const [debouncedBandsSearch] = useDebouncedValue(bandsSearch, 300);

  // Pagination state
  const [bandsPagination, setBandsPagination] = useState<DiscoverPagination | null>(null);
  const [bandsPage, setBandsPage] = useState(1);

  // Delete confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Band drawer state
  const [bandDrawerOpened, { open: openBandDrawer, close: closeBandDrawer }] = useDisclosure(false);
  const [selectedBandId, setSelectedBandId] = useState<number | null>(null);

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

  useEffect(() => {
    if (user && isAdmin) {
      fetchBands(1);
    }
  }, [user, isAdmin, fetchBands]);

  useEffect(() => {
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: findDuplicates, duplicateMbids: findDuplicateMbids, search: debouncedBandsSearch });
  }, [debouncedBandsSearch, findDuplicates, findDuplicateMbids, fetchBands]);

  const handleBandsPageChange = (page: number) => {
    setBandsPage(page);
    fetchBands(page, { duplicatesOnly: findDuplicates, duplicateMbids: findDuplicateMbids, search: debouncedBandsSearch });
  };

  const handleFindDuplicatesToggle = (checked: boolean) => {
    setFindDuplicates(checked);
    if (checked) setFindDuplicateMbids(false);
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: checked, duplicateMbids: false, search: debouncedBandsSearch });
  };

  const handleFindDuplicateMbidsToggle = (checked: boolean) => {
    setFindDuplicateMbids(checked);
    if (checked) setFindDuplicates(false);
    setBandsPage(1);
    fetchBands(1, { duplicatesOnly: false, duplicateMbids: checked, search: debouncedBandsSearch });
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

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiClient.deleteBand(deleteTarget.id);
      setBands((prev) => prev.filter((b) => b.id !== deleteTarget.id));
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
        message: 'Failed to delete band. Please try again.',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBandClick = (bandId: number) => {
    setSelectedBandId(bandId);
    openBandDrawer();
  };

  const handleBandUpdated = (updatedBand: Band) => {
    setBands((prev) =>
      prev.map((b) => (b.id === updatedBand.id ? { ...b, ...updatedBand } : b))
    );
  };

  const handleBandDeleteFromDrawer = (bandId: number, bandName: string) => {
    closeBandDrawer();
    handleDeleteClick(bandId, bandName);
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

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="md">
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Bands</Title>
              <Text size="sm" c="dimmed">
                Manage band profiles
              </Text>
            </div>
            <Badge size="lg" variant="light">
              {bandsPagination?.total_count ?? bands.length} total
            </Badge>
          </Group>
        </Paper>

        {/* Duplicate Finder Toggles */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
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
                              onClick={() => handleDeleteClick(band.id, band.name)}
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
            Are you sure you want to delete band{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.name}
            </Text>
            ?
          </Text>
          <Text size="sm" c="red">
            This will permanently delete the band and all its reviews.
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

      {/* Band Detail Drawer */}
      <AdminBandDrawer
        bandId={selectedBandId}
        opened={bandDrawerOpened}
        onClose={closeBandDrawer}
        onBandUpdated={handleBandUpdated}
        onDeleteClick={handleBandDeleteFromDrawer}
      />
    </Container>
  );
}
