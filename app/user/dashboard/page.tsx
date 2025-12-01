'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconBrandSpotify,
  IconEdit,
  IconMusic,
  IconPlaylist,
  IconPlus,
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, Review } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

// Memoized components for better performance
const StatsCard = memo(
  ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
    <Card p="lg" radius="md">
      <Group>
        {icon}
        <div>
          <Text size="xl" fw={700}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </div>
      </Group>
    </Card>
  )
);

const BandCard = memo(({ band }: { band: Band }) => (
  <Grid.Col key={band.id} span={{ base: 12, sm: 6, md: 4 }}>
    <Card p="md">
      <Group justify="space-between" align="flex-start">
        <Link
          href={`/bands/${band.slug}`}
          style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
        >
          <Group>
            {band.profile_picture_url ? (
              <img
                src={fixImageUrl(band.profile_picture_url)}
                alt={band.name}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <Avatar size={48} color="grape.6">
                {band.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Stack gap="xs" flex={1}>
              <Title order={5}>{band.name}</Title>
              <Group gap="xs">
                <Badge size="sm" variant="light" color="grape">
                  {band.reviews_count} recommendation{band.reviews_count !== 1 ? 's' : ''}
                </Badge>
                {band.location && (
                  <Text size="xs" c="dimmed">
                    {band.location}
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>
        </Link>
        <ActionIcon
          component={Link}
          href={`/user/edit-band/${band.slug}`}
          variant="subtle"
          color="gray"
          size="sm"
        >
          <IconEdit size={16} />
        </ActionIcon>
      </Group>
    </Card>
  </Grid.Col>
));

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [bands, setBands] = useState<Band[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch core data in parallel for better performance
  const fetchCoreData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);

    try {
      // Fetch bands and reviews in parallel
      const [bandsResult, reviewsResult] = await Promise.allSettled([
        apiClient.getUserBands(),
        apiClient.getUserReviews(),
      ]);

      // Handle bands result
      if (bandsResult.status === 'fulfilled') {
        setBands(bandsResult.value);
      } else {
        notifications.show({
          title: 'Error loading bands',
          message: 'Could not load your bands. Please try again.',
          color: 'red',
        });
      }

      // Handle reviews result
      if (reviewsResult.status === 'fulfilled') {
        setReviews(reviewsResult.value);
      } else {
        // Silently fail for reviews as endpoint might not exist yet
        setReviews([]);
      }
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Load core data immediately when user is available
  useEffect(() => {
    if (user) {
      fetchCoreData();
    }
  }, [user, fetchCoreData]);

  // Check Spotify connection status
  const checkSpotifyConnection = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const status = await apiClient.getSpotifyStatus();
      setSpotifyConnected(status.connected);
    } catch (error) {
      setSpotifyConnected(false);
    }
  }, [user]);

  // Fetch Spotify data separately (non-blocking)
  const fetchSpotifyData = useCallback(async () => {
    if (!user || !spotifyConnected) {
      return;
    }

    setRecentlyPlayedLoading(true);

    try {
      const tracks = await apiClient.getRecentlyPlayed();
      const tracksArray = Array.isArray(tracks)
        ? tracks
        : (tracks as any)?.tracks || (tracks as any)?.items || [];
      setRecentlyPlayed(tracksArray);
    } catch (error) {
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, [user, spotifyConnected]);

  // Check Spotify connection when user is available
  useEffect(() => {
    if (user) {
      checkSpotifyConnection();
    }
  }, [user, checkSpotifyConnection]);

  // Load Spotify data when connection status changes
  useEffect(() => {
    if (user && spotifyConnected) {
      fetchSpotifyData();
    }
  }, [user, spotifyConnected, fetchSpotifyData]);

  if (isLoading) {
    return (
      <Container>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      <Container
        px={0}
        py="md"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-md)' }}
      >
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="flex-start">
            <Group>
              <Avatar
                size="lg"
                src={fixImageUrl(user.profile_image_url)}
                color="grape.6"
                component={Link}
                href={`/users/${user.username}`}
                style={{ cursor: 'pointer' }}
              >
                {!user.profile_image_url && user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={2}>Welcome back, {user.username}!</Title>
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
                {user.about_me && (
                  <Text size="sm" lineClamp={2} mt="xs">
                    {user.about_me}
                  </Text>
                )}
                <Text
                  size="xs"
                  c="grape.6"
                  component={Link}
                  href={`/users/${user.username}`}
                  style={{ textDecoration: 'none' }}
                  mt="xs"
                >
                  View your profile →
                </Text>
              </div>
            </Group>
            <Group>
              <Button
                component={Link}
                href="/user/create-review"
                leftSection={<IconPlus size={16} />}
              >
                New Recommendation
              </Button>
              <ActionIcon
                component={Link}
                href="/user/settings"
                variant="subtle"
                size="lg"
                color="gray"
              >
                <IconSettings size={24} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatsCard
              icon={<IconMusic size={32} color="var(--mantine-color-grape-6)" />}
              value={reviews.length}
              label="Recommendations"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatsCard
              icon={<IconPlaylist size={32} color="var(--mantine-color-grape-6)" />}
              value={bands.length}
              label="Bands Created"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatsCard
              icon={<IconUsers size={32} color="var(--mantine-color-grape-6)" />}
              value={0}
              label="Following"
            />
          </Grid.Col>
        </Grid>
      </Container>
      {/* Recent Recommendations */}
      <Container px={0} pb="md">
        <Group justify="space-between" align="center" mb="md">
          <Title order={3} c="blue.8">
            My Recommendations
          </Title>
          <ActionIcon
            component={Link}
            href="/user/create-review"
            variant="light"
            size="lg"
            radius="xl"
            color="blue"
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Group>

        {dataLoading ? (
          <Center py="md">
            <Loader size="sm" />
          </Center>
        ) : reviews.length === 0 ? (
          <Center py="xl">
            <Stack align="center">
              <IconMusic size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center">
                No recommendations yet. Share your favorite songs!
              </Text>
              <Button
                component={Link}
                href="/user/create-review"
                leftSection={<IconPlus size={16} />}
              >
                Write Your First Recommendation
              </Button>
            </Stack>
          </Center>
        ) : (
          <Stack>
            {reviews.slice(0, 5).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}

            {reviews.length > 5 && (
              <>
                <Divider />
                <Group justify="center">
                  <Text size="sm" c="dimmed">
                    Showing 5 of {reviews.length} recommendations
                  </Text>
                  <Button
                    component={Link}
                    href={`/users/${user?.username}`}
                    variant="subtle"
                    size="sm"
                  >
                    View All Recommendations
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Container>

      {/* Recently Played from Spotify */}
      {spotifyConnected && (
        <Container px={0} pb="lg">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3} c="blue.8">
              Recently Played Songs
            </Title>
            <Badge variant="light" color="green" leftSection={<IconMusic size={12} />}>
              From Spotify
            </Badge>
          </Group>

          {recentlyPlayedLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : !Array.isArray(recentlyPlayed) || recentlyPlayed.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No recently played tracks found. Start listening on Spotify!
                </Text>
              </Stack>
            </Center>
          ) : (
            <Stack>
              {(Array.isArray(recentlyPlayed) ? recentlyPlayed : [])
                .slice(0, 10)
                .map((track, index) => (
                  <Card key={`${track.id}-${index}`} p="md">
                    <Group justify="space-between" align="flex-start">
                      <Group>
                        {track.album?.images?.[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt={`${track.name} album art`}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 8,
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <Stack gap="xs">
                          <div>
                            <Title order={5}>{track.name}</Title>
                            <Text size="sm" c="dimmed">
                              {Array.isArray(track.artists)
                                ? track.artists
                                    .map((artist: any) =>
                                      typeof artist === 'string' ? artist : artist.name
                                    )
                                    .join(', ')
                                : track.artists}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {track.album?.name}
                            </Text>
                          </div>
                          <Text size="xs" c="dimmed">
                            Played {new Date(track.played_at).toLocaleString()}
                          </Text>
                        </Stack>
                      </Group>
                      <Group gap="xs">
                        <Button
                          component="a"
                          href={track.external_urls?.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="subtle"
                          size="xs"
                          color="green"
                          leftSection={<IconBrandSpotify size={14} />}
                        >
                          Open in Spotify
                        </Button>
                        <Button
                          component={Link}
                          href={`/user/create-review?${new URLSearchParams({
                            song_name: track.name || '',
                            band_name: Array.isArray(track.artists)
                              ? track.artists
                                  .map((artist: any) =>
                                    typeof artist === 'string' ? artist : artist.name
                                  )
                                  .join(', ')
                              : track.artists || '',
                            artwork_url: track.album?.images?.[0]?.url || '',
                            song_link: track.external_urls?.spotify || '',
                          }).toString()}`}
                          variant="filled"
                          size="xs"
                          color="grape"
                          leftSection={<IconPlus size={14} />}
                        >
                          Recommend
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                ))}

              {Array.isArray(recentlyPlayed) && recentlyPlayed.length > 10 && (
                <>
                  <Divider />
                  <Group justify="center">
                    <Text size="sm" c="dimmed">
                      Showing 10 of {recentlyPlayed.length} recently played tracks
                    </Text>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Container>
      )}

      {/* My Bands */}
      <Container px={0} pb="lg">
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>My Bands</Title>
            <Button
              component={Link}
              href="/user/create-band"
              size="sm"
              variant="outline"
              leftSection={<IconPlus size={14} />}
            >
              Add Band
            </Button>
          </Group>

          {dataLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : bands.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No bands yet. Create your first band to showcase your music!
                </Text>
                <Button
                  component={Link}
                  href="/user/create-band"
                  leftSection={<IconPlus size={16} />}
                >
                  Create Your First Band
                </Button>
              </Stack>
            </Center>
          ) : (
            <Grid>
              {bands.map((band) => (
                <BandCard key={band.id} band={band} />
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
    </Container>
  );
}
