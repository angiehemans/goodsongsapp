import React, { useMemo, useCallback } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";

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
  const { colors } = useTheme();

  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  const buttonStyles = [
    styles.base,
    themedStyles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    themedStyles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const loaderColor = variant === "primary" ? colors.btnPrimaryText : colors.textHeading;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={loaderColor}
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

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    // Variants with themed colors
    primary: {
      backgroundColor: colors.btnPrimaryBg,
      borderColor: colors.btnPrimaryBg,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.textHeading,
    },
    subtle: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },

    // Text variants
    text_primary: {
      color: colors.btnPrimaryText,
    },
    text_outline: {
      color: colors.textHeading,
    },
    text_subtle: {
      color: colors.textMuted,
    },
  });

// Static styles that don't depend on theme
const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.md,
    borderWidth: theme.borderWidth,
    gap: theme.spacing.sm,
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
