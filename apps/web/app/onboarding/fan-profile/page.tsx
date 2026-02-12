'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Container,
  FileInput,
  Loader,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Center,
  Paper,
  Avatar,
  Group,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconMapPin, IconUpload, IconUser } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, normalizeAccountType } from '@/lib/api';

// Username can only contain letters, numbers, and underscores
const isValidUsername = (value: string): boolean => {
  return /^[a-zA-Z0-9_]*$/.test(value);
};

const getUsernameError = (value: string): string | null => {
  if (!value) return null;
  if (!isValidUsername(value)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  if (value.length < 3) {
    return 'Username must be at least 3 characters';
  }
  return null;
};

export default function FanProfilePage() {
  const { user, isLoading, refreshUser, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const usernameError = getUsernameError(username);
  const isUsernameValid = username.length >= 3 && !usernameError && !serverError;

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (serverError) {
      setServerError(null);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Redirect if onboarding is already complete
  useEffect(() => {
    if (!isLoading && user && isOnboardingComplete) {
      const dashboard = isBand ? '/user/band-dashboard' : '/user/dashboard';
      router.push(dashboard);
    }
  }, [user, isLoading, isOnboardingComplete, isBand, router]);

  // Redirect if user hasn't selected account type yet, or selected band
  useEffect(() => {
    if (!isLoading && user) {
      const normalizedType = normalizeAccountType(user.account_type);
      if (!normalizedType) {
        router.push('/onboarding');
      } else if (normalizedType === 'band') {
        router.push('/onboarding/band-profile');
      }
    }
  }, [user, isLoading, router]);

  // Handle image preview
  useEffect(() => {
    if (profileImage) {
      const url = URL.createObjectURL(profileImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [profileImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Username is required',
        color: 'red',
      });
      return;
    }

    if (usernameError) {
      notifications.show({
        title: 'Invalid Username',
        message: usernameError,
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await apiClient.completeFanProfile({
        username: username.trim(),
        about_me: aboutMe.trim() || undefined,
        profile_image: profileImage || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
      });

      await refreshUser();

      notifications.show({
        title: 'Welcome to Goodsongs!',
        message: 'Your profile is all set up.',
        color: 'green',
      });

      router.push('/user/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile';
      const lowerMessage = errorMessage.toLowerCase();

      // Check if the error is related to username
      if (
        lowerMessage.includes('username') ||
        lowerMessage.includes('taken') ||
        lowerMessage.includes('already') ||
        lowerMessage.includes('exists') ||
        lowerMessage.includes('unique')
      ) {
        // Show a user-friendly message for username errors
        if (lowerMessage.includes('taken') || lowerMessage.includes('already') || lowerMessage.includes('exists')) {
          setServerError('This username is already taken');
        } else {
          setServerError(errorMessage);
        }
      } else {
        // For other errors, show inline as well since most errors are username-related
        setServerError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size={500} my={40}>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user || normalizeAccountType(user.account_type) !== 'fan') {
    return null;
  }

  return (
    <Container size={500} my={40}>
      <Stack gap="xl">
        <Stack gap="xs" ta="center">
          <Title order={1} c="grape.8">
            Complete Your Profile
          </Title>
          <Text c="dimmed" size="lg">
            Tell us a bit about yourself
          </Text>
        </Stack>

        <Paper p="xl" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              {/* Profile Image */}
              <Stack align="center" gap="sm">
                <Avatar
                  size={100}
                  src={previewUrl}
                  color="grape.6"
                >
                  {username ? username.charAt(0).toUpperCase() : <IconUser size={40} />}
                </Avatar>
                <FileInput
                  placeholder="Upload profile picture"
                  leftSection={<IconUpload size={16} />}
                  accept="image/*"
                  value={profileImage}
                  onChange={setProfileImage}
                  clearable
                  size="sm"
                />
              </Stack>

              {/* Username */}
              <TextInput
                label="Username"
                placeholder="Choose a unique username"
                description={
                  serverError
                    ? undefined
                    : usernameError && username
                      ? undefined
                      : 'Letters, numbers, and underscores only'
                }
                error={serverError || (usernameError && username ? usernameError : undefined)}
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                leftSection={<IconUser size={16} />}
                rightSection={
                  username.length > 0 ? (
                    isUsernameValid ? (
                      <ThemeIcon size="sm" color="green" variant="light" radius="xl">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    ) : (
                      <ThemeIcon size="sm" color="red" variant="light" radius="xl">
                        <IconAlertCircle size={14} />
                      </ThemeIcon>
                    )
                  ) : undefined
                }
              />

              {/* About Me */}
              <Textarea
                label="About Me"
                placeholder="Tell others about your music taste, favorite genres, artists..."
                description="Optional - you can add this later"
                minRows={3}
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
              />

              {/* Location */}
              <Group grow>
                <TextInput
                  label="City"
                  placeholder="Los Angeles"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  leftSection={<IconMapPin size={16} />}
                />
                <TextInput
                  label="State / Region"
                  placeholder="California"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                />
              </Group>

              <Button
                type="submit"
                size="lg"
                fullWidth
                color="grape.9"
                loading={submitting}
                disabled={!isUsernameValid}
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
