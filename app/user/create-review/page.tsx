'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconAlertCircle, IconArrowLeft, IconBrandSpotify, IconMusic } from '@tabler/icons-react';
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, ReviewData } from '@/lib/api';
import classes from './reviews.module.css';

const aspectOptions = [
  { value: 'Vocals', label: 'Vocals' },
  { value: 'Lyrics', label: 'Lyrics' },
  { value: 'Melody', label: 'Melody' },
  { value: 'Beat', label: 'Beat' },
  { value: 'Production', label: 'Production' },
  { value: 'Instrumentation', label: 'Instrumentation' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Creativity', label: 'Creativity' },
];

function CreateReviewForm() {
  const { user, isLoading, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect band accounts - they cannot create reviews
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

  const [formData, setFormData] = useState<ReviewData>({
    song_link: '',
    band_name: '',
    song_name: '',
    artwork_url: '',
    review_text: '',
    liked_aspects: [],
  });

  // Prefill form from URL parameters when component mounts
  useEffect(() => {
    const songName = searchParams.get('song_name');
    const bandName = searchParams.get('band_name');
    const artworkUrl = searchParams.get('artwork_url');
    const songLink = searchParams.get('song_link');

    if (songName || bandName || artworkUrl || songLink) {
      setFormData((prev) => ({
        ...prev,
        song_name: songName || prev.song_name,
        band_name: bandName || prev.band_name,
        artwork_url: artworkUrl || prev.artwork_url,
        song_link: songLink || prev.song_link,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.createReview(formData);

      notifications.show({
        title: 'Recommendation created!',
        message: 'Your recommendation has been successfully submitted.',
        color: 'green',
      });

      router.push('/user/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!user || isBand) {
    return null;
  }

  return (
    <Container size="md" py="xl">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <Group>
              <IconMusic size={32} color="var(--mantine-color-grape-6)" />
              <Title order={1}>New Recommendation</Title>
            </Group>
            <Button
              component={Link}
              href="/user/dashboard"
              leftSection={<IconArrowLeft size={16} />}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </Group>
        </Paper>

        <Paper p="lg" radius="md">
          <Text size="sm" c="dimmed" mb="lg">
            Share your favorite songs and help others discover great music!
          </Text>

          {(searchParams.get('song_name') || searchParams.get('band_name')) && (
            <Alert
              icon={<IconBrandSpotify size="1rem" />}
              title="Prefilled from Spotify"
              color="green"
              variant="light"
              mb="lg"
            >
              This form has been prefilled with track information from your recently played songs.
            </Alert>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Song Link"
                placeholder="https://spotify.com/track/123"
                required
                value={formData.song_link}
                onChange={(e) => setFormData({ ...formData, song_link: e.target.value })}
              />

              <Group grow>
                <TextInput
                  label="Band/Artist Name"
                  placeholder="The Beatles"
                  required
                  value={formData.band_name}
                  onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                />

                <TextInput
                  label="Song Name"
                  placeholder="Hey Jude"
                  required
                  value={formData.song_name}
                  onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                />
              </Group>

              <TextInput
                label="Artwork URL"
                placeholder="https://image.url/cover.jpg"
                value={formData.artwork_url}
                onChange={(e) => setFormData({ ...formData, artwork_url: e.target.value })}
              />

              <MultiSelect
                label="What did you like about this song?"
                placeholder="Select aspects you enjoyed"
                data={aspectOptions}
                value={formData.liked_aspects.map((aspect) =>
                  typeof aspect === 'string' ? aspect : aspect.name
                )}
                onChange={(values) =>
                  setFormData({
                    ...formData,
                    liked_aspects: values as (string | { name: string })[],
                  })
                }
                classNames={{
                  option: classes.option,
                }}
              />

              <Textarea
                label="Your Recommendation"
                placeholder="Share why you love this song..."
                minRows={4}
                required
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              />

              <Group justify="flex-end">
                <Button component={Link} href="/user/dashboard" variant="outline">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!formData.song_name || !formData.band_name || !formData.review_text}
                >
                  Create Recommendation
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}

export default function CreateReviewPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <Center py="xl">
            <Loader />
          </Center>
        </Container>
      }
    >
      <CreateReviewForm />
    </Suspense>
  );
}
