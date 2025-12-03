'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconEdit,
  IconLogout,
  IconMapPin,
  IconShield,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Center,
  Container,
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
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './page.module.css';

// Lazy load components
const SpotifyConnection = lazy(() =>
  import('@/components/SpotifyConnection/SpotifyConnection').then((mod) => ({
    default: mod.SpotifyConnection,
  }))
);

export default function SettingsPage() {
  const { user, isLoading, logout, isOnboardingComplete, isBand, isFan, isAdmin, refreshUser } =
    useAuth();
  const router = useRouter();

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
  }, [user, isLoading, isOnboardingComplete, router]);

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

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

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
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
            <Link href={dashboardUrl} className={styles.headerLink}>
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
                href={dashboardUrl}
                variant="subtle"
                size="lg"
                color="gray"
              >
                <IconArrowLeft size={24} />
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
                    {previewUrl || user.profile_image_url ? (
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
                        {user.username?.charAt(0).toUpperCase() ||
                          user.email.charAt(0).toUpperCase()}
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
                  {isBand ? 'Band Account' : 'Fan Account'}
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
          <Title order={2} my="sm" c="blue.8" fw={500}>
            Settings
          </Title>

          <Stack gap="md">
            {/* Spotify Connection - Only for fan accounts */}
            {isFan && (
              <Paper p="lg" radius="md" withBorder>
                <Title order={4} mb="md">
                  Spotify Connection
                </Title>
                <Suspense
                  fallback={
                    <Group>
                      <Loader size="sm" />
                      <Text size="sm">Loading Spotify status...</Text>
                    </Group>
                  }
                >
                  <SpotifyConnection />
                </Suspense>
              </Paper>
            )}

            {/* Account Section */}
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                Account
              </Title>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text fw={500}>Email</Text>
                    <Text size="sm" c="dimmed">
                      {user.email}
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Paper>

            {/* Logout Section */}
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4}>Sign Out</Title>
                  <Text size="sm" c="dimmed">
                    Sign out of your account on this device
                  </Text>
                </div>
                <Button
                  leftSection={<IconLogout size={16} />}
                  variant="outline"
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Flex>
      </Flex>
    </Container>
  );
}
