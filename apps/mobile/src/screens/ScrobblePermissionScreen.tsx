import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '@react-native-vector-icons/feather';
import { Header, Button } from '@/components';
import { theme, colors } from '@/theme';
import { scrobbleNative } from '@/utils/scrobbleNative';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function ScrobblePermissionScreen({ navigation }: Props) {
  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const checkPermission = async () => {
        const granted = await scrobbleNative.isPermissionGranted();
        if (granted && active) {
          // Permission granted — enable scrobbling and go to settings
          await scrobbleNative.setScrobblingEnabled(true);
          navigation.replace('ScrobbleSettings');
        }
      };

      checkPermission();
      return () => { active = false; };
    }, [navigation])
  );

  const handleContinue = async () => {
    await scrobbleNative.openPermissionSettings();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Scrobbling Setup"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="headphones" size={48} color={theme.colors.primary} />
        </View>

        <Text style={styles.heading}>How Scrobbling Works</Text>
        <Text style={styles.description}>
          GoodSongs can automatically track the music you listen to on your
          favorite streaming apps. This works by reading your media
          notifications to detect what's playing.
        </Text>

        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Icon name="music" size={18} color={theme.colors.secondary} />
            <Text style={styles.bulletText}>
              Only reads media/music notifications
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Icon name="lock" size={18} color={theme.colors.secondary} />
            <Text style={styles.bulletText}>
              Never reads messages, emails, or other notifications
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Icon name="sliders" size={18} color={theme.colors.secondary} />
            <Text style={styles.bulletText}>
              You control which apps are tracked
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Icon name="pause-circle" size={18} color={theme.colors.secondary} />
            <Text style={styles.bulletText}>
              Pause or disable anytime from settings
            </Text>
          </View>
        </View>

        <Text style={styles.permissionNote}>
          Android will ask you to enable notification access for GoodSongs.
          Find "GoodSongs" in the list and toggle it on, then return here.
        </Text>

        <Button
          title="Continue to Permissions"
          onPress={handleContinue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  content: {
    padding: theme.spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  heading: {
    fontSize: theme.fontSizes['3xl'],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: 36,
  },
  description: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[7],
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  bulletList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bulletText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[7],
    flex: 1,
    lineHeight: 20,
  },
  permissionNote: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
