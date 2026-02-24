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
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';

export function OnboardingBandProfileScreen() {
  const { refreshUser } = useAuthStore();
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);

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
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, themedStyles.title]}>Set up your band profile</Text>
        <Text style={[styles.subtitle, themedStyles.subtitle]}>Let fans know about your music</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture.uri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, themedStyles.avatarPlaceholder]}>
              <Icon name="camera" size={28} color={themeColors.textMuted} />
            </View>
          )}
          <Text style={[styles.avatarLabel, themedStyles.avatarLabel]}>Add photo</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Band / Artist Name *</Text>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={name}
            onChangeText={setName}
            placeholder="Your band or artist name"
            placeholderTextColor={themeColors.textPlaceholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>About</Text>
          <TextInput
            style={[styles.input, themedStyles.input, styles.textArea]}
            value={about}
            onChangeText={setAbout}
            placeholder="Tell fans about your music..."
            placeholderTextColor={themeColors.textPlaceholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={[styles.inputLabel, themedStyles.inputLabel]}>City</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={themeColors.textPlaceholder}
            />
          </View>
          <View style={[styles.field, styles.halfField]}>
            <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Region</Text>
            <TextInput
              style={[styles.input, themedStyles.input]}
              value={region}
              onChangeText={setRegion}
              placeholder="State / Province"
              placeholderTextColor={themeColors.textPlaceholder}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Streaming Links</Text>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Spotify</Text>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={spotifyLink}
            onChangeText={setSpotifyLink}
            placeholder="https://open.spotify.com/artist/..."
            placeholderTextColor={themeColors.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Bandcamp</Text>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={bandcampLink}
            onChangeText={setBandcampLink}
            placeholder="https://yourband.bandcamp.com"
            placeholderTextColor={themeColors.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>Apple Music</Text>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={appleMusicLink}
            onChangeText={setAppleMusicLink}
            placeholder="https://music.apple.com/artist/..."
            placeholderTextColor={themeColors.textPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.inputLabel, themedStyles.inputLabel]}>YouTube Music</Text>
          <TextInput
            style={[styles.input, themedStyles.input]}
            value={youtubeMusicLink}
            onChangeText={setYoutubeMusicLink}
            placeholder="https://music.youtube.com/channel/..."
            placeholderTextColor={themeColors.textPlaceholder}
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

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    title: {
      color: colors.textHeading,
    },
    subtitle: {
      color: colors.textMuted,
    },
    avatarPlaceholder: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
    avatarLabel: {
      color: colors.textMuted,
    },
    inputLabel: {
      color: colors.textPlaceholder,
    },
    input: {
      backgroundColor: colors.bgApp,
      borderColor: colors.borderDefault,
      color: colors.textSecondary,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSizes.base,
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
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.base,
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
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
});
