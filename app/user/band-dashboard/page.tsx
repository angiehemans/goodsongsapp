'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconEdit,
  IconMusic,
  IconPlaylist,
  IconPlus,
  IconSettings,
  IconStar,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Container,
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

export default function BandDashboardPage() {
  const { user, isLoading, isOnboardingComplete, isFan } = useAuth();
  const router = useRouter();
  const [band, setBand] = useState<Band | null>(null);
  const [bandReviews, setBandReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

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

        // Fetch full band details including reviews
        const bandDetails = await apiClient.getBand(userBand.slug);
        setBandReviews(bandDetails.reviews || []);
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
                src={fixImageUrl(user.profile_image_url || band?.profile_picture_url)}
                color="grape.6"
              >
                {band?.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={2}>Welcome back{band ? `, ${band.name}` : ''}!</Title>
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
                <Badge mt="xs" variant="light" color="grape">
                  Band Account
                </Badge>
              </div>
            </Group>
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
        </Paper>

        {/* Band Section */}
        {dataLoading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : band ? (
          <>
            {/* Band Profile Card */}
            <Paper p="lg" radius="md">
              <Group justify="space-between" align="flex-start" mb="md">
                <Title order={3}>Your Band</Title>
                <Button
                  component={Link}
                  href={`/user/edit-band/${band.slug}`}
                  size="sm"
                  variant="outline"
                  leftSection={<IconEdit size={14} />}
                >
                  Edit Band
                </Button>
              </Group>

              <Group>
                {band.profile_picture_url ? (
                  <img
                    src={fixImageUrl(band.profile_picture_url)}
                    alt={band.name}
                    style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }}
                  />
                ) : (
                  <Avatar size={80} color="grape.6">
                    {band.name.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Stack gap="xs">
                  <Title order={4}>
                    <Link
                      href={`/bands/${band.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {band.name}
                    </Link>
                  </Title>
                  {(band.city || band.region || band.location) && (
                    <Text size="sm" c="dimmed">
                      {band.city || band.region
                        ? [band.city, band.region].filter(Boolean).join(', ')
                        : band.location}
                    </Text>
                  )}
                  {band.about && (
                    <Text size="sm" lineClamp={2}>
                      {band.about}
                    </Text>
                  )}
                  <Text
                    size="xs"
                    c="grape.6"
                    component={Link}
                    href={`/bands/${band.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    View public profile →
                  </Text>
                </Stack>
              </Group>
            </Paper>

            {/* Stats */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <StatsCard
                  icon={<IconStar size={32} color="var(--mantine-color-grape-6)" />}
                  value={bandReviews.length}
                  label="Recommendations from Fans"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <StatsCard
                  icon={<IconPlaylist size={32} color="var(--mantine-color-grape-6)" />}
                  value={band.reviews_count || 0}
                  label="Total Recommendations"
                />
              </Grid.Col>
            </Grid>

            {/* Recent Recommendations from Fans */}
            <Paper p="lg" radius="md">
              <Group justify="space-between" align="center" mb="md">
                <Title order={3} c="blue.8">
                  Fan Recommendations
                </Title>
                {bandReviews.length > 0 && (
                  <Badge variant="light" color="grape">
                    {bandReviews.length} recommendation{bandReviews.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </Group>

              {bandReviews.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" ta="center">
                      No recommendations yet. Share your band profile with fans to get recommendations!
                    </Text>
                    <Button
                      component={Link}
                      href={`/bands/${band.slug}`}
                      variant="light"
                    >
                      View Your Band Profile
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <Stack>
                  {bandReviews.slice(0, 5).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}

                  {bandReviews.length > 5 && (
                    <Group justify="center" mt="md">
                      <Text size="sm" c="dimmed">
                        Showing 5 of {bandReviews.length} recommendations
                      </Text>
                      <Button
                        component={Link}
                        href={`/bands/${band.slug}`}
                        variant="subtle"
                        size="sm"
                      >
                        View All
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}
            </Paper>

            {/* Streaming Links */}
            {(band.spotify_link || band.bandcamp_link || band.apple_music_link || band.youtube_music_link) && (
              <Paper p="lg" radius="md">
                <Title order={3} mb="md">
                  Your Streaming Links
                </Title>
                <Group>
                  {band.spotify_link && (
                    <Button
                      component="a"
                      href={band.spotify_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      color="green"
                      size="sm"
                    >
                      Spotify
                    </Button>
                  )}
                  {band.bandcamp_link && (
                    <Button
                      component="a"
                      href={band.bandcamp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      color="cyan"
                      size="sm"
                    >
                      Bandcamp
                    </Button>
                  )}
                  {band.apple_music_link && (
                    <Button
                      component="a"
                      href={band.apple_music_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      color="pink"
                      size="sm"
                    >
                      Apple Music
                    </Button>
                  )}
                  {band.youtube_music_link && (
                    <Button
                      component="a"
                      href={band.youtube_music_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outline"
                      color="red"
                      size="sm"
                    >
                      YouTube Music
                    </Button>
                  )}
                </Group>
              </Paper>
            )}
          </>
        ) : (
          /* No Band Yet - Prompt to Create */
          <Paper p="xl" radius="md">
            <Center>
              <Stack align="center" gap="lg">
                <IconMusic size={64} color="var(--mantine-color-grape-6)" />
                <Stack align="center" gap="xs">
                  <Title order={3}>Create Your Band Profile</Title>
                  <Text c="dimmed" ta="center" maw={400}>
                    Get started by creating your band profile. Fans will be able to find you and recommend your music to others.
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
        )}
      </Container>
    </Container>
  );
}
