import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "@react-native-vector-icons/feather";
import { theme, colors } from "@/theme";
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
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.grape[8]} />
            </TouchableOpacity>
            {title && <Text style={styles.backTitle}>{title}</Text>}
          </View>
        ) : (
          <View style={styles.logoContainer}>
            <Logo size={24} color={theme.colors.secondary} />
            {title && <Text style={styles.logoText}>{title}</Text>}
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightContent}
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
            <Icon name={rightIcon} size={24} color={colors.grape[8]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.grape[2],
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
    color: theme.colors.secondary,
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
    color: theme.colors.secondary,
    lineHeight: 28,
  },
  rightButton: {
    padding: theme.spacing.xs,
    marginRight: -theme.spacing.xs,
  },
});
