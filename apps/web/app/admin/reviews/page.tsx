'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconMessage,
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
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, DiscoverPagination, Review } from '@/lib/api';
import styles from '../page.module.css';

export default function AdminReviewsPage() {
  const { user, isAdmin } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Enrichment loading state
  const [enrichingReviewId, setEnrichingReviewId] = useState<number | null>(null);

  // Search state
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [debouncedReviewsSearch] = useDebouncedValue(reviewsSearch, 300);

  // Pagination state
  const [reviewsPagination, setReviewsPagination] = useState<DiscoverPagination | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);

  // Delete confirmation modal state
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (user && isAdmin) {
      fetchReviews(1);
    }
  }, [user, isAdmin, fetchReviews]);

  useEffect(() => {
    setReviewsPage(1);
    fetchReviews(1, debouncedReviewsSearch);
  }, [debouncedReviewsSearch, fetchReviews]);

  const handleReviewsPageChange = (page: number) => {
    setReviewsPage(page);
    fetchReviews(page, debouncedReviewsSearch);
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    openDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await apiClient.adminDeleteReview(deleteTarget.id);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
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
        message: 'Failed to delete review. Please try again.',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Container size="lg">
      <Stack gap="md">
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Reviews</Title>
              <Text size="sm" c="dimmed">
                Manage song reviews
              </Text>
            </div>
            <Badge size="lg" variant="light">
              {reviewsPagination?.total_count ?? reviews.length} total
            </Badge>
          </Group>
        </Paper>

        <TextInput
          placeholder="Search by song name or band name..."
          leftSection={<IconSearch size={16} />}
          value={reviewsSearch}
          onChange={(e) => setReviewsSearch(e.target.value)}
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
                              style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
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
                              style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
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
                              onClick={() => handleDeleteClick(review.id, `"${review.song_name}"`)}
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
            Are you sure you want to delete review{' '}
            <Text component="span" fw={600}>
              {deleteTarget?.name}
            </Text>
            ?
          </Text>
          <Text size="sm" c="red">
            This will permanently delete the review.
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
    </Container>
  );
}
