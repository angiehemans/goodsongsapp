import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Logo } from "@/components";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { AuthStackParamList } from "@/navigation/types";

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors: themeColors, isDark } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );

  return (
    <SafeAreaView style={[styles.container, themedStyles.container]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={themeColors.bgApp}
      />

      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, themedStyles.heroTitle]}>share some</Text>
          <Text style={[styles.heroTitle, themedStyles.heroTitle]}>goodsongs</Text>

          <Text style={[styles.heroSubtitle, themedStyles.heroSubtitle]}>
            A platform that brings artists and fans together. Share the songs
            you love. Discover your next obsession.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            title="Start Discovering"
            onPress={() => navigation.navigate("Signup")}
            size="lg"
            fullWidth
          />
          <Button
            title="Log In"
            onPress={() => navigation.navigate("Login")}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </View>

      {/* Logo at bottom */}
      <View style={styles.footer}>
        <Logo size={32} color={themeColors.logoColor} />
        <Text style={[styles.logoText, themedStyles.logoText]}>goodsongs</Text>
      </View>
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    heroTitle: {
      color: colors.textHeading,
    },
    heroSubtitle: {
      color: colors.textSecondary,
    },
    logoText: {
      color: colors.logoColor,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: theme.fonts.thecoaBold,
    textAlign: "center",
    lineHeight: 52,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    textAlign: "center",
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 26,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  logoText: {
    fontSize: 28,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 42,
  },
});
