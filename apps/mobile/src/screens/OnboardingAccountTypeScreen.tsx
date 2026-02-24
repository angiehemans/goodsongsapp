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
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingAccountType'>;

export function OnboardingAccountTypeScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);
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
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <View style={styles.content}>
        <Text style={[styles.title, themedStyles.title]}>Welcome to Good Songs</Text>
        <Text style={[styles.subtitle, themedStyles.subtitle]}>What best describes you?</Text>

        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, themedStyles.card, selected === 'fan' && themedStyles.cardSelected]}
            onPress={() => setSelected('fan')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>🎧</Text>
            <Text style={[styles.cardTitle, themedStyles.cardTitle, selected === 'fan' && themedStyles.cardTitleSelected]}>
              I'm a Fan
            </Text>
            <Text style={[styles.cardDescription, themedStyles.cardDescription]}>
              Discover and recommend great music
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, themedStyles.card, selected === 'band' && themedStyles.cardSelected]}
            onPress={() => setSelected('band')}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>🎸</Text>
            <Text style={[styles.cardTitle, themedStyles.cardTitle, selected === 'band' && themedStyles.cardTitleSelected]}>
              I'm a Band
            </Text>
            <Text style={[styles.cardDescription, themedStyles.cardDescription]}>
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
    card: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
    cardSelected: {
      borderColor: colors.btnPrimaryBg,
      backgroundColor: colors.bgSurface,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    cardTitleSelected: {
      color: colors.btnPrimaryBg,
    },
    cardDescription: {
      color: colors.textMuted,
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSizes['3xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  cards: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  card: {
    borderWidth: 2,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
});
