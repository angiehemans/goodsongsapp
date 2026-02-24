import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, ProfilePhoto } from '@/components';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { Band } from '@goodsongs/api-client';

export function EditBandScreen({ route, navigation }: any) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);
  const { slug } = route.params;
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [location, setLocation] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [bandcampLink, setBandcampLink] = useState('');
  const [bandcampEmbed, setBandcampEmbed] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [youtubeMusicLink, setYoutubeMusicLink] = useState('');

  const fetchBand = useCallback(async () => {
    try {
      const bandData = await apiClient.getBand(slug);
      setBand(bandData);
      setName(bandData.name || '');
      setAbout(bandData.about || '');
      setLocation(bandData.location || '');
      setSpotifyLink(bandData.spotify_link || '');
      setBandcampLink(bandData.bandcamp_link || '');
      setBandcampEmbed(bandData.bandcamp_embed || '');
      setAppleMusicLink(bandData.apple_music_link || '');
      setYoutubeMusicLink(bandData.youtube_music_link || '');
    } catch (error) {
      console.error('Failed to fetch band:', error);
      Alert.alert('Error', 'Failed to load band details');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBand();
  }, [fetchBand]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Band name is required');
      return;
    }

    setSaving(true);
    try {
      // Note: This would need the updateBand API method added to mobile api client
      Alert.alert(
        'Coming Soon',
        'Band editing will be available in a future update. For now, please edit your band profile on the web.'
      );
    } catch (error) {
      console.error('Failed to update band:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title="Edit Band"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.btnPrimaryBg} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <Header
        title="Edit Band"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <ProfilePhoto
              src={fixImageUrl(band?.profile_picture_url) || fixImageUrl(band?.spotify_image_url)}
              alt={band?.name}
              size={80}
              fallback={band?.name || 'B'}
            />
            <Text style={[styles.photoHint, themedStyles.photoHint]}>Photo editing coming soon</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Band Name *</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={name}
              onChangeText={setName}
              placeholder="Enter band name"
              placeholderTextColor={themeColors.textPlaceholder}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>About</Text>
            <TextInput
              style={[styles.input, styles.textArea, themedStyles.input]}
              value={about}
              onChangeText={setAbout}
              placeholder="Tell fans about your band..."
              placeholderTextColor={themeColors.textPlaceholder}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={[styles.charCount, themedStyles.charCount]}>{about.length}/500</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Location</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              placeholderTextColor={themeColors.textPlaceholder}
            />
          </View>

          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Streaming Links</Text>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Spotify</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={spotifyLink}
              onChangeText={setSpotifyLink}
              placeholder="https://open.spotify.com/artist/..."
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Bandcamp</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={bandcampLink}
              onChangeText={setBandcampLink}
              placeholder="https://yourband.bandcamp.com"
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Bandcamp Embed</Text>
            <TextInput
              style={[styles.input, styles.textArea, themedStyles.input]}
              value={bandcampEmbed}
              onChangeText={setBandcampEmbed}
              placeholder="Paste Bandcamp embed code or URL..."
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="none"
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.fieldHint, themedStyles.fieldHint]}>
              Paste the embed code from Bandcamp to display a player on your profile
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>Apple Music</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={appleMusicLink}
              onChangeText={setAppleMusicLink}
              placeholder="https://music.apple.com/..."
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, themedStyles.label]}>YouTube Music</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={youtubeMusicLink}
              onChangeText={setYoutubeMusicLink}
              placeholder="https://music.youtube.com/..."
              placeholderTextColor={themeColors.textPlaceholder}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelButton, themedStyles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, themedStyles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, themedStyles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={themeColors.btnPrimaryText} />
              ) : (
                <Text style={[styles.saveButtonText, themedStyles.saveButtonText]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    photoHint: {
      color: colors.textMuted,
    },
    label: {
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
      color: colors.textHeading,
    },
    charCount: {
      color: colors.textMuted,
    },
    fieldHint: {
      color: colors.textMuted,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    cancelButton: {
      borderColor: colors.borderDefault,
    },
    cancelButtonText: {
      color: colors.textSecondary,
    },
    saveButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    saveButtonText: {
      color: colors.btnPrimaryText,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  photoHint: {
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.sm,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 2,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.base,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  fieldHint: {
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
});
