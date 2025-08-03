'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  TextInput,
  Textarea,
  Rating,
  MultiSelect,
  Group,
  Alert,
  Loader,
  Center,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconBrandSpotify } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, ReviewData } from '@/lib/api';

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
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReviewData>({
    song_link: '',
    band_name: '',
    song_name: '',
    artwork_url: '',
    review_text: '',
    overall_rating: 0,
    liked_aspects: [],
  });

  // Prefill form from URL parameters when component mounts
  useEffect(() => {
    const songName = searchParams.get('song_name');
    const bandName = searchParams.get('band_name');
    const artworkUrl = searchParams.get('artwork_url');
    const songLink = searchParams.get('song_link');

    if (songName || bandName || artworkUrl || songLink) {
      setFormData(prev => ({
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
        title: 'Review created!',
        message: 'Your review has been successfully submitted.',
        color: 'green',
      });

      router.push('/user/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Text>Please log in to create a review.</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack>
        <Group>
          <Button
            component={Link}
            href="/user/dashboard"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            Back to Dashboard
          </Button>
        </Group>

        <Paper withBorder p="lg" radius="md">
          <Title order={2} mb="md">Create a Review</Title>
          <Text size="sm" c="dimmed" mb="lg">
            Share your thoughts about a song and help others discover great music!
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
            <Alert 
              icon={<IconAlertCircle size="1rem" />} 
              title="Error" 
              color="red" 
              mb="md"
            >
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

              <div>
                <Text size="sm" fw={500} mb="xs">Overall Rating</Text>
                <Rating
                  value={formData.overall_rating}
                  onChange={(value) => setFormData({ ...formData, overall_rating: value })}
                  size="lg"
                />
              </div>

              <MultiSelect
                label="What did you like about this song?"
                placeholder="Select aspects you enjoyed"
                data={aspectOptions}
                value={formData.liked_aspects.map(aspect => typeof aspect === 'string' ? aspect : aspect.name)}
                onChange={(values) => setFormData({ ...formData, liked_aspects: values as (string | { name: string })[] })}
              />

              <Textarea
                label="Your Review"
                placeholder="Share your thoughts about this song..."
                minRows={4}
                required
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              />

              <Group justify="flex-end">
                <Button
                  component={Link}
                  href="/user/dashboard"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!formData.song_name || !formData.band_name || !formData.review_text}
                >
                  Create Review
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
    <Suspense fallback={
      <Container>
        <Center py="xl">
          <Loader />
        </Center>
      </Container>
    }>
      <CreateReviewForm />
    </Suspense>
  );
}