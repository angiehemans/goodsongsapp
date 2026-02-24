import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "@react-native-vector-icons/feather";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";
import { Logo } from "./Logo";

type IconName = React.ComponentProps<typeof Icon>["name"];

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  rightIcon?: IconName;
  onRightPress?: () => void;
}

export function Header({
  title,
  showBackButton = false,
  onBackPress,
  rightContent,
  rightIcon,
  onRightPress,
}: HeaderProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  return (
    <View style={[styles.header, themedStyles.header]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.iconDefault} />
            </TouchableOpacity>
            {title && <Text style={[styles.backTitle, themedStyles.backTitle]}>{title}</Text>}
          </View>
        ) : (
          <View style={styles.logoContainer}>
            <Logo size={24} color={colors.logoColor} />
            {title && <Text style={[styles.logoText, themedStyles.logoText]}>{title}</Text>}
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightContent}
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            <Icon name={rightIcon} size={24} color={colors.iconDefault} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    header: {
      backgroundColor: colors.bgApp,
      borderBottomColor: colors.borderSubtle,
    },
    backTitle: {
      color: colors.textHeading,
    },
    logoText: {
      color: colors.textHeading,
    },
  });

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  backTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 28,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    lineHeight: 28,
  },
  rightButton: {
    padding: theme.spacing.xs,
    marginRight: -theme.spacing.xs,
  },
});
