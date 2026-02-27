'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IconCheck,
  IconMusic,
  IconPhoto,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { apiClient, ArtworkOption, DiscogsSearchResult, RecentlyPlayedTrack } from '@/lib/api';
import { AttachedSong } from '@/components/Posts/PostEditorContext';
import classes from './SongPickerModal.module.css';

interface SongPickerModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (song: AttachedSong) => void;
  initialSong?: AttachedSong | null;
}

export function SongPickerModal({ opened, onClose, onSelect, initialSong }: SongPickerModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('recent');

  // Recently played state
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Search state
  const [trackQuery, setTrackQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [debouncedTrack] = useDebouncedValue(trackQuery, 600);
  const [debouncedArtist] = useDebouncedValue(artistQuery, 600);
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingSong, setEditingSong] = useState<AttachedSong | null>(null);
  const [artworkOptions, setArtworkOptions] = useState<ArtworkOption[]>([]);
  const [artworkLoading, setArtworkLoading] = useState(false);

  const MIN_SEARCH_LENGTH = 2;

  // Fetch recently played on open
  useEffect(() => {
    if (opened && activeTab === 'recent') {
      fetchRecentlyPlayed();
    }
  }, [opened, activeTab]);

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setEditMode(false);
      setEditingSong(null);
      setTrackQuery('');
      setArtistQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setArtworkOptions([]);
    }
  }, [opened]);

  const fetchRecentlyPlayed = async () => {
    setLoadingRecent(true);
    try {
      const response = await apiClient.getRecentlyPlayed({ limit: 20 });
      setRecentlyPlayed(response.tracks || []);
    } catch {
      setRecentlyPlayed([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Search for songs
  const handleSearch = useCallback(async (track: string, artist: string) => {
    const trimmedTrack = track.trim();
    const trimmedArtist = artist.trim();

    if (trimmedTrack.length < MIN_SEARCH_LENGTH && trimmedArtist.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await apiClient.searchDiscogs(
        trimmedTrack || undefined,
        trimmedArtist || undefined,
        10
      );
      setSearchResults(response.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);

  // Trigger search when debounced queries change
  useEffect(() => {
    const trimmedTrack = debouncedTrack.trim();
    const trimmedArtist = debouncedArtist.trim();

    const hasEnoughInput =
      trimmedTrack.length >= MIN_SEARCH_LENGTH || trimmedArtist.length >= MIN_SEARCH_LENGTH;

    if (hasEnoughInput && !editMode) {
      handleSearch(trimmedTrack, trimmedArtist);
    } else if (!hasEnoughInput) {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [debouncedTrack, debouncedArtist, editMode, handleSearch]);

  // Fetch artwork options
  const fetchArtworkOptions = useCallback(async (track: string, artist: string, album?: string) => {
    setArtworkLoading(true);
    try {
      const response = await apiClient.searchArtwork(track, artist, album);
      setArtworkOptions(response.artwork_options || []);
    } catch {
      setArtworkOptions([]);
    } finally {
      setArtworkLoading(false);
    }
  }, []);

  // Select a recently played track
  const handleSelectRecentlyPlayed = (track: RecentlyPlayedTrack) => {
    const song: AttachedSong = {
      song_name: track.name,
      band_name: track.artist,
      album_name: track.album || undefined,
      artwork_url: track.album_art_url || undefined,
    };
    onSelect(song);
  };

  // Select a search result - enter edit mode
  const handleSelectSearchResult = (result: DiscogsSearchResult) => {
    const song: AttachedSong = {
      song_name: result.song_name,
      band_name: result.band_name,
      album_name: result.album_title || undefined,
      artwork_url: result.artwork_url || undefined,
      song_link: result.discogs_url || undefined,
    };
    setEditingSong(song);
    setEditMode(true);
    setSearchResults([]);

    // Fetch artwork options
    fetchArtworkOptions(result.song_name, result.band_name, result.album_title);
  };

  // Confirm selection from edit mode
  const handleConfirmSelection = () => {
    if (editingSong) {
      onSelect(editingSong);
    }
  };

  // Update editing song field
  const updateEditingSong = (field: keyof AttachedSong, value: string) => {
    setEditingSong((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Go back from edit mode
  const handleBackFromEdit = () => {
    setEditMode(false);
    setEditingSong(null);
    setArtworkOptions([]);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Attach Song"
      size="md"
      centered
    >
      {editMode && editingSong ? (
        // Edit Mode
        <Stack gap="md">
          <Paper p="sm" radius="md" style={{ backgroundColor: 'var(--gs-bg-accent)' }}>
            <Group gap="sm" wrap="nowrap">
              {editingSong.artwork_url ? (
                <img
                  src={editingSong.artwork_url}
                  alt="Album art"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--mantine-radius-sm)',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <Center
                  w={64}
                  h={64}
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    backgroundColor: 'var(--gs-bg-surface-alt)',
                  }}
                >
                  <IconMusic size={32} color="var(--gs-text-muted)" />
                </Center>
              )}
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="md" fw={600} lineClamp={1}>
                  {editingSong.song_name}
                </Text>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {editingSong.band_name}
                </Text>
                {editingSong.album_name && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {editingSong.album_name}
                  </Text>
                )}
              </Stack>
            </Group>
          </Paper>

          <TextInput
            label="Song Name"
            value={editingSong.song_name}
            onChange={(e) => updateEditingSong('song_name', e.target.value)}
            required
          />

          <TextInput
            label="Artist"
            value={editingSong.band_name}
            onChange={(e) => updateEditingSong('band_name', e.target.value)}
            required
          />

          <TextInput
            label="Album (optional)"
            value={editingSong.album_name || ''}
            onChange={(e) => updateEditingSong('album_name', e.target.value)}
          />

          {/* Artwork Selection */}
          {artworkLoading ? (
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Loading artwork options...
              </Text>
              <Loader size="xs" />
            </Group>
          ) : artworkOptions.length > 0 ? (
            <Select
              label="Artwork"
              placeholder="Select artwork"
              leftSection={
                editingSong.artwork_url ? (
                  <img
                    src={editingSong.artwork_url}
                    alt=""
                    style={{ width: 20, height: 20, borderRadius: 2, objectFit: 'cover' }}
                  />
                ) : (
                  <IconPhoto size={16} />
                )
              }
              data={artworkOptions.map((opt) => ({
                value: opt.url,
                label: `${opt.source_display}${opt.album_name ? ` - ${opt.album_name}` : ''}${opt.year ? ` (${opt.year})` : opt.release_date ? ` (${opt.release_date.slice(0, 4)})` : ''}`,
              }))}
              value={editingSong.artwork_url || null}
              onChange={(value) => updateEditingSong('artwork_url', value || '')}
              renderOption={({ option }) => (
                <Group gap="sm" wrap="nowrap">
                  <img
                    src={option.value}
                    alt=""
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 4,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Text size="sm" lineClamp={1}>
                    {option.label}
                  </Text>
                </Group>
              )}
              searchable
              clearable
              allowDeselect
            />
          ) : null}

          <Group justify="space-between" mt="md">
            <Button variant="subtle" color="gray" onClick={handleBackFromEdit}>
              Back
            </Button>
            <Button
              color="grape"
              leftSection={<IconCheck size={16} />}
              onClick={handleConfirmSelection}
              disabled={!editingSong.song_name || !editingSong.band_name}
            >
              Attach Song
            </Button>
          </Group>
        </Stack>
      ) : (
        // Selection Mode
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="recent" leftSection={<IconMusic size={16} />}>
              Recently Played
            </Tabs.Tab>
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              Search
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="recent">
            {loadingRecent ? (
              <Center py="xl">
                <Loader size="md" />
              </Center>
            ) : recentlyPlayed.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No recently played tracks found. Connect your Last.fm account to see your
                listening history.
              </Text>
            ) : (
              <ScrollArea h={300}>
                <Stack gap={0}>
                  {recentlyPlayed.map((track, index) => (
                    <Box
                      key={`${track.name}-${track.artist}-${index}`}
                      p="sm"
                      className={classes.trackItem}
                      onClick={() => handleSelectRecentlyPlayed(track)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        {track.album_art_url ? (
                          <img
                            src={track.album_art_url}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 'var(--mantine-radius-sm)',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Center
                            w={40}
                            h={40}
                            style={{
                              borderRadius: 'var(--mantine-radius-sm)',
                              flexShrink: 0,
                              backgroundColor: 'var(--gs-bg-accent)',
                            }}
                          >
                            <IconMusic size={20} color="var(--gs-text-muted)" />
                          </Center>
                        )}
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {track.name}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {track.artist}
                          </Text>
                        </Stack>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="search">
            <Stack gap="sm">
              <TextInput
                placeholder="Song name..."
                leftSection={<IconSearch size={16} />}
                rightSection={isSearching && trackQuery ? <Loader size={16} /> : null}
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
              />
              <TextInput
                placeholder="Artist name (optional)..."
                leftSection={<IconUser size={16} />}
                rightSection={isSearching && artistQuery && !trackQuery ? <Loader size={16} /> : null}
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <ScrollArea h={250}>
                  <Stack gap={0}>
                    {searchResults.map((result, index) => (
                      <Box
                        key={`${result.song_name}-${result.band_name}-${index}`}
                        p="sm"
                        className={classes.trackItem}
                        onClick={() => handleSelectSearchResult(result)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Group gap="sm" wrap="nowrap">
                          {result.artwork_url ? (
                            <img
                              src={result.artwork_url}
                              alt=""
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--mantine-radius-sm)',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Center
                              w={40}
                              h={40}
                              style={{
                                borderRadius: 'var(--mantine-radius-sm)',
                                flexShrink: 0,
                                backgroundColor: 'var(--gs-bg-accent)',
                              }}
                            >
                              <IconMusic size={20} color="var(--gs-text-muted)" />
                            </Center>
                          )}
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {result.song_name}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {result.band_name}
                              {result.release_year && ` \u2022 ${result.release_year}`}
                            </Text>
                          </Stack>
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                </ScrollArea>
              )}

              {(trackQuery.length >= MIN_SEARCH_LENGTH || artistQuery.length >= MIN_SEARCH_LENGTH) &&
                isSearching &&
                searchResults.length === 0 && (
                  <Center py="md">
                    <Loader size="sm" />
                  </Center>
                )}

              {hasSearched &&
                !isSearching &&
                searchResults.length === 0 &&
                (trackQuery.length >= MIN_SEARCH_LENGTH || artistQuery.length >= MIN_SEARCH_LENGTH) && (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No results found. Try a different search.
                  </Text>
                )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}
    </Modal>
  );
}
