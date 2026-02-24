import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";
import { SemanticColors } from "@/theme/semanticColors";

interface BadgeProps {
  text: string;
  variant?: "default" | "primary" | "success" | "warning";
  size?: "sm" | "md";
  style?: ViewStyle;
}

export function Badge({
  text,
  variant = "default",
  size = "sm",
  style,
}: BadgeProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  // Get the appropriate variant styles
  const getVariantStyle = () => {
    if (variant === "default") return themedStyles.default;
    if (variant === "primary") return themedStyles.primary;
    if (variant === "success") return styles.success;
    if (variant === "warning") return styles.warning;
    return themedStyles.default;
  };

  const getTextVariantStyle = () => {
    if (variant === "default") return themedStyles.text_default;
    if (variant === "primary") return themedStyles.text_primary;
    if (variant === "success") return styles.text_success;
    if (variant === "warning") return styles.text_warning;
    return themedStyles.text_default;
  };

  return (
    <View
      style={[
        styles.badge,
        getVariantStyle(),
        size === "sm" ? styles.size_sm : styles.size_md,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          getTextVariantStyle(),
          size === "sm" ? styles.textSize_sm : styles.textSize_md,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    // Variants with themed colors
    default: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    primary: {
      backgroundColor: colors.btnPrimaryBg,
    },

    // Text variants
    text_default: {
      color: colors.textMuted,
    },
    text_primary: {
      color: colors.btnPrimaryText,
    },
  });

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radii.sm,
  },

  // Success/warning variants (same in both modes)
  success: {
    backgroundColor: "#D1FAE5",
  },
  warning: {
    backgroundColor: "#FEF3C7",
  },

  // Sizes
  size_sm: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  size_md: {
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
  },

  // Text
  text: {
    fontWeight: "500",
  },
  text_success: {
    color: "#065F46",
  },
  text_warning: {
    color: "#92400E",
  },
  textSize_sm: {
    fontSize: theme.fontSizes.xs,
  },
  textSize_md: {
    fontSize: theme.fontSizes.sm,
  },
});
