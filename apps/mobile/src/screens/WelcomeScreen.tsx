import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components';
import { theme, colors } from '@/theme';
import { AuthStackParamList } from '@/navigation/types';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.grape[0]} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Icon name="music" size={32} color={theme.colors.primary} />
            <Text style={styles.logoText}>goodsongs</Text>
          </View>

          <Text style={styles.heroTitle}>share some</Text>
          <Text style={styles.heroTitle}>goodsongs</Text>

          <Text style={styles.heroSubtitle}>
            A platform that brings artists and fans together. Share the songs you
            love. Discover your next obsession.
          </Text>

          <View style={styles.buttonGroup}>
            <Button
              title="Start Discovering"
              onPress={() => navigation.navigate('Signup')}
              size="lg"
              fullWidth
            />
            <Button
              title="Log In"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="lg"
              fullWidth
            />
          </View>
        </View>

        {/* Features Section - For Fans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For Fans</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to share the music you love
          </Text>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="heart"
              title="Recommend Songs"
              description="Share the tracks you can't stop playing"
            />
            <FeatureCard
              icon="search"
              title="Discover Music"
              description="Find your next obsession through community recommendations"
            />
            <FeatureCard
              icon="users"
              title="Follow Friends"
              description="See what your friends are listening to"
            />
          </View>
        </View>

        {/* Features Section - For Bands */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={[styles.sectionTitle, styles.textLight]}>For Bands</Text>
          <Text style={[styles.sectionSubtitle, styles.textMuted]}>
            Tools to connect with fans who love what you do
          </Text>

          <View style={styles.featuresGrid}>
            <FeatureCardDark
              icon="message-circle"
              title="See Fan Feedback"
              description="Get real feedback from fans"
            />
            <FeatureCardDark
              icon="calendar"
              title="Event Management"
              description="List your shows and manage venues"
            />
          </View>

          <Button
            title="Create Band Profile"
            onPress={() => navigation.navigate('Signup')}
            size="lg"
            style={styles.bandButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Icon name="music" size={24} color={colors.grape[0]} />
            <Text style={styles.footerLogoText}>goodsongs</Text>
          </View>
          <Text style={styles.footerText}>
            Made for music lovers, by music lovers.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Icon name={icon} size={24} color={theme.colors.secondary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

function FeatureCardDark({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCardDark}>
      <View style={styles.featureIconDark}>
        <Icon name={icon} size={20} color={colors.grape[0]} />
      </View>
      <Text style={styles.featureTitleDark}>{title}</Text>
      <Text style={styles.featureDescriptionDark}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['2xl'],
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  logoText: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.primary,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: colors.grape[7],
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 26,
  },
  buttonGroup: {
    width: '100%',
    gap: theme.spacing.md,
  },

  // Sections
  section: {
    padding: theme.spacing.xl,
    backgroundColor: colors.grape[1],
  },
  sectionDark: {
    backgroundColor: colors.grape[9],
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[6],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  textLight: {
    color: colors.grape[0],
  },
  textMuted: {
    color: colors.blue.base,
    opacity: 0.7,
  },

  // Features
  featuresGrid: {
    gap: theme.spacing.md,
  },
  featureCard: {
    backgroundColor: colors.grape[0],
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: theme.borderWidth,
    borderColor: colors.grape[3],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: colors.grape[2],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[7],
    lineHeight: 20,
  },

  // Dark Feature Cards
  featureCardDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
  },
  featureIconDark: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureTitleDark: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    color: colors.grape[0],
    marginBottom: theme.spacing.xs,
  },
  featureDescriptionDark: {
    fontSize: theme.fontSizes.sm,
    color: colors.blue.base,
    opacity: 0.8,
    lineHeight: 18,
  },

  bandButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: colors.grape[3],
    borderColor: colors.grape[3],
  },

  // Footer
  footer: {
    backgroundColor: colors.grape[9],
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  footerLogoText: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: colors.grape[0],
  },
  footerText: {
    fontSize: theme.fontSizes.sm,
    color: colors.blue.base,
    opacity: 0.7,
  },
});
