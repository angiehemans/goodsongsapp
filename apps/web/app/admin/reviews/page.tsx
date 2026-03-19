'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconEdit,
  IconMessage,
  IconPhoto,
  IconSearch,
  IconSparkles,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Image,
  Loader,
  Modal,
  Pagination,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, ArtworkOption, DiscoverPagination, Review } from '@/lib/api';
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

  // Edit modal state
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({
    song_link: '',
    band_name: '',
    song_name: '',
    artwork_url: '',
    review_text: '',
    liked_aspects: [] as string[],
    genres: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Artwork search state
  const [artworkResults, setArtworkResults] = useState<ArtworkOption[]>([]);
  const [artworkSearching, setArtworkSearching] = useState(false);
  const [artworkSearched, setArtworkSearched] = useState(false);
  const [artworkUploading, setArtworkUploading] = useState(false);

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

  const handleEditClick = (review: Review) => {
    setEditTarget(review);
    setEditForm({
      song_link: (review as any).song_link || '',
      band_name: review.band_name || '',
      song_name: review.song_name || '',
      artwork_url: review.artwork_url || '',
      review_text: review.review_text || '',
      liked_aspects: (review as any).liked_aspects?.map((a: any) => typeof a === 'string' ? a : a.name) || [],
      genres: (review as any).genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [],
    });
    setArtworkResults([]);
    setArtworkSearched(false);
    openEditModal();
  };

  const handleSearchArtwork = async () => {
    if (!editForm.song_name && !editForm.band_name) return;
    setArtworkSearching(true);
    try {
      const response = await apiClient.searchArtwork(editForm.song_name, editForm.band_name);
      setArtworkResults(response.artwork_options || []);
      setArtworkSearched(true);
    } catch (error) {
      console.error('Artwork search failed:', error);
      notifications.show({
        title: 'Error',
        message: 'Artwork search failed. Try again.',
        color: 'red',
      });
    } finally {
      setArtworkSearching(false);
    }
  };

  const handleArtworkFileUpload = async (file: File) => {
    const trackId = (editTarget as any)?.track?.id;
    if (!trackId) {
      notifications.show({
        title: 'No track linked',
        message: 'This review has no linked track. Use artwork search or paste a URL instead.',
        color: 'orange',
      });
      return;
    }
    setArtworkUploading(true);
    try {
      const response = await apiClient.adminUploadTrackArtwork(trackId, { file });
      setEditForm((f) => ({ ...f, artwork_url: response.track.artwork_url }));
      notifications.show({
        title: 'Uploaded',
        message: 'Artwork uploaded to track. Reviews will inherit this artwork.',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to upload artwork:', error);
      notifications.show({
        title: 'Upload failed',
        message: 'Could not upload artwork. Try again or paste a URL.',
        color: 'red',
      });
    } finally {
      setArtworkUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setIsSaving(true);
    try {
      const response = await apiClient.adminUpdateReview(editTarget.id, {
        song_link: editForm.song_link || undefined,
        band_name: editForm.band_name || undefined,
        song_name: editForm.song_name || undefined,
        artwork_url: editForm.artwork_url || undefined,
        review_text: editForm.review_text || undefined,
        liked_aspects: editForm.liked_aspects.length > 0 ? editForm.liked_aspects : undefined,
        genres: editForm.genres.length > 0 ? editForm.genres : undefined,
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === editTarget.id ? { ...r, ...response.review } : r))
      );
      notifications.show({
        title: 'Updated',
        message: `Review "${editForm.song_name}" has been updated.`,
        color: 'green',
      });
      closeEditModal();
    } catch (error) {
      console.error('Failed to update review:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update review. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
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
                              size="xs"
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditClick(review)}
                            >
                              Edit
                            </Button>
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
      {/* Edit Review Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Review"
        centered
        size="lg"
      >
        <Stack>
          <TextInput
            label="Song Name"
            value={editForm.song_name}
            onChange={(e) => setEditForm((f) => ({ ...f, song_name: e.target.value }))}
          />
          <TextInput
            label="Band / Artist Name"
            value={editForm.band_name}
            onChange={(e) => setEditForm((f) => ({ ...f, band_name: e.target.value }))}
          />
          <TextInput
            label="Song Link"
            placeholder="https://open.spotify.com/track/..."
            value={editForm.song_link}
            onChange={(e) => setEditForm((f) => ({ ...f, song_link: e.target.value }))}
          />
          {/* Artwork */}
          <Stack gap="xs">
            <Group justify="space-between" align="flex-end">
              <TextInput
                label="Artwork URL"
                placeholder="Paste URL or search below"
                value={editForm.artwork_url}
                onChange={(e) => setEditForm((f) => ({ ...f, artwork_url: e.target.value }))}
                style={{ flex: 1 }}
              />
              {editForm.artwork_url && (
                <Avatar src={editForm.artwork_url} size="lg" radius="sm" />
              )}
            </Group>
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                leftSection={artworkSearching ? <Loader size={14} /> : <IconSearch size={14} />}
                onClick={handleSearchArtwork}
                disabled={artworkSearching || (!editForm.song_name && !editForm.band_name)}
              >
                {artworkSearching ? 'Searching...' : 'Search Artwork'}
              </Button>
              <Button
                variant="light"
                size="xs"
                color="grape"
                leftSection={artworkUploading ? <Loader size={14} /> : <IconUpload size={14} />}
                disabled={artworkUploading}
                component="label"
              >
                {artworkUploading ? 'Uploading...' : 'Upload to Track'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleArtworkFileUpload(file);
                    e.target.value = '';
                  }}
                />
              </Button>
            </Group>
            {artworkSearched && artworkResults.length === 0 && (
              <Text size="xs" c="dimmed">No artwork found. Try editing the song/artist name above.</Text>
            )}
            {artworkResults.length > 0 && (
              <Paper p="xs" withBorder radius="sm" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <SimpleGrid cols={4} spacing="xs">
                  {artworkResults.map((art, i) => (
                    <UnstyledButton
                      key={i}
                      onClick={() => {
                        setEditForm((f) => ({ ...f, artwork_url: art.url }));
                        setArtworkResults([]);
                        setArtworkSearched(false);
                      }}
                      style={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: editForm.artwork_url === art.url ? '2px solid var(--mantine-primary-color-filled)' : '2px solid transparent',
                      }}
                    >
                      <Image src={art.url} alt={art.album_name || 'Artwork'} h={70} fit="cover" radius="sm" />
                      <Text size="xs" c="dimmed" lineClamp={1} ta="center" mt={2}>
                        {art.source_display}
                      </Text>
                    </UnstyledButton>
                  ))}
                </SimpleGrid>
              </Paper>
            )}
          </Stack>
          <Textarea
            label="Review Text"
            value={editForm.review_text}
            onChange={(e) => setEditForm((f) => ({ ...f, review_text: e.target.value }))}
            minRows={3}
            autosize
          />
          <TagsInput
            label="Liked Aspects"
            placeholder="Add aspect and press Enter"
            value={editForm.liked_aspects}
            onChange={(value) => setEditForm((f) => ({ ...f, liked_aspects: value }))}
          />
          <TagsInput
            label="Genres"
            placeholder="Add genre and press Enter"
            value={editForm.genres}
            onChange={(value) => setEditForm((f) => ({ ...f, genres: value }))}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeEditModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={isSaving}
              leftSection={<IconEdit size={16} />}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
