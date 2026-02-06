import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button, Logo } from "@/components";
import { theme, colors } from "@/theme";
import { AuthStackParamList } from "@/navigation/types";

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.grape[0]} />

      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>share some</Text>
          <Text style={styles.heroTitle}>goodsongs</Text>

          <Text style={styles.heroSubtitle}>
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
        <Logo size={32} color={colors.blue.base} />
        <Text style={styles.logoText}>goodsongs</Text>
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
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 52,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: colors.grape[7],
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
    fontFamily: theme.fonts.cooperBold,
    color: colors.blue.base,
    lineHeight: 42,
  },
});
