'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Stack,
  TextInput,
  Textarea,
  Group,
  Alert,
  FileInput,
  Grid,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconUpload, IconMusic } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, BandData } from '@/lib/api';

export default function CreateBandPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BandData>({
    name: '',
    slug: '',
    location: '',
    about: '',
    spotify_link: '',
    bandcamp_link: '',
    apple_music_link: '',
    youtube_music_link: '',
    profile_picture: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const band = await apiClient.createBand(formData);

      notifications.show({
        title: 'Band created!',
        message: `${band.name} has been successfully created.`,
        color: 'green',
      });

      router.push(`/bands/${band.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Text>Please log in to create a band.</Text>
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

        <Paper p="lg" radius="md">
          <Stack align="center" mb="lg">
            <IconMusic size={48} color="var(--mantine-color-grape-6)" />
            <Title order={2}>Create a Band</Title>
            <Text size="sm" c="dimmed" ta="center">
              Share your music project with the world. Create a band profile to showcase your work and connect with fans.
            </Text>
          </Stack>

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
              <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    label="Band Name"
                    placeholder="The Midnight Riders"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Custom Slug"
                    placeholder="midnight-riders"
                    description="Leave blank to auto-generate from name"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </Grid.Col>
              </Grid>

              <TextInput
                label="Location"
                placeholder="Austin, Texas"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />

              <Textarea
                label="About"
                placeholder="Tell us about your band, your music style, history, and what makes you unique..."
                minRows={4}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />

              <FileInput
                label="Profile Picture"
                placeholder="Upload band photo"
                leftSection={<IconUpload size={16} />}
                accept="image/*"
                value={formData.profile_picture}
                onChange={(file) => setFormData({ ...formData, profile_picture: file || undefined })}
              />

              <Title order={4} mt="md">Streaming Links</Title>
              <Text size="sm" c="dimmed">
                Add links to your music on streaming platforms (all optional)
              </Text>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Spotify"
                    placeholder="https://open.spotify.com/artist/..."
                    value={formData.spotify_link}
                    onChange={(e) => setFormData({ ...formData, spotify_link: e.target.value })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Bandcamp"
                    placeholder="https://yourband.bandcamp.com"
                    value={formData.bandcamp_link}
                    onChange={(e) => setFormData({ ...formData, bandcamp_link: e.target.value })}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Apple Music"
                    placeholder="https://music.apple.com/artist/..."
                    value={formData.apple_music_link}
                    onChange={(e) => setFormData({ ...formData, apple_music_link: e.target.value })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="YouTube Music"
                    placeholder="https://music.youtube.com/channel/..."
                    value={formData.youtube_music_link}
                    onChange={(e) => setFormData({ ...formData, youtube_music_link: e.target.value })}
                  />
                </Grid.Col>
              </Grid>

              <Group justify="flex-end" mt="xl">
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
                  disabled={!formData.name.trim()}
                >
                  Create Band
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}