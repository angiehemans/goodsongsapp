import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IconAlertCircle, IconCalendarEvent, IconMusic } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Center,
  Container,
  Flex,
  Group,
  Paper,
  Spoiler,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { EventCard } from '@/components/EventCard/EventCard';
import { Header } from '@/components/Header/Header';
import { MusicPlayer } from '@/components/MusicPlayer/MusicPlayer';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { Band, Event, Review } from '@/lib/api';
import styles from './page.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const band = await getBand(slug);
    return {
      title: `${band.name} - Goodsongs`,
      description:
        band.about ||
        `Check out ${band.name} on Goodsongs. ${band.reviews_count} recommendation${band.reviews_count !== 1 ? 's' : ''} and counting.`,
    };
  } catch {
    return {
      title: 'Band Not Found - Goodsongs',
      description: 'The requested band profile could not be found.',
    };
  }
}

function getBaseUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://www.goodsongs.app'
    : 'http://localhost:3001';
}

async function getBand(slug: string): Promise<Band> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/bands/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch band');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching band:', error);
    throw error;
  }
}

async function getBandEvents(slug: string): Promise<Event[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    const response = await fetch(`${apiUrl}/bands/${slug}/events`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch events:', response.status);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function BandProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let band: Band;
  let events: Event[] = [];

  try {
    [band, events] = await Promise.all([getBand(slug), getBandEvents(slug)]);
  } catch (error) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="xl">
          Failed to load band profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  const reviewsCount = band.reviews?.length || band.reviews_count || 0;
  // Filter to only show upcoming events
  const upcomingEvents = events.filter((event) => new Date(event.event_date) >= new Date());

  return (
    <Container p={0} fluid className={styles.container}>
      <Header showBackButton />
      <Flex className={styles.content}>
        {/* Band Sidebar */}
        <Flex p="md" direction="column" gap="sm" className={styles.bandBackground}>
          <Group align="center">
            <ProfilePhoto
              src={band.profile_picture_url || band.spotify_image_url}
              alt={band.name}
              size={72}
              fallback={band.name}
            />
            <Stack gap="xs" flex={1}>
              <Title order={2} c="blue.8" fw={500} lh={1}>
                {band.name}
              </Title>
              {(band.city || band.region || band.location) && (
                <Text c="blue.7" size="sm" lh={1}>
                  {band.city || band.region
                    ? [band.city, band.region].filter(Boolean).join(', ')
                    : band.location}
                </Text>
              )}
            </Stack>
          </Group>
          {band.about && (
            <Spoiler
              maxHeight={60}
              showLabel="Read more"
              hideLabel="Show less"
              styles={{
                control: {
                  fontSize: 'var(--mantine-font-size-sm)',
                  color: 'var(--mantine-color-grape-4)',
                },
              }}
            >
              <Text c="gray.7" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {band.about}
              </Text>
            </Spoiler>
          )}
          <Group gap="xs">
            <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
              {reviewsCount} recommendation{reviewsCount !== 1 ? 's' : ''}
            </Badge>
          </Group>
        </Flex>

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" flex={1}>
          {/* Music Player - Priority: Bandcamp > Spotify > YouTube Music > Apple Music */}
          <MusicPlayer
            bandcampLink={band.bandcamp_link}
            spotifyLink={band.spotify_link}
            youtubeMusicLink={band.youtube_music_link}
            appleMusicLink={band.apple_music_link}
            className={styles.musicPlayer}
          />

          {/* Events Section - Above Recommendations */}
          {upcomingEvents.length > 0 && (
            <>
              <Title order={2} my="sm" c="blue.8" fw={500}>
                <Group gap="xs">
                  <IconCalendarEvent size={24} />
                  Upcoming Events
                </Group>
              </Title>
              <Stack gap="md" mb="xl">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Stack>
            </>
          )}

          {/* Recommendations Section */}
          <Title order={2} my="sm" c="blue.8" fw={500}>
            Recommendations
          </Title>

          {!band.reviews || band.reviews.length === 0 ? (
            <Paper p="lg" radius="md">
              <Center py="xl">
                <Stack align="center">
                  <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    No recommendations yet. Be the first to recommend {band.name}!
                  </Text>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Stack>
              {band.reviews.map((review: Review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </Stack>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}
