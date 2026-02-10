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
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { Band } from '@goodsongs/api-client';

export function EditBandScreen({ route, navigation }: any) {
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Edit Band"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
            <Text style={styles.photoHint}>Photo editing coming soon</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.field}>
            <Text style={styles.label}>Band Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter band name"
              placeholderTextColor={colors.grape[4]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>About</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={about}
              onChangeText={setAbout}
              placeholder="Tell fans about your band..."
              placeholderTextColor={colors.grape[4]}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{about.length}/500</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              placeholderTextColor={colors.grape[4]}
            />
          </View>

          <Text style={styles.sectionTitle}>Streaming Links</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Spotify</Text>
            <TextInput
              style={styles.input}
              value={spotifyLink}
              onChangeText={setSpotifyLink}
              placeholder="https://open.spotify.com/artist/..."
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bandcamp</Text>
            <TextInput
              style={styles.input}
              value={bandcampLink}
              onChangeText={setBandcampLink}
              placeholder="https://yourband.bandcamp.com"
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bandcamp Embed</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bandcampEmbed}
              onChangeText={setBandcampEmbed}
              placeholder="Paste Bandcamp embed code or URL..."
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.fieldHint}>
              Paste the embed code from Bandcamp to display a player on your profile
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Apple Music</Text>
            <TextInput
              style={styles.input}
              value={appleMusicLink}
              onChangeText={setAppleMusicLink}
              placeholder="https://music.apple.com/..."
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>YouTube Music</Text>
            <TextInput
              style={styles.input}
              value={youtubeMusicLink}
              onChangeText={setYoutubeMusicLink}
              placeholder="https://music.youtube.com/..."
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
    color: colors.grape[5],
    marginTop: theme.spacing.sm,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    color: colors.grape[6],
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: colors.grape[1],
    borderWidth: 2,
    borderColor: colors.grape[3],
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSizes.base,
    color: theme.colors.secondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  fieldHint: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
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
    borderColor: colors.grape[3],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    color: colors.grape[6],
  },
  saveButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    color: 'white',
  },
});
