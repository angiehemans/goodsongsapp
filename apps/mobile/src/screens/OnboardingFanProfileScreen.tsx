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

// Username can only contain letters, numbers, and underscores
const isValidUsername = (value: string): boolean => {
  return /^[a-zA-Z0-9_]*$/.test(value);
};

const getUsernameError = (value: string): string | null => {
  if (!value) return null;
  if (!isValidUsername(value)) {
    return 'Only letters, numbers, and underscores allowed';
  }
  if (value.length < 3) {
    return 'Username must be at least 3 characters';
  }
  return null;
};

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
  const [serverError, setServerError] = useState<string | null>(null);

  const usernameError = getUsernameError(username);
  const isUsernameValid = username.length >= 3 && !usernameError && !serverError;

  // Clear server error when username changes
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (serverError) {
      setServerError(null);
    }
  };

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
    if (usernameError) {
      Alert.alert('Invalid Username', usernameError);
      return;
    }

    setLoading(true);
    setServerError(null);
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
      const errorMessage = error.message || 'Something went wrong';
      const lowerMessage = errorMessage.toLowerCase();

      // Check if the error is related to username
      if (
        lowerMessage.includes('username') ||
        lowerMessage.includes('taken') ||
        lowerMessage.includes('already') ||
        lowerMessage.includes('exists') ||
        lowerMessage.includes('unique')
      ) {
        // Show a user-friendly message for username errors
        if (lowerMessage.includes('taken') || lowerMessage.includes('already') || lowerMessage.includes('exists')) {
          setServerError('This username is already taken');
        } else {
          setServerError(errorMessage);
        }
      } else {
        // For other errors, show the actual error message inline as well
        // since most errors during profile completion are username-related
        setServerError(errorMessage);
      }
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
          <View style={styles.usernameInputContainer}>
            <TextInput
              style={[
                commonStyles.input,
                styles.usernameInput,
                (usernameError || serverError) && username ? styles.inputError : null,
                isUsernameValid ? styles.inputValid : null,
              ]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Choose a username"
              placeholderTextColor={colors.grape[4]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {username.length > 0 && (
              <View style={styles.validationIcon}>
                {isUsernameValid ? (
                  <Icon name="check-circle" size={20} color="#10b981" />
                ) : (
                  <Icon name="alert-circle" size={20} color="#ef4444" />
                )}
              </View>
            )}
          </View>
          {serverError ? (
            <Text style={styles.errorText}>{serverError}</Text>
          ) : usernameError && username ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : username.length > 0 && isUsernameValid ? (
            <Text style={styles.validText}>Username looks good!</Text>
          ) : (
            <Text style={styles.hintText}>Letters, numbers, and underscores only</Text>
          )}
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
          disabled={!isUsernameValid}
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
  usernameInputContainer: {
    position: 'relative',
  },
  usernameInput: {
    paddingRight: 44,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputValid: {
    borderColor: '#10b981',
  },
  errorText: {
    fontSize: theme.fontSizes.xs,
    color: '#ef4444',
    marginTop: 4,
  },
  validText: {
    fontSize: theme.fontSizes.xs,
    color: '#10b981',
    marginTop: 4,
  },
  hintText: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginTop: 4,
  },
});
