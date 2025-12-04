'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconBrandSpotify,
  IconMusic,
  IconPlus,
  IconSettings,
  IconShield,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Drawer,
  Flex,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { RecommendationForm } from '@/components/RecommendationForm/RecommendationForm';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Review } from '@/lib/api';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, isLoading, isOnboardingComplete, isBand, isAdmin } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);

  // Drawer state for new recommendation
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [formPrefill, setFormPrefill] = useState<{
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
    song_link?: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && isBand) {
      router.push('/user/band-dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isBand, router]);

  // Fetch user reviews
  const fetchCoreData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);

    try {
      const userReviews = await apiClient.getUserReviews();
      setReviews(userReviews);
    } catch {
      // Silently fail for reviews as endpoint might not exist yet
      setReviews([]);
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

  // Drawer handlers
  const handleOpenNewRecommendation = (prefill?: typeof formPrefill) => {
    setFormPrefill(prefill || null);
    openDrawer();
  };

  const handleRecommendationSuccess = () => {
    closeDrawer();
    setFormPrefill(null);
    // Refresh reviews list
    fetchCoreData();
  };

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

  return (
    <Container p={0} fluid className={styles.container}>
      {/* Header */}
      <Container fluid p="md" className={styles.header}>
        <Group justify="space-between" align="center">
          <Link href="/user/dashboard" className={styles.headerLink}>
            <Title order={2} c="blue.9">
              goodsongs
            </Title>
          </Link>
          <Group gap="xs">
            {isAdmin && (
              <ActionIcon component={Link} href="/admin" variant="subtle" size="lg" color="red">
                <IconShield size={24} />
              </ActionIcon>
            )}
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
      </Container>

      <Flex className={styles.content}>
        {/* User Sidebar */}
        <UserSidebar
          badgeText={`${reviews.length} recommendation${reviews.length !== 1 ? 's' : ''}`}
          actionButtons={
            <Button
              onClick={() => handleOpenNewRecommendation()}
              leftSection={<IconPlus size={16} />}
            >
              New Recommendation
            </Button>
          }
        />

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg">
          {/* My Recommendations */}
          <Title order={2} my="sm" c="blue.8" fw={500}>
            My Recommendations
          </Title>

          {dataLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : reviews.length === 0 ? (
            <Paper p="lg" radius="md">
              <Center py="xl">
                <Stack align="center">
                  <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    No recommendations yet. Share your favorite songs!
                  </Text>
                  <Button
                    onClick={() => handleOpenNewRecommendation()}
                    leftSection={<IconPlus size={16} />}
                  >
                    Write Your First Recommendation
                  </Button>
                </Stack>
              </Center>
            </Paper>
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

          {/* Recently Played from Spotify */}
          {spotifyConnected && (
            <>
              <Group justify="space-between" align="center" mt="xl" mb="md">
                <Title order={2} c="blue.8" fw={500}>
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
                              onClick={() =>
                                handleOpenNewRecommendation({
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
                                })
                              }
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
            </>
          )}
        </Flex>
      </Flex>

      {/* New Recommendation Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={() => {
          closeDrawer();
          setFormPrefill(null);
        }}
        title={
          <Text size="xl" fw={600} c="blue.8">
            New Recommendation
          </Text>
        }
        position="right"
        size="lg"
        styles={{
          body: { paddingTop: 0 },
        }}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <RecommendationForm
          initialValues={formPrefill || undefined}
          onSuccess={handleRecommendationSuccess}
          onCancel={() => {
            closeDrawer();
            setFormPrefill(null);
          }}
          showPrefilledAlert={!!formPrefill?.song_name || !!formPrefill?.band_name}
        />
      </Drawer>
    </Container>
  );
}
