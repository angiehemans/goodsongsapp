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
import { Header, TextInput, Button } from "@/components";
import { theme, colors } from "@/theme";
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

interface FormData {
  song_link: string;
  band_name: string;
  song_name: string;
  artwork_url: string;
  review_text: string;
  liked_aspects: string[];
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
  const params = route.params as CreateReviewParams | undefined;
  const scrollViewRef = useRef<ScrollView>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

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
  });
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
      };

      // Prefill from params if available
      if (currentParams?.song_name || currentParams?.band_name) {
        newFormData.song_link = currentParams.song_link || "";
        newFormData.band_name = currentParams.band_name || "";
        newFormData.song_name = currentParams.song_name || "";
        newFormData.artwork_url = currentParams.artwork_url || "";
        newFormData.band_lastfm_artist_name =
          currentParams.band_lastfm_artist_name;
        newFormData.band_musicbrainz_id = currentParams.band_musicbrainz_id;
        setIsPrefilled(true);

        // Clear params after applying
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
      } else {
        setIsPrefilled(false);
      }

      setFormData(newFormData);
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
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert("Error", error.message || "Failed to post recommendation");
    }
  };

  // Show search interface if no release is selected, not prefilled, and not in manual entry mode
  const showSearch =
    !isPrefilled && !selectedRelease && !formData.song_name && !manualEntry;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Recommend" />
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
          <Text style={styles.subtitle}>
            Share your favorite songs and help others discover great music!
          </Text>

          {/* Song Search Section */}
          {showSearch && (
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <Icon
                  name="search"
                  size={18}
                  color={colors.grape[4]}
                  style={styles.searchIcon}
                />
                <RNTextInput
                  style={styles.searchInput}
                  placeholder="Song name..."
                  placeholderTextColor={colors.grape[4]}
                  value={trackQuery}
                  onChangeText={setTrackQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && trackQuery && (
                  <ActivityIndicator
                    size="small"
                    color={colors.grape[6]}
                    style={styles.searchLoader}
                  />
                )}
              </View>

              <View
                style={[
                  styles.searchInputContainer,
                  styles.artistInputContainer,
                ]}
              >
                <Icon
                  name="user"
                  size={18}
                  color={colors.grape[4]}
                  style={styles.searchIcon}
                />
                <RNTextInput
                  style={styles.searchInput}
                  placeholder="Artist name (optional)..."
                  placeholderTextColor={colors.grape[4]}
                  value={artistQuery}
                  onChangeText={setArtistQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && artistQuery && !trackQuery && (
                  <ActivityIndicator
                    size="small"
                    color={colors.grape[6]}
                    style={styles.searchLoader}
                  />
                )}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                  >
                    {searchResults.map((result, index) => (
                      <TouchableOpacity
                        key={`${result.song_name}-${result.band_name}-${index}`}
                        style={styles.searchResultItem}
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
                            ]}
                          >
                            <Icon
                              name="music"
                              size={16}
                              color={colors.grape[6]}
                            />
                          </View>
                        )}
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultSongName} numberOfLines={1}>
                            {result.song_name}
                          </Text>
                          <Text style={styles.resultArtist} numberOfLines={1}>
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
                    <ActivityIndicator size="small" color={colors.grape[6]} />
                  </View>
                )}

              {/* No results message */}
              {hasSearched &&
                !isSearching &&
                searchResults.length === 0 &&
                (trackQuery.length >= MIN_SEARCH_LENGTH ||
                  artistQuery.length >= MIN_SEARCH_LENGTH) && (
                  <Text style={styles.noResultsText}>
                    No results found. Try a different search or enter details
                    manually.
                  </Text>
                )}

              {/* Manual entry link */}
              <TouchableOpacity
                onPress={handleEnterManually}
                style={styles.manualEntryLink}
              >
                <Text style={styles.manualEntryText}>
                  Can't find your song? Enter details manually
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Release Display */}
          {(selectedRelease || isPrefilled) && (
            <View style={styles.selectedSongCard}>
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
                    ]}
                  >
                    <Icon name="music" size={20} color={colors.grape[6]} />
                  </View>
                )}
                <View style={styles.selectedSongText}>
                  <Text style={styles.selectedSongName} numberOfLines={1}>
                    {formData.song_name || "Song name"}
                  </Text>
                  <Text style={styles.selectedArtist} numberOfLines={1}>
                    {formData.band_name || "Artist"}
                  </Text>
                </View>
              </View>
              {!isPrefilled && (
                <TouchableOpacity
                  onPress={handleClearSelection}
                  style={styles.clearButton}
                >
                  <Icon name="x" size={18} color={colors.grape[5]} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Manual Entry Mode Header */}
          {manualEntry && !selectedRelease && !isPrefilled && (
            <View style={styles.manualEntryHeader}>
              <Text style={styles.manualEntryTitle}>
                Enter song details manually
              </Text>
              <TouchableOpacity onPress={handleBackToSearch}>
                <Text style={styles.backToSearchText}>Back to search</Text>
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
                  <Text style={styles.artworkLoadingText}>
                    Loading artwork options...
                  </Text>
                  <ActivityIndicator size="small" color={colors.grape[6]} />
                </View>
              ) : artworkOptions.length > 0 ? (
                <View style={styles.artworkPickerSection}>
                  <Text style={styles.label}>Artwork</Text>
                  <TouchableOpacity
                    style={styles.artworkPickerButton}
                    onPress={() => setShowArtworkPicker(!showArtworkPicker)}
                  >
                    <Icon name="image" size={18} color={colors.grape[6]} />
                    <Text
                      style={styles.artworkPickerButtonText}
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
                      color={colors.grape[5]}
                    />
                  </TouchableOpacity>
                  {showArtworkPicker && (
                    <View style={styles.artworkOptionsList}>
                      {artworkOptions.map((option, index) => (
                        <TouchableOpacity
                          key={`${option.source}-${index}`}
                          style={[
                            styles.artworkOptionItem,
                            formData.artwork_url === option.url &&
                              styles.artworkOptionItemSelected,
                          ]}
                          onPress={() => handleSelectArtwork(option)}
                        >
                          <Image
                            source={{ uri: fixImageUrl(option.url) }}
                            style={styles.artworkOptionThumb}
                            onError={() => {}}
                          />
                          <View style={styles.artworkOptionInfo}>
                            <Text style={styles.artworkOptionSource}>
                              {option.source_display}
                            </Text>
                            {option.album_name && (
                              <Text
                                style={styles.artworkOptionAlbum}
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
                              color={colors.grape[6]}
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
                <Text style={styles.label}>What did you like about it?</Text>
                <View style={styles.aspectsGrid}>
                  {LIKED_ASPECTS.map((aspect) => {
                    const isSelected = formData.liked_aspects.includes(aspect);
                    return (
                      <TouchableOpacity
                        key={aspect}
                        style={[
                          styles.aspectChip,
                          isSelected && styles.aspectChipSelected,
                        ]}
                        onPress={() => toggleAspect(aspect)}
                      >
                        {isSelected && (
                          <Icon
                            name="check"
                            size={14}
                            color={colors.grape[0]}
                          />
                        )}
                        <Text
                          style={[
                            styles.aspectChipText,
                            isSelected && styles.aspectChipTextSelected,
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
                <Text style={styles.label}>Your Recommendation *</Text>
                <View style={styles.textAreaContainer}>
                  <RNTextInput
                    style={styles.textArea}
                    placeholder="Share why you love this song..."
                    placeholderTextColor={colors.grape[4]}
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
                <Text style={styles.charCount}>
                  {formData.review_text.length} characters
                </Text>
              </View>

              {/* Submit Button */}
              <Button
                title="Post Recommendation"
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
                  <Text style={styles.artworkLoadingText}>
                    Loading artwork options...
                  </Text>
                  <ActivityIndicator size="small" color={colors.grape[6]} />
                </View>
              ) : artworkOptions.length > 0 ? (
                <View style={styles.artworkPickerSection}>
                  <Text style={styles.label}>Artwork Options</Text>
                  <TouchableOpacity
                    style={styles.artworkPickerButton}
                    onPress={() => setShowArtworkPicker(!showArtworkPicker)}
                  >
                    <Icon name="image" size={18} color={colors.grape[6]} />
                    <Text
                      style={styles.artworkPickerButtonText}
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
                      color={colors.grape[5]}
                    />
                  </TouchableOpacity>
                  {showArtworkPicker && (
                    <View style={styles.artworkOptionsList}>
                      {artworkOptions.map((option, index) => (
                        <TouchableOpacity
                          key={`${option.source}-${index}`}
                          style={[
                            styles.artworkOptionItem,
                            formData.artwork_url === option.url &&
                              styles.artworkOptionItemSelected,
                          ]}
                          onPress={() => handleSelectArtwork(option)}
                        >
                          <Image
                            source={{ uri: fixImageUrl(option.url) }}
                            style={styles.artworkOptionThumb}
                            onError={() => {}}
                          />
                          <View style={styles.artworkOptionInfo}>
                            <Text style={styles.artworkOptionSource}>
                              {option.source_display}
                            </Text>
                            {option.album_name && (
                              <Text
                                style={styles.artworkOptionAlbum}
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
                              color={colors.grape[6]}
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
                <Text style={styles.label}>What did you like about it?</Text>
                <View style={styles.aspectsGrid}>
                  {LIKED_ASPECTS.map((aspect) => {
                    const isSelected = formData.liked_aspects.includes(aspect);
                    return (
                      <TouchableOpacity
                        key={aspect}
                        style={[
                          styles.aspectChip,
                          isSelected && styles.aspectChipSelected,
                        ]}
                        onPress={() => toggleAspect(aspect)}
                      >
                        {isSelected && (
                          <Icon
                            name="check"
                            size={14}
                            color={colors.grape[0]}
                          />
                        )}
                        <Text
                          style={[
                            styles.aspectChipText,
                            isSelected && styles.aspectChipTextSelected,
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
                <Text style={styles.label}>Your Recommendation *</Text>
                <View style={styles.textAreaContainer}>
                  <RNTextInput
                    style={styles.textArea}
                    placeholder="Share why you love this song..."
                    placeholderTextColor={colors.grape[4]}
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
                <Text style={styles.charCount}>
                  {formData.review_text.length} characters
                </Text>
              </View>

              {/* Advanced Accordion */}
              <TouchableOpacity
                style={styles.advancedHeader}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text style={styles.advancedHeaderText}>Advanced</Text>
                <Icon
                  name={showAdvanced ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.grape[5]}
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
                </View>
              )}

              {/* Submit Button */}
              <Button
                title="Post Recommendation"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[4],
    marginBottom: theme.spacing.xs,
  },

  // Search styles
  searchSection: {
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.grape[0],
    borderWidth: theme.borderWidth,
    borderColor: colors.grape[6],
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
    color: colors.grape[8],
  },
  searchLoader: {
    marginLeft: theme.spacing.xs,
  },
  searchResults: {
    marginTop: theme.spacing.xs,
    backgroundColor: colors.grape[0],
    borderWidth: 1,
    borderColor: colors.grape[3],
    borderRadius: theme.radii.md,
    maxHeight: 280,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grape[2],
  },
  resultArtwork: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.sm,
  },
  resultArtworkPlaceholder: {
    backgroundColor: colors.grape[1],
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
    color: colors.grape[8],
  },
  resultArtist: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginTop: 2,
  },
  searchStatus: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
  manualEntryLink: {
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  manualEntryText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },

  // Selected song styles
  selectedSongCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.grape[1],
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
    backgroundColor: colors.grape[2],
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
    color: colors.grape[8],
  },
  selectedArtist: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
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
    color: colors.grape[7],
  },
  backToSearchText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
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
    backgroundColor: colors.grape[1],
    borderWidth: 1,
    borderColor: colors.grape[3],
  },
  aspectChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  aspectChipText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  aspectChipTextSelected: {
    color: colors.grape[0],
    fontWeight: "500",
  },

  // Review section
  reviewSection: {
    marginBottom: theme.spacing.md,
  },
  textAreaContainer: {
    backgroundColor: colors.grape[0],
    borderWidth: theme.borderWidth,
    borderColor: colors.grape[6],
    borderRadius: theme.radii.md,
  },
  textArea: {
    padding: theme.spacing.md,
    fontSize: theme.fontSizes.base,
    color: colors.grape[8],
    minHeight: 120,
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
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
    color: colors.grape[5],
  },
  artworkPickerSection: {
    marginBottom: theme.spacing.md,
  },
  artworkPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.grape[0],
    borderWidth: theme.borderWidth,
    borderColor: colors.grape[6],
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  artworkPickerButtonText: {
    flex: 1,
    fontSize: theme.fontSizes.base,
    color: colors.grape[7],
  },
  artworkOptionsList: {
    marginTop: theme.spacing.xs,
    backgroundColor: colors.grape[0],
    borderWidth: 1,
    borderColor: colors.grape[3],
    borderRadius: theme.radii.md,
    overflow: "hidden",
  },
  artworkOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grape[2],
    gap: theme.spacing.sm,
  },
  artworkOptionItemSelected: {
    backgroundColor: colors.grape[1],
  },
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
    color: colors.grape[8],
  },
  artworkOptionAlbum: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginTop: 2,
  },

  // Advanced accordion styles
  advancedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.grape[1],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  advancedHeaderText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  advancedContent: {
    marginBottom: theme.spacing.md,
  },
});
