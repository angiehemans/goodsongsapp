import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { theme, colors } from "@/theme";

interface TagProps {
  text: string;
  style?: TextStyle;
}

export function Tag({ text, style }: TagProps) {
  return (
    <Text style={[styles.tag, style]}>
      #{text}
    </Text>
  );
}

const styles = StyleSheet.create({
  tag: {
    fontSize: theme.fontSizes.sm,
    fontWeight: "500",
    color: colors.grape[4],
  },
});
