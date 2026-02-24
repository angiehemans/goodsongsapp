import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, style, noPadding = false }: CardProps) {
  const { colors } = useTheme();
  const themedStyles = useMemo(() => createThemedStyles(colors), [colors]);

  return (
    <View style={[styles.card, themedStyles.card, noPadding && styles.noPadding, style]}>
      {children}
    </View>
  );
}

const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
  });

const styles = StyleSheet.create({
  card: {
    borderWidth: theme.borderWidth,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  noPadding: {
    padding: 0,
  },
});
