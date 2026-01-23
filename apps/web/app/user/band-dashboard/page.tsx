'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCalendarEvent, IconMusic, IconPlus } from '@tabler/icons-react';
import {
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { EventCard } from '@/components/EventCard/EventCard';
import { Header } from '@/components/Header/Header';
import { MusicPlayer } from '@/components/MusicPlayer/MusicPlayer';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, Event, Review } from '@/lib/api';
import styles from './page.module.css';

// Lazy load EventForm - only load when needed
const EventForm = dynamic(() => import('@/components/EventForm/EventForm').then(mod => ({ default: mod.EventForm })), {
  loading: () => null,
  ssr: false,
});

export default function BandDashboardPage() {
  const { user, isLoading, isOnboardingComplete, isFan } = useAuth();
  const router = useRouter();
  const [band, setBand] = useState<Band | null>(null);
  const [bandReviews, setBandReviews] = useState<Review[]>([]);
  const [bandEvents, setBandEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Event form modal state
  const [eventFormOpened, setEventFormOpened] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && isFan) {
      router.push('/user/dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isFan, router]);

  const fetchBandData = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);

    try {
      const bands = await apiClient.getUserBands();
      if (bands.length > 0) {
        const userBand = bands[0];
        setBand(userBand);

        // Fetch full band details including reviews and events
        const [bandDetails, events] = await Promise.all([
          apiClient.getBand(userBand.slug),
          apiClient.getBandEvents(userBand.slug),
        ]);
        setBand(bandDetails);
        setBandReviews(bandDetails.reviews || []);
        setBandEvents(events || []);
      }
    } catch (error) {
      notifications.show({
        title: 'Error loading band',
        message: 'Could not load your band data. Please try again.',
        color: 'red',
      });
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && isOnboardingComplete && !isFan) {
      fetchBandData();
    }
  }, [user, isOnboardingComplete, isFan, fetchBandData]);

  const handleBandSaved = useCallback((updatedBand: Band) => {
    setBand(updatedBand);
  }, []);

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setEventFormOpened(true);
  }, []);

  const handleCloseEventForm = useCallback(() => {
    setEventFormOpened(false);
    setEditingEvent(null);
  }, []);

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event);
    setEventFormOpened(true);
  }, []);

  const handleDeleteEvent = useCallback((event: Event) => {
    modals.openConfirmModal({
      title: 'Delete Event',
      children: (
        <Text size="sm">
          Are you sure you want to delete "{event.name}"? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await apiClient.deleteEvent(event.id);
          setBandEvents((prev) => prev.filter((e) => e.id !== event.id));
          notifications.show({
            title: 'Event Deleted',
            message: `"${event.name}" has been deleted.`,
            color: 'green',
          });
        } catch (error) {
          console.error('Failed to delete event:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to delete event. Please try again.',
            color: 'red',
          });
        }
      },
    });
  }, []);

  const handleEventSaved = useCallback((savedEvent: Event) => {
    if (editingEvent) {
      // Update existing event
      setBandEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
    } else {
      // Add new event
      setBandEvents((prev) => [savedEvent, ...prev]);
    }
    setEventFormOpened(false);
    setEditingEvent(null);
  }, [editingEvent]);

  // Memoize filtered events to avoid recalculating on every render
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return {
      upcomingEvents: bandEvents.filter((e) => new Date(e.event_date) >= now),
      pastEvents: bandEvents.filter((e) => new Date(e.event_date) < now),
    };
  }, [bandEvents]);

  if (isLoading) {
    return (
      <Container>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  // No band yet - show create band prompt
  if (!dataLoading && !band) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header />
        <Container size="md" py="xl">
          <Paper p="xl" radius="md">
            <Center>
              <Stack align="center" gap="lg">
                <IconMusic size={64} color="var(--mantine-color-grape-6)" />
                <Stack align="center" gap="xs">
                  <Title order={3}>Create Your Band Profile</Title>
                  <Text c="dimmed" ta="center" maw={400}>
                    Get started by creating your band profile. Fans will be able to find you and
                    recommend your music to others.
                  </Text>
                </Stack>
                <Button
                  component={Link}
                  href="/user/create-band"
                  size="lg"
                  leftSection={<IconPlus size={20} />}
                >
                  Create Band Profile
                </Button>
              </Stack>
            </Center>
          </Paper>
        </Container>
      </Container>
    );
  }

  return (
    <Container p={0} fluid className={styles.container}>
      <Header />

      <Flex className={styles.content}>
        {/* Band Sidebar */}
        {dataLoading ? (
          <Flex p="md" direction="column" gap="sm" className={styles.sidebarLoading}>
            <Center py="xl">
              <Loader size="md" />
            </Center>
          </Flex>
        ) : band ? (
          <BandSidebar
            band={band}
            badgeText={`${bandReviews.length} recommendation${bandReviews.length !== 1 ? 's' : ''}`}
            onBandSaved={handleBandSaved}
          />
        ) : null}

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" maw={700} flex={1}>
          {/* Music Player */}
          {band && (
            <MusicPlayer
              bandcampEmbed={band.bandcamp_embed}
              bandcampLink={band.bandcamp_link}
              spotifyLink={band.spotify_link}
              youtubeMusicLink={band.youtube_music_link}
              appleMusicLink={band.apple_music_link}
              className={styles.musicPlayer}
            />
          )}

          {/* Events Section */}
          <Group justify="space-between" align="center" my="sm">
            <Title order={2} c="blue.8" fw={500}>
              <Group gap="xs">
                <IconCalendarEvent size={24} />
                Events
              </Group>
            </Title>
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreateEvent} size="sm">
              Add Event
            </Button>
          </Group>

          {dataLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : bandEvents.length === 0 ? (
            <Paper p="lg" radius="md" mb="xl">
              <Center py="xl">
                <Stack align="center">
                  <IconCalendarEvent size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    No events yet. Create your first event to let fans know where to see you!
                  </Text>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateEvent}
                    variant="light"
                  >
                    Create Event
                  </Button>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Stack gap="md" mb="xl">
              {upcomingEvents.length > 0 && (
                <>
                  <Text size="sm" fw={500} c="dimmed">
                    Upcoming Events ({upcomingEvents.length})
                  </Text>
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showActions
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </>
              )}

              {pastEvents.length > 0 && (
                <>
                  <Divider my="sm" />
                  <Text size="sm" fw={500} c="dimmed">
                    Past Events ({pastEvents.length})
                  </Text>
                  {pastEvents.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      showActions
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                  {pastEvents.length > 3 && (
                    <Text size="sm" c="dimmed" ta="center">
                      + {pastEvents.length - 3} more past events
                    </Text>
                  )}
                </>
              )}
            </Stack>
          )}

          {/* Fan Recommendations */}
          <Title order={2} my="sm" c="blue.8" fw={500}>
            Fan Recommendations
          </Title>

          {dataLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : bandReviews.length === 0 ? (
            <Paper p="lg" radius="md">
              <Center py="xl">
                <Stack align="center">
                  <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    No recommendations yet. Share your band profile with fans to get
                    recommendations!
                  </Text>
                  {band && (
                    <Button component={Link} href={`/bands/${band.slug}`} variant="light">
                      View Your Band Profile
                    </Button>
                  )}
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Stack>
              {bandReviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}

              {bandReviews.length > 5 && (
                <>
                  <Divider />
                  <Group justify="center">
                    <Text size="sm" c="dimmed">
                      Showing 5 of {bandReviews.length} recommendations
                    </Text>
                    {band && (
                      <Button
                        component={Link}
                        href={`/bands/${band.slug}`}
                        variant="subtle"
                        size="sm"
                      >
                        View All
                      </Button>
                    )}
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Flex>
      </Flex>

      {/* Event Form Drawer - keep mounted for smooth animations */}
      {band && (
        <EventForm
          bandSlug={band.slug}
          event={editingEvent}
          opened={eventFormOpened}
          onClose={handleCloseEventForm}
          onSaved={handleEventSaved}
        />
      )}
    </Container>
  );
}
