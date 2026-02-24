import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './useTheme';
import { SemanticColors } from '@/theme/semanticColors';

/**
 * Hook for creating theme-aware StyleSheets.
 * The styles are memoized and only recomputed when the theme colors change.
 *
 * @example
 * function MyComponent() {
 *   const styles = useThemedStyles((colors) => ({
 *     container: { backgroundColor: colors.bgApp },
 *     text: { color: colors.textPrimary },
 *   }));
 *
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.text}>Hello</Text>
 *     </View>
 *   );
 * }
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (colors: SemanticColors) => T
): T {
  const { colors } = useTheme();

  return useMemo(
    () => StyleSheet.create(styleFactory(colors)),
    [colors, styleFactory]
  );
}
