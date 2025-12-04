'use client';

import { useState } from 'react';
import { IconAlertCircle, IconBrandSpotify } from '@tabler/icons-react';
import {
  Alert,
  Button,
  Group,
  MultiSelect,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiClient, ReviewData } from '@/lib/api';
import classes from './RecommendationForm.module.css';

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

export interface RecommendationFormProps {
  /** Initial values to prefill the form */
  initialValues?: Partial<ReviewData>;
  /** Called when the form is successfully submitted */
  onSuccess?: () => void;
  /** Called when the user cancels */
  onCancel?: () => void;
  /** Whether to show the prefilled alert */
  showPrefilledAlert?: boolean;
}

export function RecommendationForm({
  initialValues,
  onSuccess,
  onCancel,
  showPrefilledAlert = false,
}: RecommendationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReviewData>({
    song_link: initialValues?.song_link || '',
    band_name: initialValues?.band_name || '',
    song_name: initialValues?.song_name || '',
    artwork_url: initialValues?.artwork_url || '',
    review_text: initialValues?.review_text || '',
    liked_aspects: initialValues?.liked_aspects || [],
  });

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

      // Reset form
      setFormData({
        song_link: '',
        band_name: '',
        song_name: '',
        artwork_url: '',
        review_text: '',
        liked_aspects: [],
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Share your favorite songs and help others discover great music!
      </Text>

      {showPrefilledAlert && (initialValues?.song_name || initialValues?.band_name) && (
        <Alert
          icon={<IconBrandSpotify size="1rem" />}
          title="Prefilled from Spotify"
          color="green"
          variant="light"
        >
          This form has been prefilled with track information from your recently played songs.
        </Alert>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
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
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
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
    </Stack>
  );
}
