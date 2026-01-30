import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/feather';
import { Button } from '@/components';
import { apiClient } from '@/utils/api';
import { useAuthStore } from '@/context/authStore';
import { theme, colors, commonStyles } from '@/theme';

export function OnboardingBandProfileScreen() {
  const { refreshUser } = useAuthStore();

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [bandcampLink, setBandcampLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [youtubeMusicLink, setYoutubeMusicLink] = useState('');
  const [profilePicture, setProfilePicture] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    });

    if (result.assets?.[0]) {
      const asset = result.assets[0];
      setProfilePicture({
        uri: asset.uri!,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Please enter your band name');
      return;
    }

    setLoading(true);
    try {
      await apiClient.completeBandProfile({
        name: trimmedName,
        about: about.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        spotify_link: spotifyLink.trim() || undefined,
        bandcamp_link: bandcampLink.trim() || undefined,
        apple_music_link: appleMusicLink.trim() || undefined,
        youtube_music_link: youtubeMusicLink.trim() || undefined,
        profile_picture: profilePicture || undefined,
      });
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Set up your band profile</Text>
        <Text style={styles.subtitle}>Let fans know about your music</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture.uri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="camera" size={28} color={theme.colors.textMuted} />
            </View>
          )}
          <Text style={styles.avatarLabel}>Add photo</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Band / Artist Name *</Text>
          <TextInput
            style={commonStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your band or artist name"
            placeholderTextColor={colors.grape[4]}
          />
        </View>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>About</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            value={about}
            onChangeText={setAbout}
            placeholder="Tell fans about your music..."
            placeholderTextColor={colors.grape[4]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={commonStyles.inputLabel}>City</Text>
            <TextInput
              style={commonStyles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={colors.grape[4]}
            />
          </View>
          <View style={[styles.field, styles.halfField]}>
            <Text style={commonStyles.inputLabel}>Region</Text>
            <TextInput
              style={commonStyles.input}
              value={region}
              onChangeText={setRegion}
              placeholder="State / Province"
              placeholderTextColor={colors.grape[4]}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Streaming Links</Text>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Spotify</Text>
          <TextInput
            style={commonStyles.input}
            value={spotifyLink}
            onChangeText={setSpotifyLink}
            placeholder="https://open.spotify.com/artist/..."
            placeholderTextColor={colors.grape[4]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Bandcamp</Text>
          <TextInput
            style={commonStyles.input}
            value={bandcampLink}
            onChangeText={setBandcampLink}
            placeholder="https://yourband.bandcamp.com"
            placeholderTextColor={colors.grape[4]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Apple Music</Text>
          <TextInput
            style={commonStyles.input}
            value={appleMusicLink}
            onChangeText={setAppleMusicLink}
            placeholder="https://music.apple.com/artist/..."
            placeholderTextColor={colors.grape[4]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>YouTube Music</Text>
          <TextInput
            style={commonStyles.input}
            value={youtubeMusicLink}
            onChangeText={setYoutubeMusicLink}
            placeholder="https://music.youtube.com/channel/..."
            placeholderTextColor={colors.grape[4]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <Button
          title="Complete Profile"
          onPress={handleSubmit}
          disabled={!name.trim()}
          loading={loading}
          fullWidth
          size="lg"
        />
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 80,
    paddingTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
