import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/feather';
import { theme, colors } from '@/theme';

type IconName = React.ComponentProps<typeof Icon>['name'];

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'inbox', title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={48} color={colors.grey[4]} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
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
    color: colors.grey[6],
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[5],
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
