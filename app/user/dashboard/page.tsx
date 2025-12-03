'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconBrandSpotify,
  IconCamera,
  IconCheck,
  IconEdit,
  IconMapPin,
  IconMusic,
  IconPlus,
  IconSettings,
  IconShield,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Center,
  Container,
  Divider,
  FileButton,
  Flex,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Review } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, isLoading, isOnboardingComplete, isBand, isAdmin, refreshUser } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<any[]>([]);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editAboutMe, setEditAboutMe] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const resetRef = useRef<() => void>(null);

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

  // Fetch user reviews
  const fetchCoreData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);

    try {
      const userReviews = await apiClient.getUserReviews();
      setReviews(userReviews);
    } catch {
      // Silently fail for reviews as endpoint might not exist yet
      setReviews([]);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  // Load core data immediately when user is available
  useEffect(() => {
    if (user) {
      fetchCoreData();
    }
  }, [user, fetchCoreData]);

  // Check Spotify connection status
  const checkSpotifyConnection = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const status = await apiClient.getSpotifyStatus();
      setSpotifyConnected(status.connected);
    } catch (error) {
      setSpotifyConnected(false);
    }
  }, [user]);

  // Fetch Spotify data separately (non-blocking)
  const fetchSpotifyData = useCallback(async () => {
    if (!user || !spotifyConnected) {
      return;
    }

    setRecentlyPlayedLoading(true);

    try {
      const tracks = await apiClient.getRecentlyPlayed();
      const tracksArray = Array.isArray(tracks)
        ? tracks
        : (tracks as any)?.tracks || (tracks as any)?.items || [];
      setRecentlyPlayed(tracksArray);
    } catch (error) {
      setRecentlyPlayed([]);
    } finally {
      setRecentlyPlayedLoading(false);
    }
  }, [user, spotifyConnected]);

  // Check Spotify connection when user is available
  useEffect(() => {
    if (user) {
      checkSpotifyConnection();
    }
  }, [user, checkSpotifyConnection]);

  // Load Spotify data when connection status changes
  useEffect(() => {
    if (user && spotifyConnected) {
      fetchSpotifyData();
    }
  }, [user, spotifyConnected, fetchSpotifyData]);

  // Edit mode handlers
  const handleStartEdit = () => {
    setEditAboutMe(user?.about_me || '');
    setEditCity(user?.city || '');
    setEditRegion(user?.region || '');
    setEditProfileImage(null);
    setPreviewUrl(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditProfileImage(null);
    setPreviewUrl(null);
    resetRef.current?.();
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file',
          color: 'red',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'File too large',
          message: 'Please select an image smaller than 5MB',
          color: 'red',
        });
        return;
      }
      setEditProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (editAboutMe !== user?.about_me) {
        formData.append('about_me', editAboutMe);
      }
      if (editCity !== user?.city) {
        formData.append('city', editCity);
      }
      if (editRegion !== user?.region) {
        formData.append('region', editRegion);
      }
      if (editProfileImage) {
        formData.append('profile_image', editProfileImage);
      }

      await apiClient.updateProfile(formData);
      await refreshUser();

      notifications.show({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.',
        color: 'green',
      });

      setIsEditing(false);
      setEditProfileImage(null);
      setPreviewUrl(null);
      resetRef.current?.();
    } catch (error) {
      console.error('Failed to update profile:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
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

  return (
    <Container p={0} fluid className={styles.container}>
      {/* Header */}
      <Container fluid p="md" className={styles.header}>
        <Container size="md" p={0}>
          <Group justify="space-between" align="center">
            <Link href="/user/dashboard" className={styles.headerLink}>
              <Title order={2} c="blue.9">
                goodsongs
              </Title>
            </Link>
            <Group gap="xs">
              {isAdmin && (
                <ActionIcon
                  component={Link}
                  href="/admin"
                  variant="subtle"
                  size="lg"
                  color="red"
                >
                  <IconShield size={24} />
                </ActionIcon>
              )}
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
          </Group>
        </Container>
      </Container>

      <Flex className={styles.content}>
        {/* User Sidebar */}
        <Flex p="md" miw={300} direction="column" gap="sm" className={styles.userBackground}>
          {isEditing ? (
            <>
              {/* Edit Mode */}
              <Stack gap="sm">
                {/* Profile Image with camera overlay */}
                <Center>
                  <div style={{ position: 'relative' }}>
                    {(previewUrl || user.profile_image_url) ? (
                      <div className={styles.profilePhotoWrapper}>
                        <div className={styles.profilePhotoBlend}>
                          <img
                            src={previewUrl || fixImageUrl(user.profile_image_url)}
                            alt="Profile preview"
                            className={styles.profilePhoto}
                          />
                        </div>
                      </div>
                    ) : (
                      <Avatar size="72px" color="grape.6">
                        {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                    <FileButton
                      resetRef={resetRef}
                      onChange={handleImageSelect}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                    >
                      {(props) => (
                        <ActionIcon
                          {...props}
                          variant="filled"
                          color="grape.6"
                          size="md"
                          radius="xl"
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                          }}
                        >
                          <IconCamera size={16} />
                        </ActionIcon>
                      )}
                    </FileButton>
                  </div>
                </Center>
                {editProfileImage && (
                  <Text size="xs" c="green" ta="center">
                    New image selected: {editProfileImage.name}
                  </Text>
                )}
                <Text size="sm" fw={500} c="blue.8" ta="center">
                  @{user.username || 'username'}
                </Text>
                <Textarea
                  label="About Me"
                  placeholder="Tell us about yourself..."
                  value={editAboutMe}
                  onChange={(e) => setEditAboutMe(e.target.value)}
                  minRows={3}
                  autosize
                />
                <Group grow>
                  <TextInput
                    label="City"
                    placeholder="Los Angeles"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    leftSection={<IconMapPin size={16} />}
                  />
                  <TextInput
                    label="State / Region"
                    placeholder="California"
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                  />
                </Group>
                <Group gap="xs" mt="sm">
                  <Button
                    onClick={handleSaveProfile}
                    loading={isSaving}
                    leftSection={<IconCheck size={16} />}
                    flex={1}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="light"
                    color="gray"
                    leftSection={<IconX size={16} />}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </Group>
              </Stack>
            </>
          ) : (
            <>
              {/* View Mode */}
              <Group align="center">
                {user.profile_image_url ? (
                  <Link href={user.username ? `/users/${user.username}` : '#'}>
                    <div className={styles.profilePhotoWrapper}>
                      <div className={styles.profilePhotoBlend}>
                        <img
                          src={fixImageUrl(user.profile_image_url)}
                          alt={user.username || 'Profile'}
                          className={styles.profilePhoto}
                        />
                      </div>
                    </div>
                  </Link>
                ) : user.username ? (
                  <Avatar
                    size="72px"
                    color="grape.6"
                    component={Link}
                    href={`/users/${user.username}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                ) : (
                  <Avatar size="72px" color="grape.6">
                    {user.email.charAt(0).toUpperCase()}
                  </Avatar>
                )}
                <Stack gap="xs" flex={1}>
                  <Title order={2} c="blue.8" fw={500} lh={1}>
                    {user.username ? `@${user.username}` : 'Welcome!'}
                  </Title>
                  {(user.city || user.region) && (
                    <Text c="blue.7" size="md" lh={1}>
                      {[user.city, user.region].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </Stack>
              </Group>
              {user.about_me && (
                <Text c="gray.7" style={{ whiteSpace: 'pre-wrap' }}>
                  {user.about_me}
                </Text>
              )}
              <Group gap="xs">
                <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
                  {reviews.length} recommendation{reviews.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
              <Button
                onClick={handleStartEdit}
                variant="light"
                leftSection={<IconEdit size={16} />}
                mt="sm"
              >
                Edit Profile
              </Button>
              <Button
                component={Link}
                href="/user/create-review"
                leftSection={<IconPlus size={16} />}
              >
                New Recommendation
              </Button>
              {user.username && (
                <Button
                  component={Link}
                  href={`/users/${user.username}`}
                  variant="light"
                  size="sm"
                >
                  View Public Profile
                </Button>
              )}
            </>
          )}
        </Flex>

        {/* Main Content */}
        <Flex direction="column" flex={1} px="md" pb="lg">
          {/* My Recommendations */}
          <Title order={2} my="sm" c="blue.8" fw={500}>
            My Recommendations
          </Title>

          {dataLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : reviews.length === 0 ? (
            <Paper p="lg" radius="md">
              <Center py="xl">
                <Stack align="center">
                  <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    No recommendations yet. Share your favorite songs!
                  </Text>
                  <Button
                    component={Link}
                    href="/user/create-review"
                    leftSection={<IconPlus size={16} />}
                  >
                    Write Your First Recommendation
                  </Button>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Stack>
              {reviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}

              {reviews.length > 5 && (
                <>
                  <Divider />
                  <Group justify="center">
                    <Text size="sm" c="dimmed">
                      Showing 5 of {reviews.length} recommendations
                    </Text>
                    <Button
                      component={Link}
                      href={`/users/${user?.username}`}
                      variant="subtle"
                      size="sm"
                    >
                      View All Recommendations
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}

          {/* Recently Played from Spotify */}
          {spotifyConnected && (
            <>
              <Group justify="space-between" align="center" mt="xl" mb="md">
                <Title order={2} c="blue.8" fw={500}>
                  Recently Played Songs
                </Title>
                <Badge variant="light" color="green" leftSection={<IconMusic size={12} />}>
                  From Spotify
                </Badge>
              </Group>

              {recentlyPlayedLoading ? (
                <Center py="md">
                  <Loader size="sm" />
                </Center>
              ) : !Array.isArray(recentlyPlayed) || recentlyPlayed.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" ta="center">
                      No recently played tracks found. Start listening on Spotify!
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack>
                  {(Array.isArray(recentlyPlayed) ? recentlyPlayed : [])
                    .slice(0, 10)
                    .map((track, index) => (
                      <Card key={`${track.id}-${index}`} p="md">
                        <Group justify="space-between" align="flex-start">
                          <Group>
                            {track.album?.images?.[0] && (
                              <img
                                src={track.album.images[0].url}
                                alt={`${track.name} album art`}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 8,
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            <Stack gap="xs">
                              <div>
                                <Title order={5}>{track.name}</Title>
                                <Text size="sm" c="dimmed">
                                  {Array.isArray(track.artists)
                                    ? track.artists
                                        .map((artist: any) =>
                                          typeof artist === 'string' ? artist : artist.name
                                        )
                                        .join(', ')
                                    : track.artists}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {track.album?.name}
                                </Text>
                              </div>
                              <Text size="xs" c="dimmed">
                                Played {new Date(track.played_at).toLocaleString()}
                              </Text>
                            </Stack>
                          </Group>
                          <Group gap="xs">
                            <Button
                              component="a"
                              href={track.external_urls?.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="subtle"
                              size="xs"
                              color="green"
                              leftSection={<IconBrandSpotify size={14} />}
                            >
                              Open in Spotify
                            </Button>
                            <Button
                              component={Link}
                              href={`/user/create-review?${new URLSearchParams({
                                song_name: track.name || '',
                                band_name: Array.isArray(track.artists)
                                  ? track.artists
                                      .map((artist: any) =>
                                        typeof artist === 'string' ? artist : artist.name
                                      )
                                      .join(', ')
                                  : track.artists || '',
                                artwork_url: track.album?.images?.[0]?.url || '',
                                song_link: track.external_urls?.spotify || '',
                              }).toString()}`}
                              variant="filled"
                              size="xs"
                              color="grape"
                              leftSection={<IconPlus size={14} />}
                            >
                              Recommend
                            </Button>
                          </Group>
                        </Group>
                      </Card>
                    ))}

                  {Array.isArray(recentlyPlayed) && recentlyPlayed.length > 10 && (
                    <>
                      <Divider />
                      <Group justify="center">
                        <Text size="sm" c="dimmed">
                          Showing 10 of {recentlyPlayed.length} recently played tracks
                        </Text>
                      </Group>
                    </>
                  )}
                </Stack>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}
