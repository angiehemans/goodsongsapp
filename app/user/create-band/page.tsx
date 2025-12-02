'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Center,
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
  Tooltip,
  Loader,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconUpload, IconMusic, IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, BandData } from '@/lib/api';

function CreateBandForm() {
  const { user, isBand } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get prefilled name from query params (used during onboarding)
  const prefilledName = searchParams.get('name') || '';

  const [formData, setFormData] = useState<BandData>({
    name: prefilledName,
    slug: '',
    location: '',
    about: '',
    spotify_link: '',
    bandcamp_link: '',
    apple_music_link: '',
    youtube_music_link: '',
    profile_picture: undefined,
  });

  // Update form if prefilled name changes
  useEffect(() => {
    if (prefilledName && !formData.name) {
      setFormData(prev => ({ ...prev, name: prefilledName }));
    }
  }, [prefilledName, formData.name]);

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

      // Band accounts go to their dashboard, fan accounts go to band page
      if (isBand) {
        router.push('/user/band-dashboard');
      } else {
        router.push(`/bands/${band.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

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
            href={dashboardUrl}
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
                    label={
                      <Group gap={4}>
                        <span>Custom Slug</span>
                        <Tooltip label="Leave blank to auto-generate from name" withArrow>
                          <IconInfoCircle size={14} style={{ opacity: 0.5, cursor: 'help' }} />
                        </Tooltip>
                      </Group>
                    }
                    placeholder="midnight-riders"
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
                  href={dashboardUrl}
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

export default function CreateBandPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" py="xl">
          <Center>
            <Loader />
          </Center>
        </Container>
      }
    >
      <CreateBandForm />
    </Suspense>
  );
}