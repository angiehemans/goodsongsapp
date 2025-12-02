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
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconUser } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, normalizeAccountType } from '@/lib/api';

export default function FanProfilePage() {
  const { user, isLoading, refreshUser, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    setSubmitting(true);
    try {
      await apiClient.completeFanProfile({
        username: username.trim(),
        about_me: aboutMe.trim() || undefined,
        profile_image: profileImage || undefined,
      });

      await refreshUser();

      notifications.show({
        title: 'Welcome to Goodsongs!',
        message: 'Your profile is all set up.',
        color: 'green',
      });

      router.push('/user/dashboard');
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
                description="This will be your public identity on Goodsongs"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftSection={<IconUser size={16} />}
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

              <Button
                type="submit"
                size="lg"
                fullWidth
                color="grape.9"
                loading={submitting}
                disabled={!username.trim()}
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
