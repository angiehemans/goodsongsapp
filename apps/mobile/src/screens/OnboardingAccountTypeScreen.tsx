import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components';
import { apiClient } from '@/utils/api';
import { theme, colors } from '@/theme';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingAccountType'>;

export function OnboardingAccountTypeScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<'fan' | 'band' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;

    setLoading(true);
    try {
      await apiClient.setAccountType(selected);
      if (selected === 'fan') {
        navigation.replace('OnboardingFanProfile');
      } else {
        navigation.replace('OnboardingBandProfile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Good Songs</Text>
        <Text style={styles.subtitle}>What best describes you?</Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, selected === 'fan' && styles.cardSelected]}
            onPress={() => setSelected('fan')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>🎧</Text>
            <Text style={[styles.cardTitle, selected === 'fan' && styles.cardTitleSelected]}>
              I'm a Fan
            </Text>
            <Text style={styles.cardDescription}>
              Discover and recommend great music
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, selected === 'band' && styles.cardSelected]}
            onPress={() => setSelected('band')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>🎸</Text>
            <Text style={[styles.cardTitle, selected === 'band' && styles.cardTitleSelected]}>
              I'm a Band
            </Text>
            <Text style={styles.cardDescription}>
              Share your music and connect with fans
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  cards: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: colors.grape[1],
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardTitleSelected: {
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
