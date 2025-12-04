'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconMusic, IconPlus } from '@tabler/icons-react';
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
import { notifications } from '@mantine/notifications';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { Header } from '@/components/Header/Header';
import { MusicPlayer } from '@/components/MusicPlayer/MusicPlayer';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band, Review } from '@/lib/api';
import styles from './page.module.css';

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
        setBand(bandDetails);
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

  const handleBandSaved = (updatedBand: Band) => {
    setBand(updatedBand);
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
        <Flex direction="column" px="md" pb="lg" flex={1}>
          {/* Music Player */}
          {band && (
            <MusicPlayer
              bandcampLink={band.bandcamp_link}
              spotifyLink={band.spotify_link}
              youtubeMusicLink={band.youtube_music_link}
              appleMusicLink={band.apple_music_link}
              className={styles.musicPlayer}
            />
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
    </Container>
  );
}
