import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/feather';
import { Header, TextInput, Button } from '@/components';
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { CreateReviewParams } from '@/navigation/types';

const LIKED_ASPECTS = [
  'Vocals',
  'Lyrics',
  'Melody',
  'Beat',
  'Production',
  'Instrumentation',
  'Energy',
  'Creativity',
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

export function CreateReviewScreen({ navigation, route }: any) {
  const params = route.params as CreateReviewParams | undefined;
  const scrollViewRef = useRef<ScrollView>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [formData, setFormData] = useState<FormData>({
    song_link: '',
    band_name: '',
    song_name: '',
    artwork_url: '',
    review_text: '',
    liked_aspects: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Reset form when screen is focused
  useFocusEffect(
    useCallback(() => {
      const currentParams = paramsRef.current;

      // Always start with a clean form on focus
      const newFormData: FormData = {
        song_link: '',
        band_name: '',
        song_name: '',
        artwork_url: '',
        review_text: '',
        liked_aspects: [],
      };

      // Prefill from params if available
      if (currentParams?.song_name) {
        newFormData.song_link = currentParams.song_link || '';
        newFormData.band_name = currentParams.band_name || '';
        newFormData.song_name = currentParams.song_name || '';
        newFormData.artwork_url = currentParams.artwork_url || '';
        newFormData.band_lastfm_artist_name = currentParams.band_lastfm_artist_name;
        newFormData.band_musicbrainz_id = currentParams.band_musicbrainz_id;

        // Clear params after applying (setTimeout breaks the render cycle to avoid infinite loop)
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

      setFormData(newFormData);
    }, [navigation])
  );

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAspect = (aspect: string) => {
    setFormData(prev => ({
      ...prev,
      liked_aspects: prev.liked_aspects.includes(aspect)
        ? prev.liked_aspects.filter(a => a !== aspect)
        : [...prev.liked_aspects, aspect],
    }));
  };

  const isFormValid = () => {
    return (
      formData.song_link.trim() !== '' &&
      formData.band_name.trim() !== '' &&
      formData.song_name.trim() !== '' &&
      formData.review_text.trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createReview({
        song_link: formData.song_link.trim(),
        band_name: formData.band_name.trim(),
        song_name: formData.song_name.trim(),
        artwork_url: formData.artwork_url.trim() || undefined,
        review_text: formData.review_text.trim(),
        liked_aspects: formData.liked_aspects.length > 0 ? formData.liked_aspects : undefined,
        band_lastfm_artist_name: formData.band_lastfm_artist_name,
        band_musicbrainz_id: formData.band_musicbrainz_id,
      });

      // Navigate to Home with success flag
      setSubmitting(false);
      navigation.navigate('Home', { showSuccess: true });
    } catch (error: any) {
      setSubmitting(false);
      Alert.alert('Error', error.message || 'Failed to post recommendation');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Recommend" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Song Link */}
          <TextInput
            label="Song Link *"
            placeholder="https://www.last.fm/music/Artist/_/Song"
            value={formData.song_link}
            onChangeText={(text) => updateField('song_link', text)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            leftIcon="link"
          />

          {/* Band/Artist Name */}
          <TextInput
            label="Band / Artist *"
            placeholder="The Beatles"
            value={formData.band_name}
            onChangeText={(text) => updateField('band_name', text)}
            autoCapitalize="words"
            leftIcon="users"
          />

          {/* Song Name */}
          <TextInput
            label="Song Name *"
            placeholder="Hey Jude"
            value={formData.song_name}
            onChangeText={(text) => updateField('song_name', text)}
            autoCapitalize="words"
            leftIcon="music"
          />

          {/* Artwork URL (Optional) */}
          <TextInput
            label="Artwork URL (optional)"
            placeholder="https://image.url/cover.jpg"
            value={formData.artwork_url}
            onChangeText={(text) => updateField('artwork_url', text)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            leftIcon="image"
          />

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
                      <Icon name="check" size={14} color={colors.grape[0]} />
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
                onChangeText={(text) => updateField('review_text', text)}
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
  label: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[4],
    marginBottom: theme.spacing.xs,
  },
  aspectsSection: {
    marginBottom: theme.spacing.md,
  },
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  aspectChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  reviewSection: {
    marginBottom: theme.spacing.lg,
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
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },
});
