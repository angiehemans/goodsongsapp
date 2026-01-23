'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Tooltip,
  Loader,
  Center,
  Avatar,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconUpload, IconMusic, IconInfoCircle, IconEdit } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, BandData, Band } from '@/lib/api';
import { extractBandcampEmbedUrl, fixImageUrl } from '@/lib/utils';

export default function EditBandPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBand, setIsLoadingBand] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [band, setBand] = useState<Band | null>(null);

  const [formData, setFormData] = useState<BandData>({
    name: '',
    slug: '',
    location: '',
    about: '',
    spotify_link: '',
    bandcamp_link: '',
    bandcamp_embed: '',
    apple_music_link: '',
    youtube_music_link: '',
    profile_picture: undefined,
  });

  // Fetch band data
  useEffect(() => {
    async function fetchBand() {
      if (!slug) return;

      try {
        const bandData = await apiClient.getBand(slug);
        setBand(bandData);
        setFormData({
          name: bandData.name,
          slug: bandData.slug,
          location: bandData.location || '',
          about: bandData.about || '',
          spotify_link: bandData.spotify_link || '',
          bandcamp_link: bandData.bandcamp_link || '',
          bandcamp_embed: bandData.bandcamp_embed || '',
          apple_music_link: bandData.apple_music_link || '',
          youtube_music_link: bandData.youtube_music_link || '',
          profile_picture: undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load band');
      } finally {
        setIsLoadingBand(false);
      }
    }

    fetchBand();
  }, [slug]);

  // Check ownership
  useEffect(() => {
    if (!authLoading && !isLoadingBand && band && user) {
      if (!band.user_owned) {
        notifications.show({
          title: 'Access denied',
          message: 'You can only edit bands you own.',
          color: 'red',
        });
        router.push('/user/dashboard');
      }
    }
  }, [authLoading, isLoadingBand, band, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Clean up bandcamp_embed before saving (extract URL from iframe HTML if needed)
      const dataToSubmit = {
        ...formData,
        bandcamp_embed: extractBandcampEmbedUrl(formData.bandcamp_embed || ''),
      };
      const updatedBand = await apiClient.updateBand(slug, dataToSubmit);

      notifications.show({
        title: 'Band updated!',
        message: `${updatedBand.name} has been successfully updated.`,
        color: 'green',
      });

      router.push(`/bands/${updatedBand.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoadingBand) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Text>Please log in to edit a band.</Text>
      </Container>
    );
  }

  if (error && !band) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center">
            <Group>
              <IconEdit size={32} color="var(--mantine-color-grape-6)" />
              <Title order={1}>Edit Band</Title>
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
          <Group mb="lg">
            {band?.profile_picture_url || band?.spotify_image_url ? (
              <img
                src={fixImageUrl(band.profile_picture_url) || band.spotify_image_url}
                alt={band.name}
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <Avatar size={64} color="grape.6">
                {band?.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <div>
              <Title order={3}>{band?.name}</Title>
              <Text size="sm" c="dimmed">
                Update your band's profile information.
              </Text>
            </div>
          </Group>

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
                        <Tooltip label="This is the URL-friendly name for your band" withArrow>
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
                placeholder="Upload new band photo"
                description={band?.profile_picture_url ? "Leave empty to keep current photo" : undefined}
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

              <Textarea
                label="Bandcamp Embed"
                placeholder="Paste iframe code or URL from Bandcamp's Share > Embed"
                description="Paste the full iframe code from Bandcamp - we'll extract what we need. If set, shows Bandcamp player instead of Spotify."
                value={formData.bandcamp_embed}
                onChange={(e) => setFormData({ ...formData, bandcamp_embed: e.target.value })}
                minRows={2}
              />

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
                  Save Changes
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
