'use client';

import { useState, useRef } from 'react';
import {
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Group,
  Avatar,
  Textarea,
  Alert,
  FileButton,
  ActionIcon,
  Loader,
} from '@mantine/core';
import { IconCamera, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, ProfileUpdateData } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

interface ProfileSettingsProps {
  onProfileUpdate?: () => void;
}

export function ProfileSettings({ onProfileUpdate }: ProfileSettingsProps) {
  const { user, refreshUser } = useAuth();
  const [aboutMe, setAboutMe] = useState(user?.about_me || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetRef = useRef<() => void>(null);

  const handleImageSelect = (file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file',
          color: 'red',
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'File too large',
          message: 'Please select an image smaller than 5MB',
          color: 'red',
        });
        return;
      }

      setProfileImage(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData: ProfileUpdateData | FormData = profileImage
        ? (() => {
            const formData = new FormData();
            formData.append('profile_image', profileImage);
            if (aboutMe !== user?.about_me) {
              formData.append('about_me', aboutMe);
            }
            return formData;
          })()
        : { about_me: aboutMe };

      // Only submit if there are changes
      const hasChanges = profileImage || aboutMe !== user?.about_me;
      
      if (!hasChanges) {
        notifications.show({
          title: 'No changes',
          message: 'No changes to save',
          color: 'blue',
        });
        setIsSubmitting(false);
        return;
      }

      await apiClient.updateProfile(updateData);

      // Refresh user data
      await refreshUser();

      // Clean up
      setProfileImage(null);
      setPreviewUrl(null);
      resetRef.current?.();

      notifications.show({
        title: 'Profile updated!',
        message: 'Your profile has been successfully updated.',
        color: 'green',
      });

      onProfileUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      notifications.show({
        title: 'Update failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentImageUrl = previewUrl || fixImageUrl(user?.profile_image_url);

  return (
    <Paper p="lg" radius="md">
      <Title order={3} mb="md">Profile Settings</Title>
      
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
          {/* Profile Image Section */}
          <div>
            <Text size="sm" fw={500} mb="xs">Profile Picture</Text>
            <Group>
              <div style={{ position: 'relative' }}>
                <Avatar 
                  size={80}
                  src={currentImageUrl}
                  color="grape"
                >
                  {!currentImageUrl && user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <FileButton
                  resetRef={resetRef}
                  onChange={handleImageSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                >
                  {(props) => (
                    <ActionIcon
                      {...props}
                      variant="filled"
                      color="grape"
                      size="sm"
                      radius="xl"
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                      }}
                    >
                      <IconCamera size={12} />
                    </ActionIcon>
                  )}
                </FileButton>
              </div>
              <Stack gap="xs">
                <Text size="xs" c="dimmed">
                  Click the camera icon to upload a new profile picture
                </Text>
                <Text size="xs" c="dimmed">
                  Supported formats: JPG, PNG, WebP (max 5MB)
                </Text>
                {profileImage && (
                  <Text size="xs" c="green">
                    New image selected: {profileImage.name}
                  </Text>
                )}
              </Stack>
            </Group>
          </div>

          {/* About Me Section */}
          <div>
            <Text size="sm" fw={500} mb="xs">About Me</Text>
            <Textarea
              placeholder="Tell others about yourself and your music taste..."
              minRows={3}
              maxRows={6}
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              maxLength={500}
            />
            <Text size="xs" c="dimmed" ta="right" mt="xs">
              {aboutMe.length}/500 characters
            </Text>
          </div>

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAboutMe(user?.about_me || '');
                setProfileImage(null);
                setPreviewUrl(null);
                resetRef.current?.();
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              leftSection={!isSubmitting ? <IconCheck size={16} /> : undefined}
              disabled={!profileImage && aboutMe === user?.about_me}
            >
              {isSubmitting ? 'Updating...' : 'Update Profile'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}