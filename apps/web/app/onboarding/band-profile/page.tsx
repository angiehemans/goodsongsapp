'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Container,
  FileInput,
  Grid,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Center,
  Paper,
  Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconUpload, IconMicrophone2 } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, normalizeRole } from '@/lib/api';

export default function BandProfilePage() {
  const { user, isLoading, refreshUser, isOnboardingComplete, isFan } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [bandcampLink, setBandcampLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [youtubeMusicLink, setYoutubeMusicLink] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Redirect if onboarding is already complete
  useEffect(() => {
    if (!isLoading && user && isOnboardingComplete) {
      const dashboard = isFan ? '/user/dashboard' : '/user/band-dashboard';
      router.push(dashboard);
    }
  }, [user, isLoading, isOnboardingComplete, isFan, router]);

  // Redirect if user hasn't selected role yet, or selected fan
  useEffect(() => {
    if (!isLoading && user) {
      const normalizedRole = normalizeRole(user.role ?? user.account_type);
      if (!normalizedRole) {
        router.push('/onboarding');
      } else if (normalizedRole === 'fan') {
        router.push('/onboarding/fan-profile');
      }
    }
  }, [user, isLoading, router]);

  // Handle image preview
  useEffect(() => {
    if (profilePicture) {
      const url = URL.createObjectURL(profilePicture);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [profilePicture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Band name is required',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.completeBandProfile({
        name: name.trim(),
        about: about.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        spotify_link: spotifyLink.trim() || undefined,
        bandcamp_link: bandcampLink.trim() || undefined,
        apple_music_link: appleMusicLink.trim() || undefined,
        youtube_music_link: youtubeMusicLink.trim() || undefined,
        profile_picture: profilePicture || undefined,
      });

      await refreshUser();

      notifications.show({
        title: 'Welcome to Goodsongs!',
        message: 'Your band profile is all set up.',
        color: 'green',
      });

      router.push('/user/band-dashboard');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to complete profile',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size={600} my={40}>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user || normalizeRole(user.role ?? user.account_type) !== 'band') {
    return null;
  }

  return (
    <Container size={600} my={40}>
      <Stack gap="xl">
        <Stack gap="xs" ta="center">
          <Title order={1} style={{ color: 'var(--gs-text-primary)' }}>
            Set Up Your Band Profile
          </Title>
          <Text c="dimmed" size="lg">
            Tell fans about your music
          </Text>
        </Stack>

        <Paper p="xl" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {/* Profile Picture */}
              <Stack align="center" gap="sm">
                <Avatar
                  size={100}
                  src={previewUrl}
                  color="grape"
                >
                  {name ? name.charAt(0).toUpperCase() : <IconMicrophone2 size={40} />}
                </Avatar>
                <FileInput
                  placeholder="Upload band photo"
                  leftSection={<IconUpload size={16} />}
                  accept="image/*"
                  value={profilePicture}
                  onChange={setProfilePicture}
                  clearable
                  size="sm"
                />
              </Stack>

              {/* Band Name */}
              <TextInput
                label="Band / Artist Name"
                placeholder="Your band or artist name"
                description="This will be your identity on Goodsongs"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftSection={<IconMicrophone2 size={16} />}
              />

              {/* Location */}
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="City"
                    placeholder="Austin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="State / Region"
                    placeholder="Texas"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </Grid.Col>
              </Grid>

              {/* About */}
              <Textarea
                label="About"
                placeholder="Tell fans about your band, your music style, history..."
                description="Optional - you can add this later"
                minRows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />

              {/* Streaming Links */}
              <Title order={4} mt="md">Streaming Links</Title>
              <Text size="sm" c="dimmed">
                Add links to your music on streaming platforms (all optional)
              </Text>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Spotify"
                    placeholder="https://open.spotify.com/artist/..."
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Bandcamp"
                    placeholder="https://yourband.bandcamp.com"
                    value={bandcampLink}
                    onChange={(e) => setBandcampLink(e.target.value)}
                  />
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="Apple Music"
                    placeholder="https://music.apple.com/artist/..."
                    value={appleMusicLink}
                    onChange={(e) => setAppleMusicLink(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="YouTube Music"
                    placeholder="https://music.youtube.com/channel/..."
                    value={youtubeMusicLink}
                    onChange={(e) => setYoutubeMusicLink(e.target.value)}
                  />
                </Grid.Col>
              </Grid>

              <Button
                type="submit"
                size="lg"
                fullWidth
                color="grape"
                loading={submitting}
                disabled={!name.trim()}
                mt="md"
              >
                Complete Setup
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
