'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  IconCalendarEvent,
  IconMessage,
  IconMusic,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { EventCard } from '@/components/EventCard/EventCard';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, Band, Event, Review, UserProfile } from '@/lib/api';
import styles from './page.module.css';

// SWR fetcher functions
const fetchUsers = async (page: number) => apiClient.discoverUsers(page);
const fetchBands = async (page: number) => apiClient.discoverBands(page);
const fetchReviews = async (page: number) => apiClient.discoverReviews(page);
const fetchEvents = async (page: number) => apiClient.discoverEvents(page);

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Pagination state for "load more" functionality
  const [usersPage, setUsersPage] = useState(1);
  const [bandsPage, setBandsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);

  // Accumulated data for pagination
  const [accumulatedUsers, setAccumulatedUsers] = useState<UserProfile[]>([]);
  const [accumulatedBands, setAccumulatedBands] = useState<Band[]>([]);
  const [accumulatedReviews, setAccumulatedReviews] = useState<Review[]>([]);
  const [accumulatedEvents, setAccumulatedEvents] = useState<Event[]>([]);

  // SWR hooks - only fetch when tab is active (conditional fetching)
  const { data: usersData, isLoading: usersLoading } = useSWR(
    activeTab === 'users' ? ['discover-users', usersPage] : null,
    () => fetchUsers(usersPage),
    {
      onSuccess: (data) => {
        if (usersPage === 1) {
          setAccumulatedUsers(data?.users || []);
        } else {
          setAccumulatedUsers((prev) => [...prev, ...(data?.users || [])]);
        }
      },
      revalidateOnFocus: false,
    }
  );

  const { data: bandsData, isLoading: bandsLoading } = useSWR(
    activeTab === 'bands' ? ['discover-bands', bandsPage] : null,
    () => fetchBands(bandsPage),
    {
      onSuccess: (data) => {
        if (bandsPage === 1) {
          setAccumulatedBands(data?.bands || []);
        } else {
          setAccumulatedBands((prev) => [...prev, ...(data?.bands || [])]);
        }
      },
      revalidateOnFocus: false,
    }
  );

  const { data: reviewsData, isLoading: reviewsLoading } = useSWR(
    activeTab === 'reviews' ? ['discover-reviews', reviewsPage] : null,
    () => fetchReviews(reviewsPage),
    {
      onSuccess: (data) => {
        if (reviewsPage === 1) {
          setAccumulatedReviews(data?.reviews || []);
        } else {
          setAccumulatedReviews((prev) => [...prev, ...(data?.reviews || [])]);
        }
      },
      revalidateOnFocus: false,
    }
  );

  const { data: eventsData, isLoading: eventsLoading } = useSWR(
    activeTab === 'events' ? ['discover-events', eventsPage] : null,
    () => fetchEvents(eventsPage),
    {
      onSuccess: (data) => {
        if (eventsPage === 1) {
          setAccumulatedEvents(data?.events || []);
        } else {
          setAccumulatedEvents((prev) => [...prev, ...(data?.events || [])]);
        }
      },
      revalidateOnFocus: false,
    }
  );

  // Memoized filtered arrays - only recalculate when data or search changes
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return accumulatedUsers;
    const query = debouncedSearch.toLowerCase();
    return accumulatedUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.city?.toLowerCase().includes(query) ||
        user.region?.toLowerCase().includes(query)
    );
  }, [accumulatedUsers, debouncedSearch]);

  const filteredBands = useMemo(() => {
    if (!debouncedSearch) return accumulatedBands;
    const query = debouncedSearch.toLowerCase();
    return accumulatedBands.filter(
      (band) =>
        band.name?.toLowerCase().includes(query) ||
        band.city?.toLowerCase().includes(query) ||
        band.region?.toLowerCase().includes(query)
    );
  }, [accumulatedBands, debouncedSearch]);

  const filteredReviews = useMemo(() => {
    if (!debouncedSearch) return accumulatedReviews;
    const query = debouncedSearch.toLowerCase();
    return accumulatedReviews.filter(
      (review) =>
        review.song_name?.toLowerCase().includes(query) ||
        review.band_name?.toLowerCase().includes(query) ||
        review.author?.username?.toLowerCase().includes(query)
    );
  }, [accumulatedReviews, debouncedSearch]);

  const filteredEvents = useMemo(() => {
    if (!debouncedSearch) return accumulatedEvents;
    const query = debouncedSearch.toLowerCase();
    return accumulatedEvents.filter(
      (event) =>
        event.name?.toLowerCase().includes(query) ||
        event.venue?.name?.toLowerCase().includes(query) ||
        event.venue?.city?.toLowerCase().includes(query) ||
        event.band?.name?.toLowerCase().includes(query)
    );
  }, [accumulatedEvents, debouncedSearch]);

  // Load more handlers
  const handleLoadMoreUsers = () => {
    if (usersData?.meta && usersPage < usersData.meta.total_pages) {
      setUsersPage((p) => p + 1);
    }
  };

  const handleLoadMoreBands = () => {
    if (bandsData?.meta && bandsPage < bandsData.meta.total_pages) {
      setBandsPage((p) => p + 1);
    }
  };

  const handleLoadMoreReviews = () => {
    if (reviewsData?.meta && reviewsPage < reviewsData.meta.total_pages) {
      setReviewsPage((p) => p + 1);
    }
  };

  const handleLoadMoreEvents = () => {
    if (eventsData?.meta && eventsPage < eventsData.meta.total_pages) {
      setEventsPage((p) => p + 1);
    }
  };

  // Check if currently loading based on active tab
  const isLoading =
    (activeTab === 'users' && usersLoading && accumulatedUsers.length === 0) ||
    (activeTab === 'bands' && bandsLoading && accumulatedBands.length === 0) ||
    (activeTab === 'reviews' && reviewsLoading && accumulatedReviews.length === 0) ||
    (activeTab === 'events' && eventsLoading && accumulatedEvents.length === 0);

  const isLoadingMore =
    (activeTab === 'users' && usersLoading && accumulatedUsers.length > 0) ||
    (activeTab === 'bands' && bandsLoading && accumulatedBands.length > 0) ||
    (activeTab === 'reviews' && reviewsLoading && accumulatedReviews.length > 0) ||
    (activeTab === 'events' && eventsLoading && accumulatedEvents.length > 0);

  return (
    <Container p={0} fluid className={styles.container}>
      <Header logoHref="/user/dashboard" showBackButton />

      <Flex className={styles.content}>
        {/* Sidebar */}
        <Box className={styles.sidebar} p="md">
          <Title order={2} c="blue.8" fw={500} mb="md">
            Discover
          </Title>

          <Flex className={styles.menu} gap={4}>
            <Button
              variant={activeTab === 'users' ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconUsers size={16} />}
              className={styles.menuButton}
              justify="flex-start"
              onClick={() => setActiveTab('users')}
            >
              Users
            </Button>
            <Button
              variant={activeTab === 'bands' ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconMusic size={16} />}
              className={styles.menuButton}
              justify="flex-start"
              onClick={() => setActiveTab('bands')}
            >
              Bands
            </Button>
            <Button
              variant={activeTab === 'reviews' ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconMessage size={16} />}
              className={styles.menuButton}
              justify="flex-start"
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </Button>
            <Button
              variant={activeTab === 'events' ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconCalendarEvent size={16} />}
              className={styles.menuButton}
              justify="flex-start"
              onClick={() => setActiveTab('events')}
            >
              Events
            </Button>
          </Flex>
        </Box>

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" flex={1}>
          <Box maw={700} w="100%">
            <TextInput
              placeholder="Search..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              my="md"
            />

            {isLoading ? (
              <Center py="xl">
                <Loader size="lg" />
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
                  <Stack gap={0}>
                    {filteredUsers
                      .filter((user) => user.username)
                      .map((user) => (
                        <Flex
                          key={user.id}
                          component={Link}
                          href={`/users/${user.username}`}
                          className={styles.card}
                          align="center"
                          gap="md"
                          p="xs"
                        >
                          <ProfilePhoto
                            src={user.profile_image_url}
                            alt={user.username || 'User'}
                            size={40}
                            fallback={user.username || 'U'}
                          />
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Text fw={500} className={styles.user}>
                              @{user.username}
                            </Text>
                            {(user.location || user.city || user.region) && (
                              <Text size="xs" c="dimmed">
                                {user.location || [user.city, user.region].filter(Boolean).join(', ')}
                              </Text>
                            )}
                          </Stack>
                          {(user.reviews_count ?? 0) > 0 && (
                            <Badge size="sm" variant="light" color="grape">
                              {user.reviews_count} rec{user.reviews_count !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </Flex>
                      ))}

                    {!debouncedSearch && usersData?.meta && usersPage < usersData.meta.total_pages && (
                      <Center mt="md">
                        <Button onClick={handleLoadMoreUsers} loading={isLoadingMore} variant="light">
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
                  <Stack gap={0}>
                    {filteredBands
                      .filter((band) => band.name && band.slug)
                      .map((band) => (
                        <Flex
                          key={band.id}
                          component={Link}
                          href={`/bands/${band.slug}`}
                          className={styles.card}
                          align="center"
                          gap="md"
                          p="xs"
                        >
                          <ProfilePhoto
                            src={band.profile_picture_url || band.spotify_image_url}
                            alt={band.name || 'Band'}
                            size={40}
                            fallback={band.name || 'B'}
                          />
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Text fw={500} className={styles.user}>
                              {band.name}
                            </Text>
                            {(band.location || band.city || band.region) && (
                              <Text size="xs" c="dimmed">
                                {band.location || [band.city, band.region].filter(Boolean).join(', ')}
                              </Text>
                            )}
                          </Stack>
                          {(band.reviews_count > 0 || (band.reviews && band.reviews.length > 0)) && (
                            <Badge size="sm" variant="light" color="grape">
                              {band.reviews_count || band.reviews?.length} rec
                              {(band.reviews_count || band.reviews?.length) !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </Flex>
                      ))}

                    {!debouncedSearch && bandsData?.meta && bandsPage < bandsData.meta.total_pages && (
                      <Center mt="md">
                        <Button onClick={handleLoadMoreBands} loading={isLoadingMore} variant="light">
                          Load More Bands
                        </Button>
                      </Center>
                    )}
                  </Stack>
                )}
              </div>
            ) : activeTab === 'reviews' ? (
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

                    {!debouncedSearch && reviewsData?.meta && reviewsPage < reviewsData.meta.total_pages && (
                      <Center>
                        <Button
                          onClick={handleLoadMoreReviews}
                          loading={isLoadingMore}
                          variant="light"
                        >
                          Load More Reviews
                        </Button>
                      </Center>
                    )}
                  </Stack>
                )}
              </div>
            ) : (
              <div>
                {filteredEvents.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center">
                      <IconCalendarEvent size={48} color="var(--mantine-color-dimmed)" />
                      <Text c="dimmed">
                        {debouncedSearch
                          ? 'No events found matching your search.'
                          : 'No upcoming events.'}
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} showBand />
                    ))}

                    {!debouncedSearch && eventsData?.meta && eventsPage < eventsData.meta.total_pages && (
                      <Center>
                        <Button
                          onClick={handleLoadMoreEvents}
                          loading={isLoadingMore}
                          variant="light"
                        >
                          Load More Events
                        </Button>
                      </Center>
                    )}
                  </Stack>
                )}
              </div>
            )}
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
}
