import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "@react-native-vector-icons/feather";
import { Header, TextInput, Button, MentionTextInput } from "@/components";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { apiClient, ArtworkOption, DiscogsSearchResult } from "@/utils/api";
import { fixImageUrl } from "@/utils/imageUrl";
import { CreateReviewParams } from "@/navigation/types";

const LIKED_ASPECTS = [
  "Vocals",
  "Lyrics",
  "Melody",
  "Beat",
  "Production",
  "Instrumentation",
  "Energy",
  "Creativity",
];

const GENRE_OPTIONS = [
  "Alternative",
  "Art Rock",
  "Blues",
  "Classical",
  "Country",
  "Disco",
  "Electronic",
  "Folk",
  "Funk",
  "Hip Hop",
  "House",
  "Indie",
  "Jazz",
  "Latin",
  "Metal",
  "Pop",
  "Punk",
  "R&B",
  "Reggae",
  "Rock",
  "Soul",
  "Techno",
  "World",
];

interface FormData {
  song_link: string;
  band_name: string;
  song_name: string;
  artwork_url: string;
  review_text: string;
  liked_aspects: string[];
  genres: string[];
  band_lastfm_artist_name?: string;
  band_musicbrainz_id?: string;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Minimum characters required before searching
const MIN_SEARCH_LENGTH = 3;

export function CreateReviewScreen({ navigation, route }: any) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );
  const params = route.params as CreateReviewParams | undefined;
  const scrollViewRef = useRef<ScrollView>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Edit mode detection
  const isEditMode = !!params?.reviewId;

  // Search state
  const [trackQuery, setTrackQuery] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiscogsSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<DiscogsSearchResult | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [artworkError, setArtworkError] = useState(false);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Artwork options state
  const [artworkOptions, setArtworkOptions] = useState<ArtworkOption[]>([]);
  const [artworkLoading, setArtworkLoading] = useState(false);
  const [showArtworkPicker, setShowArtworkPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Track last searched query to prevent duplicate API calls
  const lastSearchKey = useRef<string>("");

  // Debounced search queries - 600ms delay to reduce API calls
  const debouncedTrack = useDebounce(trackQuery, 600);
  const debouncedArtist = useDebounce(artistQuery, 600);

  // Form data
  const [formData, setFormData] = useState<FormData>({
    song_link: "",
    band_name: "",
    song_name: "",
    artwork_url: "",
    review_text: "",
    liked_aspects: [],
    genres: [],
  });
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      const currentParams = paramsRef.current;

      // Reset search state
      setTrackQuery("");
      setArtistQuery("");
      setSearchResults([]);
      setHasSearched(false);
      setSelectedRelease(null);
      setManualEntry(false);
      setArtworkError(false);
      setArtworkOptions([]);
      setShowArtworkPicker(false);
      setShowAdvanced(false);
      lastSearchKey.current = "";

      // Always start with a clean form on focus
      const newFormData: FormData = {
        song_link: "",
        band_name: "",
        song_name: "",
        artwork_url: "",
        review_text: "",
        liked_aspects: [],
        genres: [],
      };
      setShowGenrePicker(false);
      setCustomGenre("");

      // Prefill from params if available (for prefill or edit mode)
      if (currentParams?.song_name || currentParams?.band_name) {
        newFormData.song_link = currentParams.song_link || "";
        newFormData.band_name = currentParams.band_name || "";
        newFormData.song_name = currentParams.song_name || "";
        newFormData.artwork_url = currentParams.artwork_url || "";
        newFormData.band_lastfm_artist_name =
          currentParams.band_lastfm_artist_name;
        newFormData.band_musicbrainz_id = currentParams.band_musicbrainz_id;
        // Prefill edit-specific fields
        if (currentParams.review_text) {
          newFormData.review_text = currentParams.review_text;
        }
        if (currentParams.liked_aspects) {
          newFormData.liked_aspects = currentParams.liked_aspects;
        }
        setIsPrefilled(true);

        // Only clear params if not in edit mode (we need reviewId to stay)
        if (!currentParams.reviewId) {
          setTimeout(() => {
            navigation.setParams({
              song_link: undefined,
              band_name: undefined,
              song_name: undefined,
              artwork_url: undefined,
              band_lastfm_artist_name: undefined,
              band_musicbrainz_id: undefined,
            });
          }, 0);
        }
      } else {
        setIsPrefilled(false);
      }

      setFormData(newFormData);

      // Fetch artwork options in edit mode or when prefilled
      if (currentParams?.song_name && currentParams?.band_name) {
        fetchArtworkOptions(currentParams.song_name, currentParams.band_name);
      }
    }, [navigation]),
  );

  // Trigger search when debounced queries change
  useEffect(() => {
    const trimmedTrack = debouncedTrack.trim();
    const trimmedArtist = debouncedArtist.trim();
    const searchKey = `${trimmedTrack}|${trimmedArtist}`;

    // Check if we have enough input
    const hasEnoughInput =
      trimmedTrack.length >= MIN_SEARCH_LENGTH ||
      trimmedArtist.length >= MIN_SEARCH_LENGTH;

    // Only search if:
    // - At least one query meets minimum length
    // - Not prefilled, no release selected, not in manual mode
    // - Search key is different from last search (prevent duplicates)
    if (
      hasEnoughInput &&
      !isPrefilled &&
      !selectedRelease &&
      !manualEntry &&
      searchKey !== lastSearchKey.current
    ) {
      lastSearchKey.current = searchKey;
      handleSearch(trimmedTrack, trimmedArtist);
    } else if (!hasEnoughInput) {
      setSearchResults([]);
      setHasSearched(false);
      lastSearchKey.current = "";
    }
  }, [
    debouncedTrack,
    debouncedArtist,
    isPrefilled,
    selectedRelease,
    manualEntry,
  ]);

  const handleSearch = async (track: string, artist: string) => {
    // Need at least one field with minimum length
    if (track.length < MIN_SEARCH_LENGTH && artist.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await apiClient.searchDiscogs(
        track || undefined,
        artist || undefined,
        10,
      );
      setSearchResults(response.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  // Fetch artwork options from multiple sources
  const fetchArtworkOptions = async (track: string, artist: string) => {
    setArtworkLoading(true);
    try {
      const response = await apiClient.searchArtwork(track, artist);
      setArtworkOptions(response.artwork_options || []);
    } catch (err) {
      console.error("Failed to fetch artwork options:", err);
      setArtworkOptions([]);
    } finally {
      setArtworkLoading(false);
    }
  };

  const handleSelectRelease = (result: DiscogsSearchResult) => {
    setSelectedRelease(result);
    setSearchResults([]);
    setTrackQuery("");
    setArtistQuery("");
    lastSearchKey.current = "";
    setArtworkError(false);
    setArtworkOptions([]); // Clear previous artwork options

    setFormData((prev) => ({
      ...prev,
      song_name: result.song_name,
      band_name: result.band_name,
      artwork_url: result.artwork_url || "",
      song_link: result.discogs_url || "",
    }));

    // Fetch artwork options in background
    fetchArtworkOptions(result.song_name, result.band_name);
  };

  const handleClearSelection = () => {
    setSelectedRelease(null);
    setArtworkError(false);
    setArtworkOptions([]);
    setFormData((prev) => ({
      song_link: "",
      band_name: "",
      song_name: "",
      artwork_url: "",
      review_text: prev.review_text,
      liked_aspects: prev.liked_aspects,
      genres: prev.genres,
      band_lastfm_artist_name: undefined,
      band_musicbrainz_id: undefined,
    }));
  };

  const handleSelectArtwork = (option: ArtworkOption) => {
    setFormData((prev) => ({ ...prev, artwork_url: option.url }));
    setArtworkError(false);
    setShowArtworkPicker(false);
  };

  const handleEnterManually = () => {
    setManualEntry(true);
    setTrackQuery("");
    setArtistQuery("");
    setSearchResults([]);
    setHasSearched(false);
    lastSearchKey.current = "";
  };

  const handleBackToSearch = () => {
    setManualEntry(false);
    setFormData((prev) => ({
      ...prev,
      song_name: "",
      band_name: "",
      song_link: "",
      artwork_url: "",
    }));
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAspect = (aspect: string) => {
    setFormData((prev) => ({
      ...prev,
      liked_aspects: prev.liked_aspects.includes(aspect)
        ? prev.liked_aspects.filter((a) => a !== aspect)
        : [...prev.liked_aspects, aspect],
    }));
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : prev.genres.length < 5
          ? [...prev.genres, genre]
          : prev.genres, // Max 5 genres
    }));
  };

  const addCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (
      trimmed &&
      !formData.genres.includes(trimmed) &&
      formData.genres.length < 5
    ) {
      setFormData((prev) => ({
        ...prev,
        genres: [...prev.genres, trimmed],
      }));
      setCustomGenre("");
    }
  };

  const isFormValid = () => {
    return (
      formData.band_name.trim() !== "" &&
      formData.song_name.trim() !== "" &&
      formData.review_text.trim() !== ""
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // Strip trailing asterisks from band name (fixes song lookup issues)
      const cleanBandName = formData.band_name
        .trim()
        .replace(/\*+$/, "")
        .trim();

      if (isEditMode && params?.reviewId) {
        // Update existing review
        await apiClient.updateReview(params.reviewId, {
          review_text: formData.review_text.trim(),
          liked_aspects:
            formData.liked_aspects.length > 0
              ? formData.liked_aspects
              : undefined,
          artwork_url: formData.artwork_url.trim() || undefined,
        });

        // Reset state and go back to the review detail screen
        setSubmitting(false);
        navigation.goBack();
      } else {
        // Create new review
        await apiClient.createReview({
          song_link: formData.song_link.trim() || "",
          band_name: cleanBandName,
          song_name: formData.song_name.trim(),
          artwork_url: formData.artwork_url.trim() || undefined,
          review_text: formData.review_text.trim(),
          liked_aspects:
            formData.liked_aspects.length > 0
              ? formData.liked_aspects
              : undefined,
          genres: formData.genres.length > 0 ? formData.genres : undefined,
          band_lastfm_artist_name: formData.band_lastfm_artist_name,
          band_musicbrainz_id: formData.band_musicbrainz_id,
        });

        // Reset state
        setSubmitting(false);
        setSelectedRelease(null);
        setManualEntry(false);
        setTrackQuery("");
        setArtistQuery("");
        lastSearchKey.current = "";
        navigation.navigate("Home", { showSuccess: true });
      }
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert("Error", error.message || "Failed to save recommendation");
    }
  };

  // Show search interface if no release is selected, not prefilled, not in edit mode, and not in manual entry mode
  const showSearch =
    !isPrefilled &&
    !selectedRelease &&
    !formData.song_name &&
    !manualEntry &&
    !isEditMode;

  return (
    <SafeAreaView
      style={[styles.container, themedStyles.container]}
      edges={["top"]}
    >
      <Header
        title={isEditMode ? "Edit Recommendation" : "Recommend"}
        showBackButton={isEditMode}
        onBackPress={isEditMode ? () => navigation.goBack() : undefined}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {!isEditMode && (
            <Text style={[styles.subtitle, themedStyles.subtitle]}>
              Share your favorite songs and help others discover great music!
            </Text>
          )}

          {/* Song Search Section */}
          {showSearch && (
            <View style={styles.searchSection}>
              <View
                style={[
                  styles.searchInputContainer,
                  themedStyles.searchInputContainer,
                ]}
              >
                <Icon
                  name="search"
                  size={18}
                  color={themeColors.textPlaceholder}
                  style={styles.searchIcon}
                />
                <RNTextInput
                  style={[styles.searchInput, themedStyles.searchInput]}
                  placeholder="Song name..."
                  placeholderTextColor={themeColors.textPlaceholder}
                  value={trackQuery}
                  onChangeText={setTrackQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && trackQuery && (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.textMuted}
                    style={styles.searchLoader}
                  />
                )}
              </View>

              <View
                style={[
                  styles.searchInputContainer,
                  themedStyles.searchInputContainer,
                  styles.artistInputContainer,
                ]}
              >
                <Icon
                  name="user"
                  size={18}
                  color={themeColors.textPlaceholder}
                  style={styles.searchIcon}
                />
                <RNTextInput
                  style={[styles.searchInput, themedStyles.searchInput]}
                  placeholder="Artist name (optional)..."
                  placeholderTextColor={themeColors.textPlaceholder}
                  value={artistQuery}
                  onChangeText={setArtistQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && artistQuery && !trackQuery && (
                  <ActivityIndicator
                    size="small"
                    color={themeColors.textMuted}
                    style={styles.searchLoader}
                  />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View
                  style={[styles.searchResults, themedStyles.searchResults]}
                >
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {searchResults.map((result, index) => (
                      <TouchableOpacity
                        key={`${result.song_name}-${result.band_name}-${index}`}
                        style={[
                          styles.searchResultItem,
                          themedStyles.searchResultItem,
                        ]}
                        onPress={() => handleSelectRelease(result)}
                      >
                        {result.artwork_url ? (
                          <Image
                            source={{ uri: fixImageUrl(result.artwork_url) }}
                            style={styles.resultArtwork}
                            onError={() => {}}
                          />
                        ) : (
                          <View
                            style={[
                              styles.resultArtwork,
                              styles.resultArtworkPlaceholder,
                              themedStyles.resultArtworkPlaceholder,
                            ]}
                          >
                            <Icon
                              name="music"
                              size={16}
                              color={themeColors.textMuted}
                            />
                          </View>
                        )}
                        <View style={styles.resultInfo}>
                          <Text
                            style={[
                              styles.resultSongName,
                              themedStyles.resultSongName,
                            ]}
                            numberOfLines={1}
                          >
                            {result.song_name}
                          </Text>
                          <Text
                            style={[
                              styles.resultArtist,
                              themedStyles.resultArtist,
                            ]}
                            numberOfLines={1}
                          >
                            {result.band_name}
                            {result.release_year &&
                              ` \u2022 ${result.release_year}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Loading state */}
              {(trackQuery.length >= MIN_SEARCH_LENGTH ||
                artistQuery.length >= MIN_SEARCH_LENGTH) &&
                isSearching &&
                searchResults.length === 0 && (
                  <View style={styles.searchStatus}>
                    <ActivityIndicator
                      size="small"
                      color={themeColors.textMuted}
                    />
                  </View>
                )}

              {/* No results message */}
              {hasSearched &&
                !isSearching &&
                searchResults.length === 0 &&
                (trackQuery.length >= MIN_SEARCH_LENGTH ||
                  artistQuery.length >= MIN_SEARCH_LENGTH) && (
                  <Text
                    style={[styles.noResultsText, themedStyles.noResultsText]}
                  >
                    No results found. Try a different search or enter details
                    manually.
                  </Text>
                )}

              {/* Manual entry link */}
              <TouchableOpacity
                onPress={handleEnterManually}
                style={styles.manualEntryLink}
              >
                <Text
                  style={[styles.manualEntryText, themedStyles.manualEntryText]}
                >
                  Can't find your song? Enter details manually
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Release Display */}
          {(selectedRelease || isPrefilled) && (
            <View
              style={[styles.selectedSongCard, themedStyles.selectedSongCard]}
            >
              <View style={styles.selectedSongInfo}>
                {formData.artwork_url && !artworkError ? (
                  <Image
                    source={{ uri: fixImageUrl(formData.artwork_url) }}
                    style={styles.selectedArtwork}
                    onError={() => setArtworkError(true)}
                  />
                ) : (
                  <View
                    style={[
                      styles.selectedArtwork,
                      styles.selectedArtworkPlaceholder,
                      themedStyles.selectedArtworkPlaceholder,
                    ]}
                  >
                    <Icon
                      name="music"
                      size={20}
                      color={themeColors.textMuted}
                    />
                  </View>
                )}
                <View style={styles.selectedSongText}>
                  <Text
                    style={[
                      styles.selectedSongName,
                      themedStyles.selectedSongName,
                    ]}
                    numberOfLines={1}
                  >
                    {formData.song_name || "Song name"}
                  </Text>
                  <Text
                    style={[styles.selectedArtist, themedStyles.selectedArtist]}
                    numberOfLines={1}
                  >
                    {formData.band_name || "Artist"}
                  </Text>
                </View>
              </View>
              {!isPrefilled && !isEditMode && (
                <TouchableOpacity
                  onPress={handleClearSelection}
                  style={styles.clearButton}
                >
                  <Icon name="x" size={18} color={themeColors.iconMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Manual Entry Mode Header */}
          {manualEntry && !selectedRelease && !isPrefilled && (
            <View style={styles.manualEntryHeader}>
              <Text
                style={[styles.manualEntryTitle, themedStyles.manualEntryTitle]}
              >
                Enter song details manually
              </Text>
              <TouchableOpacity onPress={handleBackToSearch}>
                <Text
                  style={[
                    styles.backToSearchText,
                    themedStyles.backToSearchText,
                  ]}
                >
                  Back to search
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Fields - Show directly only in manual entry mode */}
          {manualEntry && !selectedRelease && !isPrefilled && (
            <>
              {/* Song Name */}
              <TextInput
                label="Song Name *"
                placeholder="Hey Jude"
                value={formData.song_name}
                onChangeText={(text: string) => updateField("song_name", text)}
                autoCapitalize="words"
                leftIcon="music"
              />

              {/* Band/Artist Name */}
              <TextInput
                label="Band / Artist *"
                placeholder="The Beatles"
                value={formData.band_name}
                onChangeText={(text: string) => updateField("band_name", text)}
                autoCapitalize="words"
                leftIcon="users"
              />

              {/* Song Link */}
              <TextInput
                label="Song Link (optional)"
                placeholder="https://open.spotify.com/track/..."
                value={formData.song_link}
                onChangeText={(text: string) => updateField("song_link", text)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                leftIcon="link"
              />

              {/* Artwork Selection */}
              {artworkLoading ? (
                <View style={styles.artworkLoadingContainer}>
                  <Text
                    style={[
                      styles.artworkLoadingText,
                      themedStyles.artworkLoadingText,
                    ]}
                  >
                    Loading artwork options...
                  </Text>
                  <ActivityIndicator
                    size="small"
                    color={themeColors.textMuted}
                  />
                </View>
              ) : artworkOptions.length > 0 ? (
                <View style={styles.artworkPickerSection}>
                  <Text style={[styles.label, themedStyles.label]}>
                    Artwork
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.artworkPickerButton,
                      themedStyles.artworkPickerButton,
                    ]}
                    onPress={() => setShowArtworkPicker(!showArtworkPicker)}
                  >
                    <Icon
                      name="image"
                      size={18}
                      color={themeColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.artworkPickerButtonText,
                        themedStyles.artworkPickerButtonText,
                      ]}
                      numberOfLines={1}
                    >
                      {formData.artwork_url
                        ? artworkOptions.find(
                            (o) => o.url === formData.artwork_url,
                          )?.source_display || "Selected"
                        : "Select artwork..."}
                    </Text>
                    <Icon
                      name={showArtworkPicker ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={themeColors.iconMuted}
                    />
                  </TouchableOpacity>
                  {showArtworkPicker && (
                    <View
                      style={[
                        styles.artworkOptionsList,
                        themedStyles.artworkOptionsList,
                      ]}
                    >
                      {artworkOptions.map((option, index) => (
                        <TouchableOpacity
                          key={`${option.source}-${index}`}
                          style={[
                            styles.artworkOptionItem,
                            themedStyles.artworkOptionItem,
                            formData.artwork_url === option.url &&
                              themedStyles.artworkOptionItemSelected,
                          ]}
                          onPress={() => handleSelectArtwork(option)}
                        >
                          <Image
                            source={{ uri: fixImageUrl(option.url) }}
                            style={styles.artworkOptionThumb}
                            onError={() => {}}
                          />
                          <View style={styles.artworkOptionInfo}>
                            <Text
                              style={[
                                styles.artworkOptionSource,
                                themedStyles.artworkOptionSource,
                              ]}
                            >
                              {option.source_display}
                            </Text>
                            {option.album_name && (
                              <Text
                                style={[
                                  styles.artworkOptionAlbum,
                                  themedStyles.artworkOptionAlbum,
                                ]}
                                numberOfLines={1}
                              >
                                {option.album_name}
                                {option.year
                                  ? ` (${option.year})`
                                  : option.release_date
                                    ? ` (${option.release_date.slice(0, 4)})`
                                    : ""}
                              </Text>
                            )}
                          </View>
                          {formData.artwork_url === option.url && (
                            <Icon
                              name="check"
                              size={18}
                              color={themeColors.textMuted}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <TextInput
                  label="Artwork URL (optional)"
                  placeholder="https://image.url/cover.jpg"
                  value={formData.artwork_url}
                  onChangeText={(text: string) =>
                    updateField("artwork_url", text)
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  leftIcon="image"
                />
              )}

              {/* Liked Aspects */}
              <View style={styles.aspectsSection}>
                <Text style={[styles.label, themedStyles.label]}>
                  What did you like about it?
                </Text>
                <View style={styles.aspectsGrid}>
                  {LIKED_ASPECTS.map((aspect) => {
                    const isSelected = formData.liked_aspects.includes(aspect);
                    return (
                      <TouchableOpacity
                        key={aspect}
                        style={[
                          styles.aspectChip,
                          themedStyles.aspectChip,
                          isSelected && themedStyles.aspectChipSelected,
                        ]}
                        onPress={() => toggleAspect(aspect)}
                      >
                        {isSelected && (
                          <Icon
                            name="check"
                            size={14}
                            color={themeColors.btnPrimaryText}
                          />
                        )}
                        <Text
                          style={[
                            styles.aspectChipText,
                            themedStyles.aspectChipText,
                            isSelected && themedStyles.aspectChipTextSelected,
                          ]}
                        >
                          {aspect}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Review Text */}
              <View style={styles.reviewSection}>
                <Text style={[styles.label, themedStyles.label]}>
                  Your Recommendation *
                </Text>
                <View
                  style={[
                    styles.textAreaContainer,
                    themedStyles.textAreaContainer,
                  ]}
                >
                  <MentionTextInput
                    style={[styles.textArea, themedStyles.textArea]}
                    placeholder="Share why you love this song"
                    placeholderTextColor={themeColors.textPlaceholder}
                    value={formData.review_text}
                    onChangeText={(text: string) =>
                      updateField("review_text", text)
                    }
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                  />
                </View>
                <Text style={[styles.charCount, themedStyles.charCount]}>
                  {formData.review_text.length} characters
                </Text>
              </View>

              {/* Submit Button */}
              <Button
                title={isEditMode ? "Save Changes" : "Post Recommendation"}
                onPress={handleSubmit}
                loading={submitting}
                disabled={!isFormValid()}
                fullWidth
              />
            </>
          )}

          {/* When song is selected or prefilled - show simplified form with Advanced accordion */}
          {(selectedRelease || isPrefilled) && (
            <>
              {/* Artwork Selection - outside Advanced */}
              {artworkLoading ? (
                <View style={styles.artworkLoadingContainer}>
                  <Text
                    style={[
                      styles.artworkLoadingText,
                      themedStyles.artworkLoadingText,
                    ]}
                  >
                    Loading artwork options...
                  </Text>
                  <ActivityIndicator
                    size="small"
                    color={themeColors.textMuted}
                  />
                </View>
              ) : artworkOptions.length > 0 ? (
                <View style={styles.artworkPickerSection}>
                  <Text style={[styles.label, themedStyles.label]}>
                    Artwork Options
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.artworkPickerButton,
                      themedStyles.artworkPickerButton,
                    ]}
                    onPress={() => setShowArtworkPicker(!showArtworkPicker)}
                  >
                    <Icon
                      name="image"
                      size={18}
                      color={themeColors.textMuted}
                    />
                    <Text
                      style={[
                        styles.artworkPickerButtonText,
                        themedStyles.artworkPickerButtonText,
                      ]}
                      numberOfLines={1}
                    >
                      {formData.artwork_url
                        ? artworkOptions.find(
                            (o) => o.url === formData.artwork_url,
                          )?.source_display || "Selected"
                        : "Select artwork..."}
                    </Text>
                    <Icon
                      name={showArtworkPicker ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={themeColors.iconMuted}
                    />
                  </TouchableOpacity>
                  {showArtworkPicker && (
                    <View
                      style={[
                        styles.artworkOptionsList,
                        themedStyles.artworkOptionsList,
                      ]}
                    >
                      {artworkOptions.map((option, index) => (
                        <TouchableOpacity
                          key={`${option.source}-${index}`}
                          style={[
                            styles.artworkOptionItem,
                            themedStyles.artworkOptionItem,
                            formData.artwork_url === option.url &&
                              themedStyles.artworkOptionItemSelected,
                          ]}
                          onPress={() => handleSelectArtwork(option)}
                        >
                          <Image
                            source={{ uri: fixImageUrl(option.url) }}
                            style={styles.artworkOptionThumb}
                            onError={() => {}}
                          />
                          <View style={styles.artworkOptionInfo}>
                            <Text
                              style={[
                                styles.artworkOptionSource,
                                themedStyles.artworkOptionSource,
                              ]}
                            >
                              {option.source_display}
                            </Text>
                            {option.album_name && (
                              <Text
                                style={[
                                  styles.artworkOptionAlbum,
                                  themedStyles.artworkOptionAlbum,
                                ]}
                                numberOfLines={1}
                              >
                                {option.album_name}
                                {option.year
                                  ? ` (${option.year})`
                                  : option.release_date
                                    ? ` (${option.release_date.slice(0, 4)})`
                                    : ""}
                              </Text>
                            )}
                          </View>
                          {formData.artwork_url === option.url && (
                            <Icon
                              name="check"
                              size={18}
                              color={themeColors.textMuted}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {/* Liked Aspects */}
              <View style={styles.aspectsSection}>
                <Text style={[styles.label, themedStyles.label]}>
                  What did you like about it?
                </Text>
                <View style={styles.aspectsGrid}>
                  {LIKED_ASPECTS.map((aspect) => {
                    const isSelected = formData.liked_aspects.includes(aspect);
                    return (
                      <TouchableOpacity
                        key={aspect}
                        style={[
                          styles.aspectChip,
                          themedStyles.aspectChip,
                          isSelected && themedStyles.aspectChipSelected,
                        ]}
                        onPress={() => toggleAspect(aspect)}
                      >
                        {isSelected && (
                          <Icon
                            name="check"
                            size={14}
                            color={themeColors.btnPrimaryText}
                          />
                        )}
                        <Text
                          style={[
                            styles.aspectChipText,
                            themedStyles.aspectChipText,
                            isSelected && themedStyles.aspectChipTextSelected,
                          ]}
                        >
                          {aspect}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Review Text */}
              <View style={styles.reviewSection}>
                <Text style={[styles.label, themedStyles.label]}>
                  Your Recommendation *
                </Text>
                <View
                  style={[
                    styles.textAreaContainer,
                    themedStyles.textAreaContainer,
                  ]}
                >
                  <MentionTextInput
                    style={[styles.textArea, themedStyles.textArea]}
                    placeholder="Share why you love this song"
                    placeholderTextColor={themeColors.textPlaceholder}
                    value={formData.review_text}
                    onChangeText={(text: string) =>
                      updateField("review_text", text)
                    }
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                  />
                </View>
                <Text style={[styles.charCount, themedStyles.charCount]}>
                  {formData.review_text.length} characters
                </Text>
              </View>

              {/* Advanced Accordion */}
              <TouchableOpacity
                style={[styles.advancedHeader, themedStyles.advancedHeader]}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text
                  style={[
                    styles.advancedHeaderText,
                    themedStyles.advancedHeaderText,
                  ]}
                >
                  Advanced
                </Text>
                <Icon
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={themeColors.iconMuted}
                />
              </TouchableOpacity>

              {showAdvanced && (
                <View style={styles.advancedContent}>
                  {/* Song Name */}
                  <TextInput
                    label="Song Name *"
                    placeholder="Hey Jude"
                    value={formData.song_name}
                    onChangeText={(text: string) =>
                      updateField("song_name", text)
                    }
                    autoCapitalize="words"
                    leftIcon="music"
                  />

                  {/* Band/Artist Name */}
                  <TextInput
                    label="Band / Artist *"
                    placeholder="The Beatles"
                    value={formData.band_name}
                    onChangeText={(text: string) =>
                      updateField("band_name", text)
                    }
                    autoCapitalize="words"
                    leftIcon="users"
                  />

                  {/* Song Link */}
                  <TextInput
                    label="Song Link (optional)"
                    placeholder="https://open.spotify.com/track/..."
                    value={formData.song_link}
                    onChangeText={(text: string) =>
                      updateField("song_link", text)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    leftIcon="link"
                  />

                  {/* Genres */}
                  <View style={styles.genresSection}>
                    <Text style={[styles.label, themedStyles.label]}>
                      Genres{" "}
                      {formData.genres.length > 0 &&
                        `(${formData.genres.length}/5)`}
                    </Text>
                    <Text style={[styles.genreHint, themedStyles.genreHint]}>
                      Select from common genres or add your own
                    </Text>

                    {/* Selected Genres */}
                    {formData.genres.length > 0 && (
                      <View style={styles.selectedGenres}>
                        {formData.genres.map((genre) => (
                          <TouchableOpacity
                            key={genre}
                            style={[
                              styles.selectedGenreChip,
                              themedStyles.selectedGenreChip,
                            ]}
                            onPress={() => toggleGenre(genre)}
                          >
                            <Text
                              style={[
                                styles.selectedGenreText,
                                themedStyles.selectedGenreText,
                              ]}
                            >
                              {genre}
                            </Text>
                            <Icon
                              name="x"
                              size={14}
                              color={themeColors.btnPrimaryText}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Genre Picker Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.genrePickerButton,
                        themedStyles.genrePickerButton,
                      ]}
                      onPress={() => setShowGenrePicker(!showGenrePicker)}
                    >
                      <Icon
                        name="music"
                        size={18}
                        color={themeColors.textMuted}
                      />
                      <Text
                        style={[
                          styles.genrePickerButtonText,
                          themedStyles.genrePickerButtonText,
                        ]}
                      >
                        {showGenrePicker ? "Hide genres" : "Select genres..."}
                      </Text>
                      <Icon
                        name={showGenrePicker ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={themeColors.iconMuted}
                      />
                    </TouchableOpacity>

                    {showGenrePicker && (
                      <View
                        style={[
                          styles.genreOptionsList,
                          themedStyles.genreOptionsList,
                        ]}
                      >
                        {/* Custom genre input */}
                        <View style={styles.customGenreRow}>
                          <RNTextInput
                            style={[
                              styles.customGenreInput,
                              themedStyles.customGenreInput,
                            ]}
                            placeholder="Add custom genre..."
                            placeholderTextColor={themeColors.textPlaceholder}
                            value={customGenre}
                            onChangeText={setCustomGenre}
                            onSubmitEditing={addCustomGenre}
                            returnKeyType="done"
                          />
                          <TouchableOpacity
                            style={[
                              styles.addGenreButton,
                              themedStyles.addGenreButton,
                              (!customGenre.trim() ||
                                formData.genres.length >= 5) &&
                                themedStyles.addGenreButtonDisabled,
                            ]}
                            onPress={addCustomGenre}
                            disabled={
                              !customGenre.trim() || formData.genres.length >= 5
                            }
                          >
                            <Icon
                              name="plus"
                              size={16}
                              color={themeColors.btnPrimaryText}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Preset genres */}
                        <View style={styles.genreOptionsGrid}>
                          {GENRE_OPTIONS.map((genre) => {
                            const isSelected = formData.genres.includes(genre);
                            return (
                              <TouchableOpacity
                                key={genre}
                                style={[
                                  styles.genreChip,
                                  themedStyles.genreChip,
                                  isSelected && themedStyles.genreChipSelected,
                                ]}
                                onPress={() => toggleGenre(genre)}
                              >
                                {isSelected && (
                                  <Icon
                                    name="check"
                                    size={12}
                                    color={themeColors.btnPrimaryText}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.genreChipText,
                                    themedStyles.genreChipText,
                                    isSelected &&
                                      themedStyles.genreChipTextSelected,
                                  ]}
                                >
                                  {genre}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <Button
                title={isEditMode ? "Save Changes" : "Post Recommendation"}
                onPress={handleSubmit}
                loading={submitting}
                disabled={!isFormValid()}
                fullWidth
              />
            </>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    subtitle: {
      color: colors.textMuted,
    },
    label: {
      color: colors.textPlaceholder,
    },
    searchInputContainer: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderStrong,
    },
    searchInput: {
      color: colors.textPrimary,
    },
    searchResults: {
      backgroundColor: colors.bgApp,
      borderColor: colors.borderDefault,
    },
    searchResultItem: {
      borderBottomColor: colors.borderSubtle,
    },
    resultArtworkPlaceholder: {
      backgroundColor: colors.bgSurface,
    },
    resultSongName: {
      color: colors.textPrimary,
    },
    resultArtist: {
      color: colors.textMuted,
    },
    noResultsText: {
      color: colors.textMuted,
    },
    manualEntryText: {
      color: colors.textMuted,
    },
    selectedSongCard: {
      backgroundColor: colors.bgSurface,
    },
    selectedArtworkPlaceholder: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    selectedSongName: {
      color: colors.textPrimary,
    },
    selectedArtist: {
      color: colors.textMuted,
    },
    manualEntryTitle: {
      color: colors.textSecondary,
    },
    backToSearchText: {
      color: colors.textMuted,
    },
    aspectChip: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
    aspectChipSelected: {
      backgroundColor: colors.btnPrimaryBg,
      borderColor: colors.btnPrimaryBg,
    },
    aspectChipText: {
      color: colors.textMuted,
    },
    aspectChipTextSelected: {
      color: colors.btnPrimaryText,
    },
    textAreaContainer: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderStrong,
    },
    textArea: {
      color: colors.textPrimary,
    },
    charCount: {
      color: colors.textMuted,
    },
    artworkLoadingText: {
      color: colors.textMuted,
    },
    artworkPickerButton: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderStrong,
    },
    artworkPickerButtonText: {
      color: colors.textSecondary,
    },
    artworkOptionsList: {
      backgroundColor: colors.bgApp,
      borderColor: colors.borderDefault,
    },
    artworkOptionItem: {
      borderBottomColor: colors.borderSubtle,
    },
    artworkOptionItemSelected: {
      backgroundColor: colors.bgSurface,
    },
    artworkOptionSource: {
      color: colors.textPrimary,
    },
    artworkOptionAlbum: {
      color: colors.textMuted,
    },
    advancedHeader: {
      backgroundColor: colors.bgSurface,
    },
    advancedHeaderText: {
      color: colors.textMuted,
    },
    genreHint: {
      color: colors.textMuted,
    },
    selectedGenreChip: {
      backgroundColor: colors.btnPrimaryBg,
    },
    selectedGenreText: {
      color: colors.btnPrimaryText,
    },
    genrePickerButton: {
      backgroundColor: colors.bgInput,
      borderColor: colors.borderStrong,
    },
    genrePickerButtonText: {
      color: colors.textSecondary,
    },
    genreOptionsList: {
      backgroundColor: colors.bgApp,
      borderColor: colors.borderDefault,
    },
    customGenreInput: {
      backgroundColor: colors.bgSurface,
      color: colors.textPrimary,
    },
    addGenreButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    addGenreButtonDisabled: {
      backgroundColor: colors.iconSubtle,
    },
    genreChip: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
    genreChipSelected: {
      backgroundColor: colors.btnPrimaryBg,
      borderColor: colors.btnPrimaryBg,
    },
    genreChipText: {
      color: colors.textMuted,
    },
    genreChipTextSelected: {
      color: colors.btnPrimaryText,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
  },

  // Search styles
  searchSection: {
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
  },
  artistInputContainer: {
    marginTop: theme.spacing.xs,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.base,
  },
  searchLoader: {
    marginLeft: theme.spacing.xs,
  },
  searchResults: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    maxHeight: 280,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  resultArtwork: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
  },
  resultArtworkPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  resultSongName: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
  resultArtist: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  searchStatus: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: theme.fontSizes.sm,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
  manualEntryLink: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  manualEntryText: {
    fontSize: theme.fontSizes.sm,
  },

  // Selected song styles
  selectedSongCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.sm,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  selectedSongInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedArtwork: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.sm,
  },
  selectedArtworkPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  selectedSongText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  selectedSongName: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "600",
  },
  selectedArtist: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },

  // Manual entry header
  manualEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  manualEntryTitle: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
  backToSearchText: {
    fontSize: theme.fontSizes.sm,
  },

  // Aspects
  aspectsSection: {
    marginBottom: theme.spacing.md,
  },
  aspectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  aspectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
  },
  aspectChipSelected: {},
  aspectChipText: {
    fontSize: theme.fontSizes.sm,
  },
  aspectChipTextSelected: {
    fontWeight: "500",
  },

  // Review section
  reviewSection: {
    marginBottom: theme.spacing.md,
  },
  textAreaContainer: {
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
  },
  textArea: {
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.base,
    minHeight: 120,
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },

  // Artwork picker styles
  artworkLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  artworkLoadingText: {
    fontSize: theme.fontSizes.sm,
  },
  artworkPickerSection: {
    marginBottom: theme.spacing.md,
  },
  artworkPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  artworkPickerButtonText: {
    flex: 1,
    fontSize: theme.fontSizes.base,
  },
  artworkOptionsList: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    overflow: "hidden",
  },
  artworkOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    gap: theme.spacing.sm,
  },
  artworkOptionItemSelected: {},
  artworkOptionThumb: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
  },
  artworkOptionInfo: {
    flex: 1,
  },
  artworkOptionSource: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
  artworkOptionAlbum: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },

  // Advanced accordion styles
  advancedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  advancedHeaderText: {
    fontSize: theme.fontSizes.sm,
  },
  advancedContent: {
    marginBottom: theme.spacing.md,
  },

  // Genre styles
  genresSection: {
    marginTop: theme.spacing.sm,
  },
  genreHint: {
    fontSize: theme.fontSizes.xs,
    marginBottom: theme.spacing.sm,
  },
  selectedGenres: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  selectedGenreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  selectedGenreText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
  genrePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  genrePickerButtonText: {
    flex: 1,
    fontSize: theme.fontSizes.base,
  },
  genreOptionsList: {
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  customGenreRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  customGenreInput: {
    flex: 1,
    borderRadius: theme.radii.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
  },
  addGenreButton: {
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  addGenreButtonDisabled: {},
  genreOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
  },
  genreChipSelected: {},
  genreChipText: {
    fontSize: theme.fontSizes.xs,
  },
  genreChipTextSelected: {
    fontWeight: "500",
  },
});
