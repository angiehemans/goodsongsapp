'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconMessage, IconMusic, IconSearch, IconUsers } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, Band, Review, UserProfile } from '@/lib/api';
import styles from './page.module.css';

interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<string>('users');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersMeta, setUsersMeta] = useState<PaginationMeta | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  // Bands state
  const [bands, setBands] = useState<Band[]>([]);
  const [bandsPage, setBandsPage] = useState(1);
  const [bandsMeta, setBandsMeta] = useState<PaginationMeta | null>(null);
  const [bandsLoading, setBandsLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsMeta, setReviewsMeta] = useState<PaginationMeta | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page: number, append: boolean = false) => {
    setUsersLoading(true);
    try {
      const response = await apiClient.discoverUsers(page);
      const newUsers = response?.users || [];
      if (append) {
        setUsers((prev) => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }
      setUsersMeta(response?.meta || null);
      setUsersPage(response?.meta?.current_page || page);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      if (!append) setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchBands = useCallback(async (page: number, append: boolean = false) => {
    setBandsLoading(true);
    try {
      const response = await apiClient.discoverBands(page);
      const newBands = response?.bands || [];
      if (append) {
        setBands((prev) => [...prev, ...newBands]);
      } else {
        setBands(newBands);
      }
      setBandsMeta(response?.meta || null);
      setBandsPage(response?.meta?.current_page || page);
    } catch (err) {
      console.error('Failed to fetch bands:', err);
      if (!append) setBands([]);
    } finally {
      setBandsLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async (page: number, append: boolean = false) => {
    setReviewsLoading(true);
    try {
      const response = await apiClient.discoverReviews(page);
      const newReviews = response?.reviews || [];
      if (append) {
        setReviews((prev) => [...prev, ...newReviews]);
      } else {
        setReviews(newReviews);
      }
      setReviewsMeta(response?.meta || null);
      setReviewsPage(response?.meta?.current_page || page);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      if (!append) setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(1), fetchBands(1), fetchReviews(1)]);
      } catch (err) {
        console.error('Failed to load discover data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, [fetchUsers, fetchBands, fetchReviews]);

  // Filter based on search query (client-side filtering of loaded data)
  const filteredUsers = users.filter((user) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.city?.toLowerCase().includes(query) ||
      user.region?.toLowerCase().includes(query)
    );
  });

  const filteredBands = bands.filter((band) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      band.name?.toLowerCase().includes(query) ||
      band.city?.toLowerCase().includes(query) ||
      band.region?.toLowerCase().includes(query)
    );
  });

  const filteredReviews = reviews.filter((review) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      review.song_name?.toLowerCase().includes(query) ||
      review.band_name?.toLowerCase().includes(query) ||
      review.author?.username?.toLowerCase().includes(query)
    );
  });

  const handleLoadMoreUsers = () => {
    if (usersMeta && usersPage < usersMeta.total_pages) {
      fetchUsers(usersPage + 1, true);
    }
  };

  const handleLoadMoreBands = () => {
    if (bandsMeta && bandsPage < bandsMeta.total_pages) {
      fetchBands(bandsPage + 1, true);
    }
  };

  const handleLoadMoreReviews = () => {
    if (reviewsMeta && reviewsPage < reviewsMeta.total_pages) {
      fetchReviews(reviewsPage + 1, true);
    }
  };

  return (
    <Container p={0} fluid className={styles.container}>
      <Header logoHref="/user/dashboard" />

      <Container size="lg" py="md">
        <Stack gap="md">
          <Title order={1} c="blue.8">
            Discover
          </Title>

          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <SegmentedControl
              value={activeTab}
              onChange={setActiveTab}
              data={[
                {
                  label: (
                    <Group gap="xs">
                      <IconUsers size={16} />
                      <span>Users</span>
                    </Group>
                  ),
                  value: 'users',
                },
                {
                  label: (
                    <Group gap="xs">
                      <IconMusic size={16} />
                      <span>Bands</span>
                    </Group>
                  ),
                  value: 'bands',
                },
                {
                  label: (
                    <Group gap="xs">
                      <IconMessage size={16} />
                      <span>Reviews</span>
                    </Group>
                  ),
                  value: 'reviews',
                },
              ]}
            />

            <TextInput
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </Group>

          {initialLoading ? (
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          ) : error ? (
            <Center py="xl">
              <Stack align="center">
                <Text c="red">{error}</Text>
                <Button onClick={() => window.location.reload()} variant="light">
                  Retry
                </Button>
              </Stack>
            </Center>
          ) : activeTab === 'users' ? (
            <div>
              {filteredUsers.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconUsers size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed">
                      {debouncedSearch ? 'No users found matching your search.' : 'No users yet.'}
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  <Grid>
                    {filteredUsers
                      .filter((user) => user.username)
                      .map((user) => (
                        <Grid.Col key={user.id} span={{ base: 12, xs: 6, sm: 4, md: 3 }}>
                          <Card
                            component={Link}
                            href={`/users/${user.username}`}
                            padding="md"
                            radius="md"
                            className={styles.card}
                          >
                            <Stack align="center" gap="sm">
                              <ProfilePhoto
                                src={user.profile_image_url}
                                alt={user.username || 'User'}
                                size={80}
                                fallback={user.username || 'U'}
                              />
                              <Stack gap={4} align="center">
                                <Text fw={500} ta="center">
                                  @{user.username}
                                </Text>
                                {(user.city || user.region) && (
                                  <Text size="xs" c="dimmed" ta="center">
                                    {[user.city, user.region].filter(Boolean).join(', ')}
                                  </Text>
                                )}
                              </Stack>
                              {user.reviews && user.reviews.length > 0 && (
                                <Badge size="sm" variant="light" color="grape">
                                  {user.reviews.length} recommendation
                                  {user.reviews.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </Stack>
                          </Card>
                        </Grid.Col>
                      ))}
                  </Grid>

                  {!debouncedSearch && usersMeta && usersPage < usersMeta.total_pages && (
                    <Center>
                      <Button onClick={handleLoadMoreUsers} loading={usersLoading} variant="light">
                        Load More Users
                      </Button>
                    </Center>
                  )}
                </Stack>
              )}
            </div>
          ) : activeTab === 'bands' ? (
            <div>
              {filteredBands.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed">
                      {debouncedSearch ? 'No bands found matching your search.' : 'No bands yet.'}
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  <Grid>
                    {filteredBands
                      .filter((band) => band.name && band.slug)
                      .map((band) => (
                        <Grid.Col key={band.id} span={{ base: 12, xs: 6, sm: 4, md: 3 }}>
                          <Card
                            component={Link}
                            href={`/bands/${band.slug}`}
                            padding="md"
                            radius="md"
                            className={styles.card}
                          >
                            <Stack align="center" gap="sm">
                              <ProfilePhoto
                                src={band.profile_picture_url}
                                alt={band.name || 'Band'}
                                size={80}
                                fallback={band.name || 'B'}
                              />
                              <Stack gap={4} align="center">
                                <Text fw={500} ta="center">
                                  {band.name}
                                </Text>
                                {(band.city || band.region) && (
                                  <Text size="xs" c="dimmed" ta="center">
                                    {[band.city, band.region].filter(Boolean).join(', ')}
                                  </Text>
                                )}
                              </Stack>
                              {band.reviews && band.reviews.length > 0 && (
                                <Badge size="sm" variant="light" color="grape">
                                  {band.reviews.length} recommendation
                                  {band.reviews.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </Stack>
                          </Card>
                        </Grid.Col>
                      ))}
                  </Grid>

                  {!debouncedSearch && bandsMeta && bandsPage < bandsMeta.total_pages && (
                    <Center>
                      <Button onClick={handleLoadMoreBands} loading={bandsLoading} variant="light">
                        Load More Bands
                      </Button>
                    </Center>
                  )}
                </Stack>
              )}
            </div>
          ) : (
            <div>
              {filteredReviews.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconMessage size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed">
                      {debouncedSearch
                        ? 'No reviews found matching your search.'
                        : 'No reviews yet.'}
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  {filteredReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}

                  {!debouncedSearch && reviewsMeta && reviewsPage < reviewsMeta.total_pages && (
                    <Center>
                      <Button
                        onClick={handleLoadMoreReviews}
                        loading={reviewsLoading}
                        variant="light"
                      >
                        Load More Reviews
                      </Button>
                    </Center>
                  )}
                </Stack>
              )}
            </div>
          )}
        </Stack>
      </Container>
    </Container>
  );
}
