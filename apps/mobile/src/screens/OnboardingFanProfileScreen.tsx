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

export function OnboardingFanProfileScreen() {
  const { refreshUser } = useAuthStore();

  const [username, setUsername] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [profileImage, setProfileImage] = useState<{
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
      setProfileImage({
        uri: asset.uri!,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });
    }
  };

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      Alert.alert('Required', 'Please enter a username');
      return;
    }
    if (trimmedUsername.length < 3) {
      Alert.alert('Too short', 'Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.completeFanProfile({
        username: trimmedUsername,
        about_me: aboutMe.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        profile_image: profileImage || undefined,
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
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage.uri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="camera" size={28} color={theme.colors.textMuted} />
            </View>
          )}
          <Text style={styles.avatarLabel}>Add photo</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Username *</Text>
          <TextInput
            style={commonStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Choose a username"
            placeholderTextColor={colors.grape[4]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>About me</Text>
          <TextInput
            style={[commonStyles.input, styles.textArea]}
            value={aboutMe}
            onChangeText={setAboutMe}
            placeholder="Tell us about yourself..."
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

        <Button
          title="Complete Profile"
          onPress={handleSubmit}
          disabled={!username.trim()}
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
});
