'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconRefresh,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { LastFmConnection } from '@/components/LastFmConnection/LastFmConnection';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, RecentlyPlayedTrack } from '@/lib/api';

interface RecentlyPlayedProps {
  onRecommendTrack: (prefill: {
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
  }) => void;
}

export function RecentlyPlayed({ onRecommendTrack }: RecentlyPlayedProps) {
  const { user } = useAuth();
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [refreshingArtworkId, setRefreshingArtworkId] = useState<number | string | null>(null);

  const fetchRecentlyPlayed = useCallback(async (silent = false) => {
    if (!user) return;

    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await apiClient.getRecentlyPlayed();
      setRecentlyPlayed(response.tracks || []);
    } catch {
      setRecentlyPlayed([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecentlyPlayed();
    }
  }, [user, fetchRecentlyPlayed]);

  const handleLastFmConnectionChange = (connected: boolean) => {
    if (connected) {
      fetchRecentlyPlayed();
    }
  };

  const getScrobbleId = (track: RecentlyPlayedTrack): number | string | undefined => {
    return track.scrobble_id ?? track.id;
  };

  const handleRefreshArtwork = async (scrobbleId: number | string, trackName: string) => {
    setRefreshingArtworkId(scrobbleId);
    try {
      const response = await apiClient.refreshScrobbleArtwork(scrobbleId);
      if (response.status === 'success' && response.artwork_url) {
        notifications.show({
          title: 'Artwork found',
          message: `Found artwork for "${trackName}"`,
          color: 'green',
        });
        // Rehydrate the component with fresh data (silent to avoid loader flash)
        fetchRecentlyPlayed(true);
      } else if (response.status === 'not_found') {
        notifications.show({
          title: 'No artwork found',
          message: `Could not find artwork for "${trackName}"`,
          color: 'yellow',
        });
      } else {
        notifications.show({
          title: 'Artwork refreshed',
          message: response.message,
          color: 'blue',
        });
        // Rehydrate the component with fresh data (silent to avoid loader flash)
        fetchRecentlyPlayed(true);
      }
    } catch (error: any) {
      const message = error?.message || error?.error || String(error) || 'Failed to refresh artwork';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setRefreshingArtworkId(null);
    }
  };

  if (loading) {
    return (
      <Center py="md">
        <Loader size="sm" />
      </Center>
    );
  }

  if (!Array.isArray(recentlyPlayed) || recentlyPlayed.length === 0) {
    return (
      <Box my="md">
        <LastFmConnection onConnectionChange={handleLastFmConnectionChange} />
      </Box>
    );
  }

  return (
    <>
      <Group justify="space-between" align="center" my="md" maw={700}>
        <Group gap="xs">
          <Title order={2} c="blue.8" fw={500}>
            Recently Played
          </Title>
        </Group>
        <Group gap={4}>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
              }
            }}
          >
            <IconChevronLeft size={20} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
              }
            }}
          >
            <IconChevronRight size={20} />
          </ActionIcon>
        </Group>
      </Group>

      <Box
        ref={scrollRef}
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
              key={`${track.name}-${track.artist}-${index}`}
              p="xs"
              withBorder
              style={{ width: 144, flexShrink: 0 }}
            >
              <Card.Section style={{ position: 'relative' }}>
                {track.album_art_url ? (
                  <img
                    src={track.album_art_url}
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
                      backgroundColor: 'var(--mantine-color-grape-1)',
                    }}
                  >
                    <img
                      src="/logo-grape.svg"
                      alt="Good Songs"
                      width={48}
                      height={48}
                      style={{ opacity: 0.8 }}
                    />
                  </Center>
                )}
                {!track.album_art_url && track.can_refresh_artwork && (
                  <ActionIcon
                    variant="filled"
                    size="sm"
                    radius="xl"
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 'var(--mantine-spacing-md)',
                      backgroundColor: 'var(--mantine-color-grape-2)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const scrobbleId = getScrobbleId(track);
                      if (scrobbleId) {
                        handleRefreshArtwork(scrobbleId, track.name);
                      }
                    }}
                    loading={refreshingArtworkId === getScrobbleId(track)}
                    disabled={refreshingArtworkId !== null}
                    title="Search for artwork"
                  >
                    <IconRefresh size={14} color="var(--mantine-color-grape-8)" />
                  </ActionIcon>
                )}
              </Card.Section>
              <Stack gap={4} mt="xs">
                <Text size="sm" fw={500} lineClamp={1}>
                  {track.name}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {track.artist}
                </Text>
                <Button
                  onClick={() => {
                    onRecommendTrack({
                      song_name: track.name || '',
                      band_name: track.artist || '',
                      artwork_url: track.album_art_url || '',
                    });
                  }}
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
    </>
  );
}
