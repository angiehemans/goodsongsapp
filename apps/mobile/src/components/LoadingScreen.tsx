import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

interface LoadingScreenProps {
  color?: string;
}

export function LoadingScreen({ color }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <ActivityIndicator size="large" color={color || colors.btnPrimaryBg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
