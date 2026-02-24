import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { theme } from "@/theme";
import { useTheme } from "@/hooks/useTheme";

interface TagProps {
  text: string;
  style?: TextStyle;
}

export function Tag({ text, style }: TagProps) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.tag, { color: colors.textPlaceholder }, style]}>
      #{text}
    </Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
  },
});
