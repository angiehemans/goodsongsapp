'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBell,
  IconCamera,
  IconCheck,
  IconCompass,
  IconEdit,
  IconHome,
  IconPlus,
  IconSettings,
  IconShield,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  FileButton,
  Flex,
  Group,
  Indicator,
  Spoiler,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { FollowersList } from '@/components/FollowersList/FollowersList';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './UserSidebar.module.css';

interface UserSidebarProps {
  /** Badge text to show (e.g., "5 recommendations" or "Fan Account") */
  badgeText?: string;
  /** Additional action buttons to render in view mode */
  actionButtons?: React.ReactNode;
  /** Callback when profile is successfully saved */
  onProfileSaved?: () => void;
  /** Number of followers */
  followersCount?: number;
  /** Number of users being followed */
  followingCount?: number;
  /** Callback when new recommendation button is clicked */
  onNewRecommendation?: () => void;
}

export function UserSidebar({
  badgeText,
  actionButtons,
  onProfileSaved,
  followersCount = 0,
  followingCount = 0,
  onNewRecommendation,
}: UserSidebarProps) {
  const { user, refreshUser, isBand, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  // Helper to check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/user/dashboard' || href === '/user/band-dashboard') {
      return pathname === '/user/dashboard' || pathname === '/user/band-dashboard';
    }
    if (href.startsWith('/users/')) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editAboutMe, setEditAboutMe] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const resetRef = useRef<() => void>(null);

  if (!user) {
    return null;
  }

  const handleStartEdit = () => {
    setEditAboutMe(user.about_me || '');
    setEditCity(user.city || '');
    setEditRegion(user.region || '');
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
      if (editAboutMe !== user.about_me) {
        formData.append('about_me', editAboutMe);
      }
      if (editCity !== user.city) {
        formData.append('city', editCity);
      }
      if (editRegion !== user.region) {
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
      onProfileSaved?.();
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

  if (isEditing) {
    return (
      <Flex p="md" direction="column" gap="sm" className={styles.container}>
        <Stack gap="sm">
          {/* Profile Image with camera overlay */}
          <Group align="center">
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

            {editProfileImage && (
              <Text size="xs" c="green" ta="center">
                New image selected: {editProfileImage.name}
              </Text>
            )}
            <Title order={2} c="blue.8" fw={500} lh={1}>
              @{user.username || 'username'}
            </Title>
          </Group>
          <Textarea
            label="About Me"
            placeholder="Tell us about yourself..."
            value={editAboutMe}
            onChange={(e) => setEditAboutMe(e.target.value)}
            minRows={3}
            autosize
          />
          <Flex direction="column" gap="sm">
            <TextInput
              label="City"
              placeholder="Los Angeles"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              flex={1}
            />
            <TextInput
              label="State / Region"
              placeholder="California"
              value={editRegion}
              onChange={(e) => setEditRegion(e.target.value)}
              flex={1}
            />
          </Flex>
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
              flex={1}
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      </Flex>
    );
  }

  return (
    <Flex p="md" direction="column" gap="sm" className={styles.container}>
      {/* View Mode */}
      <Group align="center">
        <ProfilePhoto
          src={user.profile_image_url}
          alt={user.username || 'Profile'}
          size={72}
          fallback={user.username || user.email}
          href={user.username ? `/users/${user.username}` : undefined}
        />
        <Stack gap="xs" flex={1}>
          <Title order={2} c="blue.8" fw={500} lh={1}>
            {user.username ? `@${user.username}` : 'Welcome!'}
          </Title>
          {(user.city || user.region) && (
            <Text c="blue.7" size="sm" lh={1}>
              {[user.city, user.region].filter(Boolean).join(', ')}
            </Text>
          )}
        </Stack>
      </Group>
      {user.about_me && (
        <Spoiler
          maxHeight={60}
          showLabel="Read more"
          hideLabel="Show less"
          styles={{
            control: {
              fontSize: 'var(--mantine-font-size-sm)',
              color: 'var(--mantine-color-grape-4)',
            },
          }}
        >
          <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-wrap' }}>
            {user.about_me}
          </Text>
        </Spoiler>
      )}
      {/* {badgeText && (
        <Group gap="xs">
          <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
            {badgeText}
          </Badge>
        </Group>
      )} */}
      <FollowersList followersCount={followersCount} followingCount={followingCount} />
      <Button onClick={handleStartEdit} variant="light" leftSection={<IconEdit size={16} />}>
        Edit Profile
      </Button>
      {onNewRecommendation && (
        <Button
          onClick={onNewRecommendation}
          leftSection={<IconPlus size={16} />}
        >
          New Recommendation
        </Button>
      )}
      <div className={styles.userMenu}>
        {actionButtons}
        <Flex direction="column" w="100%">
          <Button
            component={Link}
            href={isBand ? '/user/band-dashboard' : '/user/dashboard'}
            variant={
              isActive(isBand ? '/user/band-dashboard' : '/user/dashboard') ? 'light' : 'subtle'
            }
            size="sm"
            leftSection={<IconHome size={16} />}
            fullWidth
            justify="flex-start"
          >
            Home
          </Button>
          <Button
            component={Link}
            href="/user/notifications"
            variant={isActive('/user/notifications') ? 'light' : 'subtle'}
            size="sm"
            leftSection={
              <Indicator
                label={unreadCount > 99 ? '99+' : unreadCount}
                size={14}
                disabled={unreadCount === 0}
                color="red"
                offset={-2}
              >
                <IconBell size={16} />
              </Indicator>
            }
            fullWidth
            justify="flex-start"
          >
            Notifications
          </Button>
          <Button
            component={Link}
            href="/discover"
            variant={isActive('/discover') ? 'light' : 'subtle'}
            size="sm"
            leftSection={<IconCompass size={16} />}
            fullWidth
            justify="flex-start"
          >
            Discover
          </Button>
          {user.username && (
            <Button
              component={Link}
              href={`/users/${user.username}`}
              variant={isActive(`/users/${user.username}`) ? 'light' : 'subtle'}
              size="sm"
              leftSection={<IconUser size={16} />}
              fullWidth
              justify="flex-start"
            >
              Profile
            </Button>
          )}
          <Button
            component={Link}
            href="/user/settings"
            variant={isActive('/user/settings') ? 'light' : 'subtle'}
            size="sm"
            leftSection={<IconSettings size={16} />}
            fullWidth
            justify="flex-start"
          >
            Settings
          </Button>
          {isAdmin && (
            <Button
              component={Link}
              href="/admin"
              variant={isActive('/admin') ? 'light' : 'subtle'}
              size="sm"
              color="red"
              leftSection={<IconShield size={16} />}
              fullWidth
              justify="flex-start"
            >
              Admin
            </Button>
          )}
        </Flex>
      </div>
    </Flex>
  );
}

// Mobile Bottom Navigation - rendered separately
export function MobileNav() {
  const { user, isBand, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/user/dashboard' || href === '/user/band-dashboard') {
      return pathname === '/user/dashboard' || pathname === '/user/band-dashboard';
    }
    if (href.startsWith('/users/')) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  if (!user) return null;

  return (
    <div className={styles.mobileNav}>
      <div className={styles.mobileNavInner}>
        <Link
          href={isBand ? '/user/band-dashboard' : '/user/dashboard'}
          className={`${styles.mobileNavButton} ${isActive(isBand ? '/user/band-dashboard' : '/user/dashboard') ? styles.mobileNavButtonActive : ''}`}
        >
          <IconHome size={20} />
          <span className={styles.mobileNavLabel}>Home</span>
        </Link>

        <Link
          href="/discover"
          className={`${styles.mobileNavButton} ${isActive('/discover') ? styles.mobileNavButtonActive : ''}`}
        >
          <IconCompass size={20} />
          <span className={styles.mobileNavLabel}>Discover</span>
        </Link>

        <Link
          href="/user/notifications"
          className={`${styles.mobileNavButton} ${isActive('/user/notifications') ? styles.mobileNavButtonActive : ''}`}
        >
          <Indicator
            label={unreadCount > 99 ? '99+' : unreadCount}
            size={14}
            disabled={unreadCount === 0}
            color="red"
            offset={2}
            styles={{ root: { lineHeight: 0 } }}
          >
            <IconBell size={20} />
          </Indicator>
          <span className={styles.mobileNavLabel}>Alerts</span>
        </Link>

        {user.username && (
          <Link
            href={`/users/${user.username}`}
            className={`${styles.mobileNavButton} ${isActive(`/users/${user.username}`) ? styles.mobileNavButtonActive : ''}`}
          >
            <IconUser size={20} />
            <span className={styles.mobileNavLabel}>Profile</span>
          </Link>
        )}

        <Link
          href="/user/settings"
          className={`${styles.mobileNavButton} ${isActive('/user/settings') ? styles.mobileNavButtonActive : ''}`}
        >
          <IconSettings size={20} />
          <span className={styles.mobileNavLabel}>Settings</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className={`${styles.mobileNavButton} ${styles.mobileNavButtonAdmin} ${isActive('/admin') ? styles.mobileNavButtonActive : ''}`}
          >
            <IconShield size={20} />
            <span className={styles.mobileNavLabel}>Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
