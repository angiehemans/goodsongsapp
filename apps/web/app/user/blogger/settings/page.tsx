'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCamera,
  IconCheck,
  IconCrown,
  IconLogout,
  IconMail,
  IconMessage,
  IconMusic,
  IconUser,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  FileButton,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { StreamingPlatform, STREAMING_PLATFORMS } from '@/lib/streaming';
import { fixImageUrl } from '@/lib/utils';

// Lazy load components
const LastFmConnection = lazy(() =>
  import('@/components/LastFmConnection/LastFmConnection').then((mod) => ({
    default: mod.LastFmConnection,
  }))
);

export default function BloggerSettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Profile edit state
  const [editAboutMe, setEditAboutMe] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const resetRef = useRef<() => void>(null);

  // Email confirmation state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Streaming platform state
  const [streamingPlatformLoading, setStreamingPlatformLoading] = useState(false);

  // Anonymous comments state
  const [anonymousCommentsLoading, setAnonymousCommentsLoading] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setEditAboutMe(user.about_me || '');
      setEditCity(user.city || '');
      setEditRegion(user.region || '');
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    if (user) {
      const changed =
        editAboutMe !== (user.about_me || '') ||
        editCity !== (user.city || '') ||
        editRegion !== (user.region || '') ||
        editProfileImage !== null;
      setHasChanges(changed);
    }
  }, [editAboutMe, editCity, editRegion, editProfileImage, user]);

  // Countdown timer for retry
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

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
    if (!user) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      if (editAboutMe !== (user.about_me || '')) {
        formData.append('about_me', editAboutMe);
      }
      if (editCity !== (user.city || '')) {
        formData.append('city', editCity);
      }
      if (editRegion !== (user.region || '')) {
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

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      notifications.show({
        title: 'Email sent',
        message: response.message || 'Confirmation email has been sent.',
        color: 'green',
      });
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send confirmation email';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleStreamingPlatformChange = async (value: string | null) => {
    setStreamingPlatformLoading(true);
    try {
      const platform = value === '' || value === null ? null : (value as StreamingPlatform);
      await apiClient.updatePreferredStreamingPlatform(platform);
      await refreshUser();
      notifications.show({
        title: 'Preferences updated',
        message: platform
          ? `${STREAMING_PLATFORMS[platform].name} set as your preferred platform`
          : 'Streaming preference cleared',
        color: 'green',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update streaming preference';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setStreamingPlatformLoading(false);
    }
  };

  const handleAllowAnonymousCommentsChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setAnonymousCommentsLoading(true);
    try {
      await apiClient.updateAllowAnonymousComments(checked);
      await refreshUser();
      notifications.show({
        title: 'Settings updated',
        message: checked
          ? 'Anonymous comments are now allowed on your posts'
          : 'Anonymous comments are now disabled',
        color: 'green',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update setting';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setAnonymousCommentsLoading(false);
    }
  };

  const canResend = user?.can_resend_confirmation && retryAfter === 0;

  const streamingPlatformOptions = [
    { value: '', label: 'No preference' },
    ...Object.entries(STREAMING_PLATFORMS).map(([key, { name }]) => ({
      value: key,
      label: name,
    })),
  ];

  const currentImageUrl = previewUrl || (user?.profile_image_url ? fixImageUrl(user.profile_image_url) : null);

  if (!user) {
    return null;
  }

  return (
    <Stack p="md" gap="lg" maw={700}>
      <Title order={2} style={{ color: 'var(--gs-text-heading)' }} fw={500}>
        Settings
      </Title>

      {/* Profile Section */}
      <Paper p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          <Group gap="xs">
            <IconUser size={20} />
            Profile
          </Group>
        </Title>

        <Stack gap="md">
          {/* Profile Image */}
          <Group gap="md" align="flex-start">
            <Box pos="relative">
              <Avatar src={currentImageUrl} size={80} radius="xl">
                {user.username?.charAt(0).toUpperCase()}
              </Avatar>
              <FileButton onChange={handleImageSelect} accept="image/*" resetRef={resetRef}>
                {(props) => (
                  <Button
                    {...props}
                    variant="filled"
                    color="grape"
                    size="xs"
                    radius="xl"
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      padding: '4px 8px',
                    }}
                  >
                    <IconCamera size={14} />
                  </Button>
                )}
              </FileButton>
            </Box>
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                @{user.username}
              </Text>
              <Text size="xs" c="dimmed">
                Click the camera icon to update your profile picture
              </Text>
            </Stack>
          </Group>

          {/* About */}
          <Textarea
            label="About"
            placeholder="Tell us about yourself..."
            value={editAboutMe}
            onChange={(e) => setEditAboutMe(e.target.value)}
            minRows={3}
            maxRows={6}
          />

          {/* Location */}
          <Group grow>
            <TextInput
              label="City"
              placeholder="e.g., Los Angeles"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
            <TextInput
              label="State/Region"
              placeholder="e.g., California"
              value={editRegion}
              onChange={(e) => setEditRegion(e.target.value)}
            />
          </Group>

          {/* Save Button */}
          <Button
            color="grape"
            onClick={handleSaveProfile}
            loading={isSaving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Stack>
      </Paper>

      {/* Last.fm Connection */}
      <Suspense
        fallback={
          <Paper p="lg" radius="md" withBorder>
            <Group>
              <Loader size="sm" />
              <Text size="sm">Loading Last.fm status...</Text>
            </Group>
          </Paper>
        }
      >
        <LastFmConnection />
      </Suspense>

      {/* Streaming Preferences Section */}
      <Paper p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          <Group gap="xs">
            <IconMusic size={20} />
            Streaming Preferences
          </Group>
        </Title>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Choose your preferred streaming platform. When available, songs will open directly in
            this app.
          </Text>
          <Select
            label="Preferred Platform"
            placeholder="Select a platform"
            data={streamingPlatformOptions}
            value={user?.preferred_streaming_platform ?? ''}
            onChange={handleStreamingPlatformChange}
            disabled={streamingPlatformLoading}
            clearable={false}
          />
        </Stack>
      </Paper>

      {/* Blog Settings Section */}
      <Paper p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          <Group gap="xs">
            <IconMessage size={20} />
            Blog Settings
          </Group>
        </Title>
        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text fw={500}>Allow Anonymous Comments</Text>
              <Text size="sm" c="dimmed">
                Allow visitors without accounts to comment on your posts
              </Text>
            </div>
            <Switch
              checked={user?.allow_anonymous_comments ?? false}
              onChange={handleAllowAnonymousCommentsChange}
              disabled={anonymousCommentsLoading}
            />
          </Group>
        </Stack>
      </Paper>

      {/* Current Plan Section */}
      <Paper p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          <Group gap="xs">
            <IconCrown size={20} />
            Your Plan
          </Group>
        </Title>
        <Stack gap="sm">
          <Group justify="space-between">
            <div>
              <Text fw={500}>{user.plan?.name || 'Free'}</Text>
              <Text size="sm" c="dimmed">
                {user.role === 'blogger' ? 'Blogger Account' : 'Account'}
              </Text>
            </div>
            <Badge color="grape" size="lg" variant="light">
              {user.plan?.name || 'Free'}
            </Badge>
          </Group>
          {user.plan?.abilities && user.plan.abilities.length > 0 && (
            <Box>
              <Text size="sm" c="dimmed" mb="xs">
                Plan includes:
              </Text>
              <Group gap="xs">
                {user.plan.abilities.slice(0, 5).map((ability) => (
                  <Badge key={ability} variant="outline" color="gray" size="sm">
                    {ability.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {user.plan.abilities.length > 5 && (
                  <Text size="xs" c="dimmed">
                    +{user.plan.abilities.length - 5} more
                  </Text>
                )}
              </Group>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Account Section */}
      <Paper p="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          Account
        </Title>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="xs" mb={4}>
                <Text fw={500}>Email</Text>
                {user?.email_confirmed ? (
                  <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                    Confirmed
                  </Badge>
                ) : (
                  <Badge color="orange" size="sm">
                    Unconfirmed
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {user?.email}
              </Text>
            </div>
            {!user?.email_confirmed && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconMail size={14} />}
                onClick={handleResendConfirmation}
                loading={resendLoading}
                disabled={!canResend}
              >
                {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend confirmation'}
              </Button>
            )}
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
  );
}
