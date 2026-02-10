import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "@/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "subtle";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" ? theme.colors.white : theme.colors.primary
          }
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: theme.colors.secondary,
  },
  subtle: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  // Sizes
  size_sm: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
  },
  size_md: {
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.lg,
  },
  size_lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },

  // Text
  text: {
    textAlign: "center",
    fontFamily: theme.fonts.thecoa,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  text_primary: {
    color: theme.colors.white,
  },
  text_outline: {
    color: theme.colors.secondary,
  },
  text_subtle: {
    color: theme.colors.primaryLight,
  },
  textSize_sm: {
    fontSize: theme.fontSizes.sm,
  },
  textSize_md: {
    fontSize: theme.fontSizes.base,
  },
  textSize_lg: {
    fontSize: theme.fontSizes.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
