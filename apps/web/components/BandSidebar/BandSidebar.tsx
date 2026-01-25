'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBell,
  IconBrandApple,
  IconBrandBandcamp,
  IconBrandSpotify,
  IconBrandYoutube,
  IconCamera,
  IconCheck,
  IconCompass,
  IconEdit,
  IconHome,
  IconSettings,
  IconShield,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
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
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './BandSidebar.module.css';

interface BandSidebarProps {
  band: Band;
  /** Badge text to show (e.g., "5 recommendations") */
  badgeText?: string;
  /** Additional action buttons to render in view mode */
  actionButtons?: React.ReactNode;
  /** Callback when band is successfully saved */
  onBandSaved?: (updatedBand: Band) => void;
}

export function BandSidebar({ band, badgeText, actionButtons, onBandSaved }: BandSidebarProps) {
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();

  // Helper to check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/user/band-dashboard') {
      return pathname === '/user/band-dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editSpotifyLink, setEditSpotifyLink] = useState('');
  const [editBandcampLink, setEditBandcampLink] = useState('');
  const [editAppleMusicLink, setEditAppleMusicLink] = useState('');
  const [editYoutubeMusicLink, setEditYoutubeMusicLink] = useState('');
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const resetRef = useRef<() => void>(null);

  const handleStartEdit = () => {
    setEditName(band.name || '');
    setEditSlug(band.slug || '');
    setEditAbout(band.about || '');
    setEditCity(band.city || '');
    setEditRegion(band.region || '');
    setEditSpotifyLink(band.spotify_link || '');
    setEditBandcampLink(band.bandcamp_link || '');
    setEditAppleMusicLink(band.apple_music_link || '');
    setEditYoutubeMusicLink(band.youtube_music_link || '');
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
    if (!editName.trim()) {
      notifications.show({
        title: 'Name required',
        message: 'Please enter a band name.',
        color: 'red',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedBand = await apiClient.updateBand(band.slug, {
        name: editName,
        slug: editSlug,
        about: editAbout,
        city: editCity,
        region: editRegion,
        spotify_link: editSpotifyLink,
        bandcamp_link: editBandcampLink,
        apple_music_link: editAppleMusicLink,
        youtube_music_link: editYoutubeMusicLink,
        profile_picture: editProfileImage || undefined,
      });

      notifications.show({
        title: 'Band Updated',
        message: 'Your band profile has been updated successfully.',
        color: 'green',
      });

      setIsEditing(false);
      setEditProfileImage(null);
      setPreviewUrl(null);
      resetRef.current?.();
      onBandSaved?.(updatedBand);
    } catch (error) {
      console.error('Failed to update band:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update band profile. Please try again.',
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
              {previewUrl || band.profile_picture_url || band.spotify_image_url ? (
                <div className={styles.profilePhotoWrapper}>
                  <div className={styles.profilePhotoBlend}>
                    <img
                      src={previewUrl || fixImageUrl(band.profile_picture_url) || band.spotify_image_url}
                      alt="Profile preview"
                      className={styles.profilePhoto}
                    />
                  </div>
                </div>
              ) : (
                <Avatar size="72px" color="grape.6">
                  {editName.charAt(0).toUpperCase() || 'B'}
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
          </Group>

          {/* Band Name */}
          <TextInput
            label="Band Name"
            placeholder="Your Band Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          {/* Slug */}
          <TextInput
            label="Custom URL"
            description="goodsongs.app/bands/your-custom-url"
            placeholder="your-band-name"
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          />

          {/* About */}
          <Textarea
            label="About"
            placeholder="Tell fans about your band..."
            value={editAbout}
            onChange={(e) => setEditAbout(e.target.value)}
            minRows={3}
            autosize
          />

          {/* Location */}
          <Flex direction="column" gap="sm">
            <TextInput
              label="City"
              placeholder="Los Angeles"
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
            <TextInput
              label="State / Region"
              placeholder="California"
              value={editRegion}
              onChange={(e) => setEditRegion(e.target.value)}
            />
          </Flex>

          {/* Streaming Links */}
          <Divider label="Streaming Links" labelPosition="center" />

          <TextInput
            label="Spotify"
            placeholder="https://open.spotify.com/artist/..."
            value={editSpotifyLink}
            onChange={(e) => setEditSpotifyLink(e.target.value)}
            leftSection={<IconBrandSpotify size={16} />}
          />

          <TextInput
            label="Bandcamp"
            placeholder="https://yourband.bandcamp.com"
            value={editBandcampLink}
            onChange={(e) => setEditBandcampLink(e.target.value)}
            leftSection={<IconBrandBandcamp size={16} />}
          />

          <TextInput
            label="Apple Music"
            placeholder="https://music.apple.com/artist/..."
            value={editAppleMusicLink}
            onChange={(e) => setEditAppleMusicLink(e.target.value)}
            leftSection={<IconBrandApple size={16} />}
          />

          <TextInput
            label="YouTube Music"
            placeholder="https://music.youtube.com/channel/..."
            value={editYoutubeMusicLink}
            onChange={(e) => setEditYoutubeMusicLink(e.target.value)}
            leftSection={<IconBrandYoutube size={16} />}
          />

          {/* Action Buttons */}
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
          src={band.profile_picture_url || band.spotify_image_url}
          alt={band.name}
          size={72}
          fallback={band.name}
          href={`/bands/${band.slug}`}
        />
        <Stack gap="xs" flex={1}>
          <Title order={2} c="blue.8" fw={500} lh={1}>
            {band.name}
          </Title>
          {(band.city || band.region || band.location) && (
            <Text c="blue.7" size="sm" lh={1}>
              {band.city || band.region
                ? [band.city, band.region].filter(Boolean).join(', ')
                : band.location}
            </Text>
          )}
        </Stack>
      </Group>
      {band.about && (
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
            {band.about}
          </Text>
        </Spoiler>
      )}
      {badgeText && (
        <Group gap="xs">
          <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
            {badgeText}
          </Badge>
        </Group>
      )}
      <Button
        onClick={handleStartEdit}
        variant="light"
        leftSection={<IconEdit size={16} />}
        mt="sm"
      >
        Edit Band
      </Button>
      {actionButtons}
      <Button component={Link} href={`/bands/${band.slug}`} variant="light" size="sm">
        View Public Profile
      </Button>

      {/* Navigation Menu */}
      <div className={styles.userMenu}>
        <Flex direction="column" w="100%">
          <Button
            component={Link}
            href="/user/band-dashboard"
            variant={isActive('/user/band-dashboard') ? 'light' : 'subtle'}
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
