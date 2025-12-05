'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconMusic,
  IconPlus,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FollowingFeed } from '@/components/FollowingFeed/FollowingFeed';
import { RecommendationForm } from '@/components/RecommendationForm/RecommendationForm';
import { SpotifyConnection } from '@/components/SpotifyConnection/SpotifyConnection';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(true);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);
  const recentlyPlayedRef = useRef<HTMLDivElement>(null);

  // Drawer state for new recommendation
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [formPrefill, setFormPrefill] = useState<{
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
    song_link?: string;
  } | null>(null);

  // Check Spotify connection status
  const checkSpotifyConnection = useCallback(async () => {
    if (!user) return;
    setSpotifyLoading(true);
    try {
      const status = await apiClient.getSpotifyStatus();
      setSpotifyConnected(status.connected);
    } catch {
      setSpotifyConnected(false);
    } finally {
      setSpotifyLoading(false);
    }
  }, [user]);

  // Handle Spotify connection change from the SpotifyConnection component
  const handleSpotifyConnectionChange = (connected: boolean) => {
    setSpotifyConnected(connected);
    if (connected) {
      fetchSpotifyData();
    }
  };

  // Fetch Spotify data
  const fetchSpotifyData = useCallback(async () => {
    if (!user || !spotifyConnected) return;

    setRecentlyPlayedLoading(true);
    try {
      const tracks = await apiClient.getRecentlyPlayed();
      const tracksArray = Array.isArray(tracks)
        ? tracks
        : (tracks as any)?.tracks || (tracks as any)?.items || [];
      setRecentlyPlayed(tracksArray);
    } catch {
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, [user, spotifyConnected]);

  useEffect(() => {
    if (user) {
      checkSpotifyConnection();
    }
  }, [user, checkSpotifyConnection]);

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
  };

  return (
    <>
      {/* Spotify Section */}
      {spotifyLoading ? (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      ) : !spotifyConnected ? (
        <SpotifyConnection onConnectionChange={handleSpotifyConnectionChange} />
      ) : (
        <>
          <Group justify="space-between" align="center" my="md" maw={700}>
            <Group gap="xs">
              <Title order={2} c="blue.8" fw={500}>
                Recently Played
              </Title>
            </Group>
            {Array.isArray(recentlyPlayed) && recentlyPlayed.length > 0 && (
              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    if (recentlyPlayedRef.current) {
                      recentlyPlayedRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                    }
                  }}
                >
                  <IconChevronLeft size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    if (recentlyPlayedRef.current) {
                      recentlyPlayedRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                    }
                  }}
                >
                  <IconChevronRight size={20} />
                </ActionIcon>
              </Group>
            )}
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
            <Box
              ref={recentlyPlayedRef}
              style={{
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                maxWidth: 700,
                width: '100%',
              }}
            >
              <Group gap="sm" wrap="nowrap" pb={8}>
                {recentlyPlayed.slice(0, 12).map((track, index) => (
                  <Card
                    key={`${track.id}-${index}`}
                    p="xs"
                    withBorder
                    style={{ width: 144, flexShrink: 0 }}
                  >
                    <Card.Section>
                      {track.album?.images?.[0] ? (
                        <img
                          src={track.album.images[0].url}
                          alt={`${track.name} album art`}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Center
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            backgroundColor: 'var(--mantine-color-gray-2)',
                          }}
                        >
                          <IconMusic size={32} color="var(--mantine-color-gray-5)" />
                        </Center>
                      )}
                    </Card.Section>
                    <Stack gap={4} mt="xs">
                      <Text size="sm" fw={500} lineClamp={1}>
                        {track.name}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {Array.isArray(track.artists)
                          ? track.artists
                              .map((artist: any) =>
                                typeof artist === 'string' ? artist : artist.name
                              )
                              .join(', ')
                          : track.artists}
                      </Text>
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
                        variant="light"
                        size="xs"
                        color="grape"
                        fullWidth
                        mt={4}
                        leftSection={<IconPlus size={14} />}
                      >
                        Recommend
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </Group>
            </Box>
          )}
        </>
      )}

      {/* Following Feed */}
      <FollowingFeed title="From People You Follow" />

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
    </>
  );
}
