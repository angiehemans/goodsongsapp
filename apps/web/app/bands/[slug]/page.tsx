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
import { PageViewTracker } from '@/components/Analytics';
import { BandFollowButton } from '@/components/BandFollowButton/BandFollowButton';
import { EventCard } from '@/components/EventCard/EventCard';
import { Header } from '@/components/Header/Header';
import { MusicPlayer } from '@/components/MusicPlayer/MusicPlayer';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { ProfilePage } from '@/components/SiteBuilder/ProfilePage';
import { FontPreload } from '@/components/SiteBuilder/FontPreload';
import { Band, Event, Review } from '@/lib/api';
import { PublicProfileResponse } from '@/lib/site-builder/types';
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

    const data = await response.json();
    // Handle paginated response shape
    if (Array.isArray(data)) return data;
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
}

async function getPublicProfile(slug: string): Promise<PublicProfileResponse | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/profiles/bands/${slug}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
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

  // Check for a published custom theme
  const publicProfile = await getPublicProfile(slug);
  if (publicProfile?.data?.theme && publicProfile.data.sections.length > 0) {
    const { theme, sections, user } = publicProfile.data;

    const sourceData = {
      display_name: user.display_name || band.name,
      location: user.location || band.location,
      about_text: user.about_me || band.about,
      profile_image_url: user.profile_image_url || user.primary_band?.profile_picture_url || band.profile_picture_url,
      user: {
        id: user.id,
        username: user.username || band.slug,
        role: user.role,
      },
      band: {
        id: band.id,
        slug: band.slug,
        name: band.name,
        location: band.location,
        about: band.about,
        profile_picture_url: band.profile_picture_url,
      },
      social_links: user.social_links || band.social_links || {},
      streaming_links: {
        ...(band.spotify_link ? { spotify: band.spotify_link } : {}),
        ...(band.bandcamp_link ? { bandcamp: band.bandcamp_link } : {}),
        ...(band.apple_music_link ? { apple_music: band.apple_music_link } : {}),
        ...(band.youtube_music_link ? { youtube_music: band.youtube_music_link } : {}),
      },
    };

    return (
      <>
        <FontPreload fonts={[theme.header_font_name || theme.header_font, theme.body_font_name || theme.body_font]} customFontUrls={theme.custom_font_urls} />
        <ProfilePage
          theme={theme}
          sections={sections}
          sourceData={sourceData}
          isPreview={false}
        />
      </>
    );
  }

  const reviewsCount = band.reviews?.length || band.reviews_count || 0;
  // Filter to only show upcoming events
  const upcomingEvents = events.filter((event) => new Date(event.event_date) >= new Date());

  return (
    <Container p={0} fluid className={styles.container}>
      <PageViewTracker type="band" id={band.id} />
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
              <Title order={2} style={{ color: 'var(--gs-text-heading)' }} fw={500} lh={1}>
                {band.name}
              </Title>
              {(band.city || band.region || band.location) && (
                <Text style={{ color: 'var(--gs-text-heading)' }} size="sm" lh={1}>
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
                  color: 'var(--gs-text-muted)',
                },
              }}
            >
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', color: 'var(--gs-text-secondary)' }}>
                {band.about}
              </Text>
            </Spoiler>
          )}
          <Group gap="xs">
            <Badge color="grape" variant="light" fw="500" tt="capitalize" >
              {reviewsCount} recommendation{reviewsCount !== 1 ? 's' : ''}
            </Badge>
          </Group>
          {band.owner?.id && (
            <BandFollowButton ownerUserId={band.owner.id} />
          )}
        </Flex>

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" flex={1} maw={700}>
          {/* Music Player - Priority: Bandcamp > Spotify > YouTube Music > Apple Music */}
          <MusicPlayer
            bandcampEmbed={band.bandcamp_embed}
            bandcampLink={band.bandcamp_link}
            spotifyLink={band.spotify_link}
            youtubeMusicLink={band.youtube_music_link}
            appleMusicLink={band.apple_music_link}
            className={styles.musicPlayer}
          />

          {/* Events Section - Above Recommendations */}
          {upcomingEvents.length > 0 && (
            <>
              <Title order={2} my="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
                <Group gap="xs">
                  <IconCalendarEvent size={24} />
                  Upcoming Events
                </Group>
              </Title>
              <Stack gap="sm" mb="xl">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Stack>
            </>
          )}

          {/* Recommendations Section */}
          <Title order={2} my="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
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
