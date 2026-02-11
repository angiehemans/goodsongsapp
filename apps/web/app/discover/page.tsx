'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconCalendarEvent,
  IconMessage,
  IconMusic,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import useSWR from 'swr';
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
const fetchUsers = async (page: number, query?: string) => apiClient.discoverUsers(page, query);
const fetchBands = async (page: number, query?: string) => apiClient.discoverBands(page, query);
const fetchReviews = async (page: number, query?: string) => apiClient.discoverReviews(page, query);
const fetchEvents = async (page: number, query?: string) => apiClient.discoverEvents(page, query);

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

  // Reset pagination when search query changes
  useEffect(() => {
    setUsersPage(1);
    setBandsPage(1);
    setReviewsPage(1);
    setEventsPage(1);
    setAccumulatedUsers([]);
    setAccumulatedBands([]);
    setAccumulatedReviews([]);
    setAccumulatedEvents([]);
  }, [debouncedSearch]);

  // SWR hooks - only fetch when tab is active (conditional fetching)
  const { data: usersData, isLoading: usersLoading } = useSWR(
    activeTab === 'users' ? ['discover-users', usersPage, debouncedSearch] : null,
    () => fetchUsers(usersPage, debouncedSearch || undefined),
    { revalidateOnFocus: false }
  );

  const { data: bandsData, isLoading: bandsLoading } = useSWR(
    activeTab === 'bands' ? ['discover-bands', bandsPage, debouncedSearch] : null,
    () => fetchBands(bandsPage, debouncedSearch || undefined),
    { revalidateOnFocus: false }
  );

  const { data: reviewsData, isLoading: reviewsLoading } = useSWR(
    activeTab === 'reviews' ? ['discover-reviews', reviewsPage, debouncedSearch] : null,
    () => fetchReviews(reviewsPage, debouncedSearch || undefined),
    { revalidateOnFocus: false }
  );

  const { data: eventsData, isLoading: eventsLoading } = useSWR(
    activeTab === 'events' ? ['discover-events', eventsPage, debouncedSearch] : null,
    () => fetchEvents(eventsPage, debouncedSearch || undefined),
    { revalidateOnFocus: false }
  );

  // Accumulate paginated data — uses current_page from the response itself
  // to avoid stale closure issues with page state
  useEffect(() => {
    if (!usersData?.users) return;
    if (usersData.pagination?.current_page === 1) {
      setAccumulatedUsers(usersData.users);
    } else {
      setAccumulatedUsers((prev) => {
        const ids = new Set(prev.map((u) => u.id));
        return [...prev, ...usersData.users.filter((u) => !ids.has(u.id))];
      });
    }
  }, [usersData]);

  useEffect(() => {
    if (!bandsData?.bands) return;
    if (bandsData.pagination?.current_page === 1) {
      setAccumulatedBands(bandsData.bands);
    } else {
      setAccumulatedBands((prev) => {
        const ids = new Set(prev.map((b) => b.id));
        return [...prev, ...bandsData.bands.filter((b) => !ids.has(b.id))];
      });
    }
  }, [bandsData]);

  useEffect(() => {
    if (!reviewsData?.reviews) return;
    if (reviewsData.pagination?.current_page === 1) {
      setAccumulatedReviews(reviewsData.reviews);
    } else {
      setAccumulatedReviews((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...reviewsData.reviews.filter((r) => !ids.has(r.id))];
      });
    }
  }, [reviewsData]);

  useEffect(() => {
    if (!eventsData?.events) return;
    if (eventsData.pagination?.current_page === 1) {
      setAccumulatedEvents(eventsData.events);
    } else {
      setAccumulatedEvents((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        return [...prev, ...eventsData.events.filter((e) => !ids.has(e.id))];
      });
    }
  }, [eventsData]);

  // Load more handlers
  const handleLoadMoreUsers = useCallback(() => {
    if (usersData?.pagination?.has_next_page && !usersLoading) {
      setUsersPage((p) => p + 1);
    }
  }, [usersData?.pagination?.has_next_page, usersLoading]);

  const handleLoadMoreBands = useCallback(() => {
    if (bandsData?.pagination?.has_next_page && !bandsLoading) {
      setBandsPage((p) => p + 1);
    }
  }, [bandsData?.pagination?.has_next_page, bandsLoading]);

  const handleLoadMoreReviews = useCallback(() => {
    if (reviewsData?.pagination?.has_next_page && !reviewsLoading) {
      setReviewsPage((p) => p + 1);
    }
  }, [reviewsData?.pagination?.has_next_page, reviewsLoading]);

  const handleLoadMoreEvents = useCallback(() => {
    if (eventsData?.pagination?.has_next_page && !eventsLoading) {
      setEventsPage((p) => p + 1);
    }
  }, [eventsData?.pagination?.has_next_page, eventsLoading]);

  // Check if currently loading based on active tab
  const isLoading =
    (activeTab === 'users' && usersLoading && accumulatedUsers.length === 0) ||
    (activeTab === 'bands' && bandsLoading && accumulatedBands.length === 0) ||
    (activeTab === 'reviews' && reviewsLoading && accumulatedReviews.length === 0) ||
    (activeTab === 'events' && eventsLoading && accumulatedEvents.length === 0);

  // Infinite scroll via IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          if (activeTab === 'users') handleLoadMoreUsers();
          else if (activeTab === 'bands') handleLoadMoreBands();
          else if (activeTab === 'reviews') handleLoadMoreReviews();
          else if (activeTab === 'events') handleLoadMoreEvents();
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [
      activeTab,
      handleLoadMoreUsers,
      handleLoadMoreBands,
      handleLoadMoreReviews,
      handleLoadMoreEvents,
    ]
  );

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
              Fans
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
              Songs
            </Button>
            <Button
              variant={activeTab === 'events' ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconCalendarEvent size={16} />}
              className={styles.menuButton}
              justify="flex-start"
              onClick={() => setActiveTab('events')}
            >
              Shows
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
                {accumulatedUsers.length === 0 ? (
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
                    {accumulatedUsers
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
                                {user.location ||
                                  [user.city, user.region].filter(Boolean).join(', ')}
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

                    {usersData?.pagination?.has_next_page && (
                      <div ref={sentinelRef}>
                        <Center py="md">
                          <Loader size="sm" />
                        </Center>
                      </div>
                    )}
                  </Stack>
                )}
              </div>
            ) : activeTab === 'bands' ? (
              <div>
                {accumulatedBands.length === 0 ? (
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
                    {accumulatedBands
                      .filter((band) => band.name)
                      .map((band) => {
                        const content = (
                          <>
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
                                  {band.location ||
                                    [band.city, band.region].filter(Boolean).join(', ')}
                                </Text>
                              )}
                            </Stack>
                            {(band.reviews_count > 0 ||
                              (band.reviews && band.reviews.length > 0)) && (
                              <Badge size="sm" variant="light" color="grape">
                                {band.reviews_count || band.reviews?.length} rec
                                {(band.reviews_count || band.reviews?.length) !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </>
                        );

                        return band.slug ? (
                          <Flex
                            key={band.id}
                            component={Link}
                            href={`/bands/${band.slug}`}
                            className={styles.card}
                            align="center"
                            gap="md"
                            p="xs"
                          >
                            {content}
                          </Flex>
                        ) : (
                          <Flex
                            key={band.id}
                            className={styles.card}
                            align="center"
                            gap="md"
                            p="xs"
                          >
                            {content}
                          </Flex>
                        );
                      })}

                    {bandsData?.pagination?.has_next_page && (
                      <div ref={sentinelRef}>
                        <Center py="md">
                          <Loader size="sm" />
                        </Center>
                      </div>
                    )}
                  </Stack>
                )}
              </div>
            ) : activeTab === 'reviews' ? (
              <div>
                {accumulatedReviews.length === 0 ? (
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
                  <Stack gap={0}>
                    {accumulatedReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}

                    {reviewsData?.pagination?.has_next_page && (
                      <div ref={sentinelRef}>
                        <Center py="md">
                          <Loader size="sm" />
                        </Center>
                      </div>
                    )}
                  </Stack>
                )}
              </div>
            ) : (
              <div>
                {accumulatedEvents.length === 0 ? (
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
                    {accumulatedEvents.map((event) => (
                      <EventCard key={event.id} event={event} showBand />
                    ))}

                    {eventsData?.pagination?.has_next_page && (
                      <div ref={sentinelRef}>
                        <Center py="md">
                          <Loader size="sm" />
                        </Center>
                      </div>
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
