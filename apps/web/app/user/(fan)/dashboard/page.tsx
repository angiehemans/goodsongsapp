'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
  IconMail,
  IconMusic,
  IconPlus,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
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
import { notifications } from '@mantine/notifications';
import { FollowingFeed } from '@/components/FollowingFeed/FollowingFeed';
import { LastFmConnection } from '@/components/LastFmConnection/LastFmConnection';
import { RecommendationForm } from '@/components/RecommendationForm/RecommendationForm';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, RecentlyPlayedTrack } from '@/lib/api';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);
  const [lastFmConnected, setLastFmConnected] = useState(false);
  const [lastFmLoading, setLastFmLoading] = useState(true);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);
  const recentlyPlayedRef = useRef<HTMLDivElement>(null);

  // Email confirmation resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Drawer state for new recommendation
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [formPrefill, setFormPrefill] = useState<{
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
    song_link?: string;
    band_lastfm_artist_name?: string;
    band_musicbrainz_id?: string;
  } | null>(null);

  // Check Last.fm connection status
  const checkLastFmConnection = useCallback(async () => {
    if (!user) return;
    setLastFmLoading(true);
    try {
      const status = await apiClient.getLastFmStatus();
      setLastFmConnected(status.connected);
    } catch {
      setLastFmConnected(false);
    } finally {
      setLastFmLoading(false);
    }
  }, [user]);

  // Handle Last.fm connection change from the LastFmConnection component
  const handleLastFmConnectionChange = (connected: boolean) => {
    setLastFmConnected(connected);
    if (connected) {
      fetchLastFmData();
    }
  };

  // Fetch Last.fm data
  const fetchLastFmData = useCallback(async () => {
    if (!user || !lastFmConnected) return;

    setRecentlyPlayedLoading(true);
    try {
      const response = await apiClient.getRecentlyPlayed();
      setRecentlyPlayed(response.tracks || []);
    } catch {
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, [user, lastFmConnected]);

  useEffect(() => {
    if (user) {
      checkLastFmConnection();
    }
  }, [user, checkLastFmConnection]);

  useEffect(() => {
    if (user && lastFmConnected) {
      fetchLastFmData();
    }
  }, [user, lastFmConnected, fetchLastFmData]);

  // Countdown timer for email resend retry
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      notifications.show({
        title: 'Email sent',
        message: response.message || 'Confirmation email has been sent.',
        color: 'green',
      });
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send confirmation email';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = user?.can_resend_confirmation && retryAfter === 0;

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
      {/* Email Confirmation Warning */}
      {user && user.email_confirmed === false && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Please confirm your email address"
          color="orange"
          mb="md"
          maw={700}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm">
              We sent a confirmation email to {user.email}. Please check your inbox and click the
              link to confirm your account.
            </Text>
            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconMail size={14} />}
              onClick={handleResendConfirmation}
              loading={resendLoading}
              disabled={!canResend}
            >
              {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend email'}
            </Button>
          </Group>
        </Alert>
      )}

      {/* Last.fm Section */}
      {lastFmLoading ? (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      ) : !lastFmConnected ? (
        <Box my="md">
          <LastFmConnection onConnectionChange={handleLastFmConnectionChange} />
        </Box>
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
            <Center py="md" maw={700}>
              <Loader size="sm" />
            </Center>
          ) : !Array.isArray(recentlyPlayed) || recentlyPlayed.length === 0 ? (
            <Center py="xl" maw={700}>
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No recently played tracks found. Start listening on Last.fm!
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
                {recentlyPlayed.slice(0, 12).map((track, index) => {
                  // Get the largest available album image
                  const albumImage =
                    track.album?.images?.find((img) => img.size === 'extralarge') ||
                    track.album?.images?.find((img) => img.size === 'large') ||
                    track.album?.images?.[0];
                  const artistNames = track.artists?.map((a) => a.name).join(', ') || '';

                  return (
                    <Card
                      key={`${track.mbid || track.name}-${index}`}
                      p="xs"
                      withBorder
                      style={{ width: 144, flexShrink: 0 }}
                    >
                      <Card.Section>
                        {albumImage?.url ? (
                          <img
                            src={albumImage.url}
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
                          {artistNames}
                        </Text>
                        <Button
                          onClick={() => {
                            const primaryArtist = track.artists?.[0];
                            handleOpenNewRecommendation({
                              song_name: track.name || '',
                              band_name: artistNames,
                              artwork_url: albumImage?.url || '',
                              song_link: track.lastfm_url || '',
                              band_lastfm_artist_name: primaryArtist?.name,
                              band_musicbrainz_id: primaryArtist?.mbid,
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
                  );
                })}
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
        title="New Recommendation"
        position="right"
        size="lg"
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
