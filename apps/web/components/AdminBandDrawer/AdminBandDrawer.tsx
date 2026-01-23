'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconCalendarEvent,
  IconCamera,
  IconExternalLink,
  IconMusic,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Drawer,
  FileButton,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import {
  AdminBandDetail,
  AdminBandUpdateData,
  apiClient,
  Band,
  Event,
  Review,
} from '@/lib/api';
import { extractBandcampEmbedUrl, fixImageUrl } from '@/lib/utils';

interface AdminBandDrawerProps {
  bandId: number | null;
  opened: boolean;
  onClose: () => void;
  onBandUpdated?: (band: Band) => void;
  onDeleteClick?: (bandId: number, bandName: string) => void;
}

export function AdminBandDrawer({
  bandId,
  opened,
  onClose,
  onBandUpdated,
  onDeleteClick,
}: AdminBandDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bandDetail, setBandDetail] = useState<AdminBandDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('details');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [spotifyLink, setSpotifyLink] = useState('');
  const [bandcampLink, setBandcampLink] = useState('');
  const [bandcampEmbed, setBandcampEmbed] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [youtubeMusicLink, setYoutubeMusicLink] = useState('');
  const [musicbrainzId, setMusicbrainzId] = useState('');
  const [lastfmArtistName, setLastfmArtistName] = useState('');
  const [artistImageUrl, setArtistImageUrl] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetRef = useRef<() => void>(null);

  const fetchBandDetail = useCallback(async () => {
    if (!bandId) return;

    setLoading(true);
    try {
      const data = await apiClient.getAdminBandDetail(bandId);
      setBandDetail(data.band);
      setReviews(data.reviews || []);
      setEvents(data.events || []);

      // Initialize form state
      setName(data.band.name || '');
      setSlug(data.band.slug || '');
      setAbout(data.band.about || '');
      setCity(data.band.city || '');
      setRegion(data.band.region || '');
      setDisabled(data.band.disabled || false);
      setSpotifyLink(data.band.spotify_link || '');
      setBandcampLink(data.band.bandcamp_link || '');
      setBandcampEmbed(data.band.bandcamp_embed || '');
      setAppleMusicLink(data.band.apple_music_link || '');
      setYoutubeMusicLink(data.band.youtube_music_link || '');
      setMusicbrainzId(data.band.musicbrainz_id || '');
      setLastfmArtistName(data.band.lastfm_artist_name || '');
      setArtistImageUrl(data.band.artist_image_url || '');
      const imageUrl = fixImageUrl(data.band.profile_picture_url);
      setPreviewUrl(imageUrl !== undefined ? imageUrl : null);
      setProfilePicture(null);
    } catch (error) {
      console.error('Failed to fetch band detail:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load band details.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    if (opened && bandId) {
      setActiveTab('details');
      fetchBandDetail();
    }
  }, [opened, bandId, fetchBandDetail]);

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
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setProfilePicture(null);
    const originalUrl = bandDetail?.profile_picture_url ? fixImageUrl(bandDetail.profile_picture_url) : undefined;
    setPreviewUrl(originalUrl !== undefined ? originalUrl : null);
    resetRef.current?.();
  };

  const handleSave = async () => {
    if (!bandId || !bandDetail) return;

    if (!name.trim()) {
      notifications.show({
        title: 'Name required',
        message: 'Please enter a band name.',
        color: 'red',
      });
      return;
    }

    setSaving(true);
    try {
      // Always send all fields so empty values clear the field in the API
      const updateData: AdminBandUpdateData = {
        name: name.trim(),
        slug: slug.trim(),
        about: about.trim(),
        city: city.trim(),
        region: region.trim(),
        disabled,
        spotify_link: spotifyLink.trim(),
        bandcamp_link: bandcampLink.trim(),
        bandcamp_embed: extractBandcampEmbedUrl(bandcampEmbed),
        apple_music_link: appleMusicLink.trim(),
        youtube_music_link: youtubeMusicLink.trim(),
        musicbrainz_id: musicbrainzId.trim(),
        lastfm_artist_name: lastfmArtistName.trim(),
        artist_image_url: artistImageUrl.trim(),
      };

      if (profilePicture) {
        updateData.profile_picture = profilePicture;
      }

      const response = await apiClient.updateAdminBand(bandId, updateData);

      notifications.show({
        title: 'Success',
        message: response.message || 'Band updated successfully.',
        color: 'green',
      });

      setBandDetail(response.band);
      setProfilePicture(null);

      // Notify parent to update the list
      if (onBandUpdated) {
        onBandUpdated(response.band);
      }
    } catch (error) {
      console.error('Failed to update band:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update band.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!bandId || !bandDetail) return;
    onDeleteClick?.(bandId, bandDetail.name);
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <span>Band Details</span>
          {bandDetail?.disabled && (
            <Badge color="gray" size="sm">
              Disabled
            </Badge>
          )}
        </Group>
      }
      position="right"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : !bandDetail ? (
        <Center py="xl">
          <Text c="dimmed">Band not found</Text>
        </Center>
      ) : (
        <Stack gap="md">
          {/* Band Header */}
          <Group>
            <Box pos="relative">
              <Avatar
                size="xl"
                src={previewUrl}
                color="grape"
              >
                {name?.charAt(0).toUpperCase() || 'B'}
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
                    pos="absolute"
                    bottom={0}
                    right={0}
                  >
                    <IconCamera size={14} />
                  </ActionIcon>
                )}
              </FileButton>
            </Box>
            <Stack gap={4} style={{ flex: 1 }}>
              <Title order={4}>{name || 'Unnamed Band'}</Title>
              <Text size="sm" c="dimmed">
                {[city, region].filter(Boolean).join(', ') || 'No location'}
              </Text>
              <Group gap="xs">
                <Badge variant="light" color="grape" size="sm">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="light" color="blue" size="sm">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </Badge>
                {bandDetail.user_owned && (
                  <Badge variant="light" color="green" size="sm">
                    User Owned
                  </Badge>
                )}
              </Group>
            </Stack>
            {slug && (
              <Button
                component={Link}
                href={`/bands/${slug}`}
                target="_blank"
                variant="light"
                size="xs"
                rightSection={<IconExternalLink size={14} />}
              >
                View Profile
              </Button>
            )}
          </Group>

          {/* Owner info */}
          {bandDetail.owner && (
            <Group
              p="sm"
              style={{
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--mantine-color-gray-0)',
              }}
            >
              <Text size="sm" c="dimmed">
                Owner:
              </Text>
              <Text
                component={Link}
                href={`/users/${bandDetail.owner.username}`}
                target="_blank"
                size="sm"
                c="grape.6"
                fw={500}
                style={{ textDecoration: 'none' }}
              >
                @{bandDetail.owner.username}
              </Text>
              <Text size="sm" c="dimmed">
                ({bandDetail.owner.email})
              </Text>
            </Group>
          )}

          {profilePicture && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                New image selected:
              </Text>
              <Text size="sm" fw={500}>
                {profilePicture.name}
              </Text>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={handleRemoveImage}
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>
          )}

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="details">Details</Tabs.Tab>
              <Tabs.Tab value="reviews">Reviews ({reviews.length})</Tabs.Tab>
              <Tabs.Tab value="events">Events ({events.length})</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details" pt="md">
              <ScrollArea h="calc(100vh - 420px)" offsetScrollbars>
                <Stack gap="md">
                  <TextInput
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <TextInput
                    label="Slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-friendly-name"
                    description="URL-friendly identifier"
                  />

                  <Textarea
                    label="About"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Band description..."
                    minRows={3}
                  />

                  <Group grow>
                    <TextInput
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                    <TextInput
                      label="Region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="State / Region"
                    />
                  </Group>

                  <Switch
                    label="Disabled"
                    description="Disabled bands are hidden from public pages"
                    checked={disabled}
                    onChange={(e) => setDisabled(e.currentTarget.checked)}
                    color="red"
                  />

                  <Title order={5} mt="md">
                    Music Links
                  </Title>

                  <TextInput
                    label="Spotify Link"
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                  />

                  <TextInput
                    label="Bandcamp Link"
                    value={bandcampLink}
                    onChange={(e) => setBandcampLink(e.target.value)}
                    placeholder="https://yourband.bandcamp.com"
                  />

                  <Textarea
                    label="Bandcamp Embed"
                    value={bandcampEmbed}
                    onChange={(e) => setBandcampEmbed(e.target.value)}
                    placeholder="Paste iframe code or URL from Bandcamp's Share > Embed"
                    description="Paste the full iframe code from Bandcamp - we'll extract what we need. If set, shows Bandcamp player instead of Spotify."
                    minRows={2}
                  />

                  <TextInput
                    label="Apple Music Link"
                    value={appleMusicLink}
                    onChange={(e) => setAppleMusicLink(e.target.value)}
                    placeholder="https://music.apple.com/..."
                  />

                  <TextInput
                    label="YouTube Music Link"
                    value={youtubeMusicLink}
                    onChange={(e) => setYoutubeMusicLink(e.target.value)}
                    placeholder="https://music.youtube.com/..."
                  />

                  <Title order={5} mt="md">
                    Metadata
                  </Title>

                  <TextInput
                    label="MusicBrainz ID"
                    value={musicbrainzId}
                    onChange={(e) => setMusicbrainzId(e.target.value)}
                    placeholder="MusicBrainz artist ID"
                  />

                  <TextInput
                    label="Last.fm Artist Name"
                    value={lastfmArtistName}
                    onChange={(e) => setLastfmArtistName(e.target.value)}
                    placeholder="Last.fm artist name"
                  />

                  <TextInput
                    label="Artist Image URL"
                    value={artistImageUrl}
                    onChange={(e) => setArtistImageUrl(e.target.value)}
                    placeholder="External artist image URL"
                  />

                  <Text size="xs" c="dimmed">
                    Created: {new Date(bandDetail.created_at).toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Updated: {new Date(bandDetail.updated_at).toLocaleString()}
                  </Text>
                </Stack>
              </ScrollArea>
            </Tabs.Panel>

            <Tabs.Panel value="reviews" pt="md">
              <ScrollArea h="calc(100vh - 420px)" offsetScrollbars>
                {reviews.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <IconMusic size={48} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" ta="center">
                        No reviews yet.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Tabs.Panel>

            <Tabs.Panel value="events" pt="md">
              <ScrollArea h="calc(100vh - 420px)" offsetScrollbars>
                {events.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <IconCalendarEvent size={48} color="var(--mantine-color-gray-5)" />
                      <Text c="dimmed" ta="center">
                        No events yet.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    {events.map((event) => (
                      <Group
                        key={event.id}
                        p="sm"
                        style={{
                          border: '1px solid var(--mantine-color-gray-3)',
                          borderRadius: 'var(--mantine-radius-md)',
                        }}
                      >
                        {event.image_url && (
                          <Avatar
                            size="md"
                            src={event.image_url}
                            radius="sm"
                          />
                        )}
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Text fw={500}>{event.name}</Text>
                          <Text size="sm" c="dimmed">
                            {formatEventDate(event.event_date)}
                          </Text>
                          {event.venue && (
                            <Text size="xs" c="dimmed">
                              {event.venue.name}, {event.venue.city}
                            </Text>
                          )}
                        </Stack>
                        <Button
                          component={Link}
                          href={`/events/${event.id}`}
                          target="_blank"
                          variant="light"
                          size="xs"
                          rightSection={<IconExternalLink size={14} />}
                        >
                          View
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Tabs.Panel>
          </Tabs>

          {/* Actions */}
          <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleDelete}
            >
              Delete Band
            </Button>
            <Group gap="sm">
              <Button variant="light" color="gray" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                Save Changes
              </Button>
            </Group>
          </Group>
        </Stack>
      )}
    </Drawer>
  );
}
