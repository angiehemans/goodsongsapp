'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconAlertCircle, IconArrowLeft, IconBrandLastfm, IconMusic } from '@tabler/icons-react';
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

  // Edit mode detection
  const reviewId = searchParams.get('reviewId');
  const isEditMode = !!reviewId;
  const username = searchParams.get('username');

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
    band_lastfm_artist_name: undefined,
    band_musicbrainz_id: undefined,
  });

  // Prefill form from URL parameters when component mounts
  useEffect(() => {
    const songName = searchParams.get('song_name');
    const bandName = searchParams.get('band_name');
    const artworkUrl = searchParams.get('artwork_url');
    const songLink = searchParams.get('song_link');
    const bandLastfmArtistName = searchParams.get('band_lastfm_artist_name');
    const bandMusicbrainzId = searchParams.get('band_musicbrainz_id');
    // Edit mode fields
    const reviewText = searchParams.get('review_text');
    const likedAspectsParam = searchParams.get('liked_aspects');
    const likedAspects = likedAspectsParam ? likedAspectsParam.split(',') : [];

    if (songName || bandName || artworkUrl || songLink || bandLastfmArtistName || bandMusicbrainzId || reviewText || likedAspectsParam) {
      setFormData((prev) => ({
        ...prev,
        song_name: songName || prev.song_name,
        band_name: bandName || prev.band_name,
        artwork_url: artworkUrl || prev.artwork_url,
        song_link: songLink || prev.song_link,
        band_lastfm_artist_name: bandLastfmArtistName || prev.band_lastfm_artist_name,
        band_musicbrainz_id: bandMusicbrainzId || prev.band_musicbrainz_id,
        review_text: reviewText || prev.review_text,
        liked_aspects: likedAspects.length > 0 ? likedAspects : prev.liked_aspects,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && reviewId) {
        // Update existing review
        await apiClient.updateReview(parseInt(reviewId, 10), {
          review_text: formData.review_text,
          liked_aspects: formData.liked_aspects.length > 0
            ? formData.liked_aspects.map(a => typeof a === 'string' ? a : a.name)
            : undefined,
          artwork_url: formData.artwork_url || undefined,
        });

        notifications.show({
          title: 'Recommendation updated!',
          message: 'Your changes have been saved.',
          color: 'green',
        });

        // Navigate back to review detail
        router.push(`/users/${username}/reviews/${reviewId}`);
      } else {
        // Create new review
        await apiClient.createReview(formData);

        notifications.show({
          title: 'Recommendation created!',
          message: 'Your recommendation has been successfully submitted.',
          color: 'green',
        });

        router.push('/user/dashboard');
      }
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
    <Container size="sm" py="xl">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <Group>
              <IconMusic size={32} color="var(--mantine-color-grape-6)" />
              <Title order={1}>{isEditMode ? 'Edit Recommendation' : 'New Recommendation'}</Title>
            </Group>
            <Button
              component={Link}
              href={isEditMode ? `/users/${username}/reviews/${reviewId}` : '/user/dashboard'}
              leftSection={<IconArrowLeft size={16} />}
              variant="outline"
            >
              {isEditMode ? 'Cancel' : 'Back to Dashboard'}
            </Button>
          </Group>
        </Paper>

        <Paper p="lg" radius="md">
          {!isEditMode && (
            <Text size="sm" c="dimmed" mb="lg">
              Share your favorite songs and help others discover great music!
            </Text>
          )}

          {!isEditMode && (searchParams.get('song_name') || searchParams.get('band_name')) && (
            <Alert
              icon={<IconBrandLastfm size="1rem" />}
              title="Prefilled from Last.fm"
              color="red"
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
              {/* Song fields are disabled in edit mode */}
              <TextInput
                label="Song Link"
                placeholder="https://www.last.fm/music/Artist/_/Song"
                required={!isEditMode}
                value={formData.song_link}
                onChange={(e) => setFormData({ ...formData, song_link: e.target.value })}
                disabled={isEditMode}
              />

              <Group grow>
                <TextInput
                  label="Band/Artist Name"
                  placeholder="The Beatles"
                  required={!isEditMode}
                  value={formData.band_name}
                  onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                  disabled={isEditMode}
                />

                <TextInput
                  label="Song Name"
                  placeholder="Hey Jude"
                  required={!isEditMode}
                  value={formData.song_name}
                  onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                  disabled={isEditMode}
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
                <Button
                  component={Link}
                  href={isEditMode ? `/users/${username}/reviews/${reviewId}` : '/user/dashboard'}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!formData.review_text || (!isEditMode && (!formData.song_name || !formData.band_name))}
                >
                  {isEditMode ? 'Save Changes' : 'Create Recommendation'}
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
