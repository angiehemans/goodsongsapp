import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'inbox', title, message }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Icon name={icon} size={48} color={colors.iconSubtle} />
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
