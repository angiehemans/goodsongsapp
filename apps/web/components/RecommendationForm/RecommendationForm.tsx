'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IconAlertCircle,
  IconBrandLastfm,
  IconPhoto,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import {
  Accordion,
  ActionIcon,
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { apiClient, ArtworkOption, DiscogsSearchResult, ReviewData } from '@/lib/api';
import classes from './RecommendationForm.module.css';

const aspectOptions = [
  { value: 'Vocals', label: 'Vocals' },
  { value: 'Lyrics', label: 'Lyrics' },
  { value: 'Melody', label: 'Melody' },
  { value: 'Beat', label: 'Beat' },
  { value: 'Production', label: 'Production' },
  { value: 'Instrumentation', label: 'Instrumentation' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Creativity', label: 'Creativity' },
];

const genreOptions = [
  'Alternative',
  'Art Rock',
  'Blues',
  'Classical',
  'Country',
  'Disco',
  'Electronic',
  'Folk',
  'Funk',
  'Hip Hop',
  'House',
  'Indie',
  'Jazz',
  'Latin',
  'Metal',
  'Pop',
  'Punk',
  'R&B',
  'Reggae',
  'Rock',
  'Soul',
  'Techno',
  'World',
];

export interface RecommendationFormProps {
  /** Initial values to prefill the form */
  initialValues?: Partial<ReviewData>;
  /** Called when the form is successfully submitted */
  onSuccess?: () => void;
  /** Called when the user cancels */
  onCancel?: () => void;
  /** Whether to show the prefilled alert */
  showPrefilledAlert?: boolean;
}

export function RecommendationForm({
  initialValues,
  onSuccess,
  onCancel,
  showPrefilledAlert = false,
}: RecommendationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [trackQuery, setTrackQuery] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [debouncedTrack] = useDebouncedValue(trackQuery, 600);
  const [debouncedArtist] = useDebouncedValue(artistQuery, 600);
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<DiscogsSearchResult | null>(null);
  const [artworkError, setArtworkError] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [lastSearchKey, setLastSearchKey] = useState('');

  // Artwork options state
  const [artworkOptions, setArtworkOptions] = useState<ArtworkOption[]>([]);
  const [artworkLoading, setArtworkLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ReviewData>({
    song_link: initialValues?.song_link || '',
    band_name: initialValues?.band_name || '',
    song_name: initialValues?.song_name || '',
    artwork_url: initialValues?.artwork_url || '',
    review_text: initialValues?.review_text || '',
    liked_aspects: initialValues?.liked_aspects || [],
    genres: initialValues?.genres || [],
    band_lastfm_artist_name: initialValues?.band_lastfm_artist_name,
    band_musicbrainz_id: initialValues?.band_musicbrainz_id,
  });

  // Determine if form was prefilled from initial values
  const isPrefilled = !!(initialValues?.song_name || initialValues?.band_name);

  // Minimum characters for search
  const MIN_SEARCH_LENGTH = 2;

  // Search for releases
  const handleSearch = useCallback(async (track: string, artist: string) => {
    const trimmedTrack = track.trim();
    const trimmedArtist = artist.trim();

    // Need at least one field with minimum length
    if (trimmedTrack.length < MIN_SEARCH_LENGTH && trimmedArtist.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      // Pass track and artist to Discogs API
      const response = await apiClient.searchDiscogs(
        trimmedTrack || undefined,
        trimmedArtist || undefined,
        10
      );
      setSearchResults(response.results || []);
    } catch (err) {
      console.error('Search failed:', err);
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
    const searchKey = `${trimmedTrack}|${trimmedArtist}`;

    // Check if we have enough input and it's a new search
    const hasEnoughInput =
      trimmedTrack.length >= MIN_SEARCH_LENGTH || trimmedArtist.length >= MIN_SEARCH_LENGTH;

    if (hasEnoughInput && !isPrefilled && !selectedRelease && searchKey !== lastSearchKey) {
      setLastSearchKey(searchKey);
      handleSearch(trimmedTrack, trimmedArtist);
    } else if (!hasEnoughInput) {
      setSearchResults([]);
      setHasSearched(false);
      setLastSearchKey('');
    }
  }, [debouncedTrack, debouncedArtist, isPrefilled, selectedRelease, lastSearchKey, handleSearch]);

  // Fetch artwork options from multiple sources
  const fetchArtworkOptions = useCallback(async (track: string, artist: string) => {
    setArtworkLoading(true);
    try {
      const response = await apiClient.searchArtwork(track, artist);
      setArtworkOptions(response.artwork_options || []);
    } catch (err) {
      console.error('Failed to fetch artwork options:', err);
      setArtworkOptions([]);
    } finally {
      setArtworkLoading(false);
    }
  }, []);

  // Select a release from search results
  const handleSelectRelease = async (result: DiscogsSearchResult) => {
    setSelectedRelease(result);
    setSearchResults([]);
    setTrackQuery('');
    setArtistQuery('');
    setLastSearchKey('');
    setArtworkError(false); // Reset artwork error for new selection
    setArtworkOptions([]); // Clear previous artwork options

    // Set form data from Discogs result
    setFormData((prev) => ({
      ...prev,
      song_name: result.song_name,
      band_name: result.band_name,
      artwork_url: result.artwork_url || '',
      song_link: result.discogs_url || '',
    }));

    // Fetch artwork options in background
    fetchArtworkOptions(result.song_name, result.band_name);
  };

  // Clear selected release and reset form
  const handleClearSelection = () => {
    setSelectedRelease(null);
    setArtworkOptions([]);
    setFormData((prev) => ({
      song_link: '',
      band_name: '',
      song_name: '',
      artwork_url: '',
      review_text: prev.review_text, // Keep the review text
      liked_aspects: prev.liked_aspects, // Keep the liked aspects
      band_lastfm_artist_name: undefined,
      band_musicbrainz_id: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Strip trailing asterisks from band name (fixes song lookup issues)
      const cleanedFormData = {
        ...formData,
        band_name: formData.band_name.replace(/\*+$/, '').trim(),
      };
      await apiClient.createReview(cleanedFormData);

      notifications.show({
        title: 'Recommendation created!',
        message: 'Your recommendation has been successfully submitted.',
        color: 'green',
      });

      // Reset form
      setFormData({
        song_link: '',
        band_name: '',
        song_name: '',
        artwork_url: '',
        review_text: '',
        liked_aspects: [],
        genres: [],
        band_lastfm_artist_name: undefined,
        band_musicbrainz_id: undefined,
      });
      setSelectedRelease(null);
      setTrackQuery('');
      setArtistQuery('');
      setLastSearchKey('');
      setManualEntry(false);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show search interface if no release is selected, not prefilled, and not in manual entry mode
  const showSearch = !isPrefilled && !selectedRelease && !formData.song_name && !manualEntry;

  return (
    <Stack>
      <Text size="sm" c="dimmed" mt="md">
        Share your favorite songs and help others discover great music!
      </Text>

      {showPrefilledAlert && isPrefilled && (
        <Alert
          icon={<IconBrandLastfm size="1rem" />}
          title="Prefilled from Last.fm"
          color="grape"
          variant="light"
        >
          This form has been prefilled with track information from your recently played songs.
        </Alert>
      )}

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      )}

      {/* Song Search Section */}
      {showSearch && (
        <Box>
          <Stack mb="xs">
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
          </Stack>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Paper withBorder radius="md" p={0} mah={300} style={{ overflow: 'auto' }}>
              <Stack gap={0}>
                {searchResults.map((result, index) => (
                  <Box
                    key={`${result.song_name}-${result.band_name}-${index}`}
                    p="sm"
                    className={classes.searchResult}
                    onClick={() => handleSelectRelease(result)}
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
                            e.currentTarget.nextElementSibling?.removeAttribute('style');
                          }}
                        />
                      ) : null}
                      <Center
                        w={40}
                        h={40}
                        bg="grape.1"
                        style={{
                          borderRadius: 'var(--mantine-radius-sm)',
                          flexShrink: 0,
                          display: result.artwork_url ? 'none' : 'flex',
                        }}
                      >
                        <img
                          src="/logo-grape.svg"
                          alt="Good Songs"
                          width={24}
                          height={24}
                          style={{ opacity: 0.8 }}
                        />
                      </Center>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {result.song_name}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {result.band_name}
                          {result.release_year && ` • ${result.release_year}`}
                        </Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            </Paper>
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
                No results found. Try a different search or enter details manually.
              </Text>
            )}

          <Text
            size="sm"
            c="grape.6"
            ta="center"
            py="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => setManualEntry(true)}
          >
            Can't find your song? Enter details manually
          </Text>
        </Box>
      )}

      {/* Selected Release Display */}
      {(selectedRelease || isPrefilled) && (
        <Paper p="sm" bg="grape.0" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              {formData.artwork_url && !artworkError ? (
                <img
                  src={formData.artwork_url}
                  alt="Album art"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--mantine-radius-sm)',
                    objectFit: 'cover',
                  }}
                  onError={() => setArtworkError(true)}
                />
              ) : (
                <Center
                  w={48}
                  h={48}
                  bg="grape.1"
                  style={{ borderRadius: 'var(--mantine-radius-sm)', flexShrink: 0 }}
                >
                  <img
                    src="/logo-grape.svg"
                    alt="Good Songs"
                    width={32}
                    height={32}
                    style={{ opacity: 0.8 }}
                  />
                </Center>
              )}
              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={600} lineClamp={1}>
                  {formData.song_name || 'Song name'}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {formData.band_name || 'Artist'}
                </Text>
              </Stack>
            </Group>
            {!isPrefilled && (
              <ActionIcon variant="subtle" color="gray" onClick={handleClearSelection}>
                <IconX size={16} />
              </ActionIcon>
            )}
          </Group>
        </Paper>
      )}

      {/* Manual Entry Mode Header */}
      {manualEntry && !selectedRelease && !isPrefilled && (
        <Group justify="space-between" align="center">
          <Text size="sm" fw={500}>
            Enter song details manually
          </Text>
          <Text
            size="sm"
            c="grape.6"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setManualEntry(false);
              setFormData((prev) => ({
                ...prev,
                song_name: '',
                band_name: '',
                song_link: '',
                artwork_url: '',
              }));
            }}
          >
            Back to search
          </Text>
        </Group>
      )}

      <form onSubmit={handleSubmit}>
        <Stack>
          {/* Manual Entry Fields - Show directly only in manual entry mode */}
          {manualEntry && !selectedRelease && !isPrefilled && (
            <>
              <Group grow>
                <TextInput
                  label="Song Name"
                  placeholder="Hey Jude"
                  required
                  value={formData.song_name || ''}
                  onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                />

                <TextInput
                  label="Band/Artist Name"
                  placeholder="The Beatles"
                  required
                  value={formData.band_name || ''}
                  onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                />
              </Group>

              <TextInput
                label="Song Link"
                placeholder="https://open.spotify.com/track/..."
                value={formData.song_link || ''}
                onChange={(e) => setFormData({ ...formData, song_link: e.target.value })}
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
                    formData.artwork_url ? (
                      <img
                        src={formData.artwork_url}
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
                  value={formData.artwork_url || null}
                  onChange={(value) => {
                    setFormData({ ...formData, artwork_url: value || '' });
                    setArtworkError(false);
                  }}
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
              ) : (
                <TextInput
                  label="Artwork URL"
                  placeholder="https://image.url/cover.jpg"
                  value={formData.artwork_url || ''}
                  onChange={(e) => setFormData({ ...formData, artwork_url: e.target.value })}
                />
              )}
            </>
          )}

          {/* Show form fields when a song is selected or prefilled */}
          {(selectedRelease || isPrefilled) && (
            <>
              {/* Artwork Selection - outside Advanced */}
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
                    formData.artwork_url ? (
                      <img
                        src={formData.artwork_url}
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
                  value={formData.artwork_url || null}
                  onChange={(value) => {
                    setFormData({ ...formData, artwork_url: value || '' });
                    setArtworkError(false);
                  }}
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

              <MultiSelect
                label="What did you like about this song?"
                placeholder="Select aspects you enjoyed"
                data={aspectOptions}
                value={formData.liked_aspects.map((aspect) =>
                  typeof aspect === 'string' ? aspect : aspect.name
                )}
                onChange={(values) =>
                  setFormData({
                    ...formData,
                    liked_aspects: values as (string | { name: string })[],
                  })
                }
                classNames={{
                  option: classes.option,
                }}
              />

              <Textarea
                label="Your Recommendation"
                placeholder="Share why you love this song..."
                minRows={4}
                required
                value={formData.review_text || ''}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              />

              {/* Advanced accordion for editing song details */}
              <Accordion variant="contained" radius="md">
                <Accordion.Item value="advanced">
                  <Accordion.Control>
                    <Text size="sm" c="dimmed">
                      Advanced
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="sm">
                      <Group grow>
                        <TextInput
                          label="Song Name"
                          placeholder="Hey Jude"
                          required
                          value={formData.song_name || ''}
                          onChange={(e) => setFormData({ ...formData, song_name: e.target.value })}
                        />

                        <TextInput
                          label="Band/Artist Name"
                          placeholder="The Beatles"
                          required
                          value={formData.band_name || ''}
                          onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                        />
                      </Group>

                      <TextInput
                        label="Song Link"
                        placeholder="https://open.spotify.com/track/..."
                        value={formData.song_link || ''}
                        onChange={(e) => setFormData({ ...formData, song_link: e.target.value })}
                      />

                      <TagsInput
                        label="Genres"
                        placeholder="Select or type genres"
                        data={genreOptions}
                        value={formData.genres || []}
                        onChange={(values) => setFormData({ ...formData, genres: values })}
                        clearable
                        maxTags={5}
                        description="Select from common genres or add your own"
                      />
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </>
          )}

          {/* Show these fields for manual entry mode */}
          {manualEntry && !selectedRelease && !isPrefilled && (
            <>
              <MultiSelect
                label="What did you like about this song?"
                placeholder="Select aspects you enjoyed"
                data={aspectOptions}
                value={formData.liked_aspects.map((aspect) =>
                  typeof aspect === 'string' ? aspect : aspect.name
                )}
                onChange={(values) =>
                  setFormData({
                    ...formData,
                    liked_aspects: values as (string | { name: string })[],
                  })
                }
                classNames={{
                  option: classes.option,
                }}
              />

              <Textarea
                label="Your Recommendation"
                placeholder="Share why you love this song..."
                minRows={4}
                required
                value={formData.review_text || ''}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              />
            </>
          )}

          <Group justify="flex-end">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!formData.song_name || !formData.band_name || !formData.review_text}
            >
              Create Recommendation
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
