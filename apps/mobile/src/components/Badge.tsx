import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme, colors } from "@/theme";

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
  return (
    <View
      style={[styles.badge, styles[variant], styles[`size_${size}`], style]}
    >
      <Text
        style={[
          styles.text,
          styles[`text_${variant}`],
          styles[`textSize_${size}`],
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radii.sm,
  },

  // Variants
  default: {
    backgroundColor: colors.grape[2],
  },
  primary: {
    backgroundColor: colors.grape[6],
  },
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
  text_default: {
    color: colors.grape[4],
  },
  text_primary: {
    color: colors.grape[0],
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
