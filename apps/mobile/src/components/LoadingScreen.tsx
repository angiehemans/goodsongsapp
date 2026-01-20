import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface LoadingScreenProps {
  color?: string;
}

export function LoadingScreen({ color }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color || theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
