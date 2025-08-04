'use client';

import { useEffect, useState, useCallback, memo, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Avatar,
  Card,
  Grid,
  Badge,
  Center,
  Loader,
  Rating,
  Divider,
  Skeleton,
} from '@mantine/core';
import { IconMusic, IconPlaylist, IconUsers, IconLogout, IconPlus, IconBrandSpotify } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, Band, Review } from '@/lib/api';

// Lazy load heavy components
const SpotifyConnection = lazy(() => 
  import('@/components/SpotifyConnection/SpotifyConnection').then(mod => ({ 
    default: mod.SpotifyConnection 
  }))
);

const ProfileSettings = lazy(() => 
  import('@/components/ProfileSettings/ProfileSettings').then(mod => ({ 
    default: mod.ProfileSettings 
  }))
);

// Memoized components for better performance
const StatsCard = memo(({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
  <Card p="lg" radius="md">
    <Group>
      {icon}
      <div>
        <Text size="xl" fw={700}>{value}</Text>
        <Text size="sm" c="dimmed">{label}</Text>
      </div>
    </Group>
  </Card>
));

const BandCard = memo(({ band }: { band: Band }) => (
  <Grid.Col key={band.id} span={{ base: 12, sm: 6, md: 4 }}>
    <Card component={Link} href={`/bands/${band.slug}`} p="md" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Group>
        {band.profile_picture_url ? (
          <img
            src={band.profile_picture_url}
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
              {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''}
            </Badge>
            {band.location && (
              <Text size="xs" c="dimmed">{band.location}</Text>
            )}
          </Group>
        </Stack>
      </Group>
    </Card>
  </Grid.Col>
));

const ReviewCard = memo(({ review }: { review: Review }) => (
  <Card key={review.id} p="md">
    <Group justify="space-between" align="flex-start">
      <Group>
        {review.artwork_url && (
          <img
            src={review.artwork_url}
            alt={`${review.song_name} artwork`}
            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
          />
        )}
        <Stack gap="xs">
          <div>
            <Title order={5}>{review.song_name}</Title>
            <Text size="sm" c="dimmed">{review.band_name}</Text>
          </div>
          <Text size="sm" lineClamp={2}>
            {review.review_text}
          </Text>
          {review.liked_aspects.length > 0 && (
            <Group gap="xs">
              {review.liked_aspects.slice(0, 3).map((aspect, index) => (
                <Badge key={index} size="sm" variant="light" color="grape">
                  {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                </Badge>
              ))}
              {review.liked_aspects.length > 3 && (
                <Text size="xs" c="dimmed">+{review.liked_aspects.length - 3} more</Text>
              )}
            </Group>
          )}
        </Stack>
      </Group>
      <Group align="center" gap="xs">
        <Rating value={review.overall_rating} readOnly size="sm" />
        <Text size="sm" c="dimmed">
          {review.overall_rating}/5
        </Text>
      </Group>
    </Group>
  </Card>
));

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
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
        apiClient.getUserReviews()
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

  // Fetch Spotify data separately (non-blocking)
  const fetchSpotifyData = useCallback(async () => {
    if (!user || !spotifyConnected) {
      return;
    }
    
    setRecentlyPlayedLoading(true);
    
    try {
      const tracks = await apiClient.getRecentlyPlayed();
      const tracksArray = Array.isArray(tracks) ? tracks : ((tracks as any)?.tracks || (tracks as any)?.items || []);
      setRecentlyPlayed(tracksArray);
    } catch (error) {
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, [user, spotifyConnected]);

  // Load core data immediately when user is available
  useEffect(() => {
    if (user) {
      fetchCoreData();
    }
  }, [user, fetchCoreData]);

  // Load Spotify data when connection status changes
  useEffect(() => {
    if (user && spotifyConnected) {
      fetchSpotifyData();
    }
  }, [user, spotifyConnected, fetchSpotifyData]);

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

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
    <Container size="lg" py="xl">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between">
            <Group>
              <Avatar 
                size="lg" 
                src={user.profile_image_url}
                color="grape.6"
                component={Link}
                href={`/users/${user.username}`}
                style={{ cursor: 'pointer' }}
              >
                {!user.profile_image_url && user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={2}>Welcome back, {user.username}!</Title>
                <Text size="sm" c="dimmed">{user.email}</Text>
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
            <Button
              leftSection={<IconLogout size={16} />}
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Paper>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <StatsCard
              icon={<IconMusic size={32} color="var(--mantine-color-grape-6)" />}
              value={reviews.length}
              label="Reviews Written"
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

        {/* Profile Settings - Lazy loaded */}
        <Suspense fallback={
          <Paper p="lg" radius="md">
            <Stack>
              <Group>
                <Skeleton height={20} width={120} />
              </Group>
              <Group>
                <Skeleton height={80} width={80} radius="xl" />
                <Stack flex={1}>
                  <Skeleton height={20} width="60%" />
                  <Skeleton height={20} width="40%" />
                </Stack>
              </Group>
              <Skeleton height={80} />
              <Group justify="flex-end">
                <Skeleton height={36} width={80} />
                <Skeleton height={36} width={120} />
              </Group>
            </Stack>
          </Paper>
        }>
          <ProfileSettings />
        </Suspense>

        {/* Spotify Connection - Lazy loaded */}
        <Suspense fallback={
          <Paper p="md" radius="md">
            <Group>
              <Skeleton height={20} width={20} radius="xl" />
              <Skeleton height={20} width={200} />
            </Group>
          </Paper>
        }>
          <SpotifyConnection onConnectionChange={setSpotifyConnected} />
        </Suspense>

        {/* Quick Actions */}
        <Paper p="lg" radius="md">
          <Title order={3} mb="md">Quick Actions</Title>
          <Group>
            <Button component={Link} href="/user/create-review" variant="filled">
              Create Review
            </Button>
            <Button 
              component={Link} 
              href="/user/create-band" 
              variant="filled" 
              color="grape.7"
              leftSection={<IconPlus size={16} />}
            >
              Create Band
            </Button>
            <Button variant="outline">Discover Music</Button>
          </Group>
        </Paper>

        {/* My Bands */}
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

        {/* Recent Reviews */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>Recent Reviews</Title>
            <Button 
              component={Link} 
              href="/user/create-review" 
              size="sm" 
              variant="outline"
              leftSection={<IconPlus size={14} />}
            >
              Write Review
            </Button>
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
                  No reviews yet. Share your thoughts about your favorite songs!
                </Text>
                <Button 
                  component={Link} 
                  href="/user/create-review"
                  leftSection={<IconPlus size={16} />}
                >
                  Write Your First Review
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
                      Showing 5 of {reviews.length} reviews
                    </Text>
                    <Button 
                      component={Link} 
                      href={`/users/${user?.username}`}
                      variant="subtle" 
                      size="sm"
                    >
                      View All Reviews
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Paper>

        {/* Recently Played from Spotify */}
        {spotifyConnected && (
          <Paper p="lg" radius="md">
            <Group justify="space-between" align="center" mb="md">
              <Title order={3}>Recently Played on Spotify</Title>
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
                {(Array.isArray(recentlyPlayed) ? recentlyPlayed : []).slice(0, 10).map((track, index) => (
                  <Card key={`${track.id}-${index}`} p="md">
                    <Group justify="space-between" align="flex-start">
                      <Group>
                        {track.album?.images?.[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt={`${track.name} album art`}
                            style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                          />
                        )}
                        <Stack gap="xs">
                          <div>
                            <Title order={5}>{track.name}</Title>
                            <Text size="sm" c="dimmed">
                              {Array.isArray(track.artists) 
                                ? track.artists.map((artist: any) => typeof artist === 'string' ? artist : artist.name).join(', ')
                                : track.artists
                              }
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
                              ? track.artists.map((artist: any) => typeof artist === 'string' ? artist : artist.name).join(', ')
                              : track.artists || '',
                            artwork_url: track.album?.images?.[0]?.url || '',
                            song_link: track.external_urls?.spotify || ''
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
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
