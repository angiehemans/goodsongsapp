import { useEffect } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { useThemeStore } from '@/context/themeStore';
import { SemanticColors } from '@/theme/semanticColors';

interface UseThemeResult {
  colors: SemanticColors;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
}

/**
 * Hook to access theme colors with automatic system scheme listener.
 * Updates theme colors when system appearance changes (if useSystemTheme is enabled).
 */
export function useTheme(): UseThemeResult {
  const systemScheme = useColorScheme();
  const { colors, isDark, colorScheme } = useThemeStore();

  useEffect(() => {
    // Access updateFromSystem via getState() to avoid dependency issues
    // Store actions are stable and don't need to be in deps
    const { updateFromSystem } = useThemeStore.getState();

    // Update from current system scheme
    updateFromSystem(systemScheme);

    // Listen for system appearance changes
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      useThemeStore.getState().updateFromSystem(newScheme);
    });

    return () => subscription.remove();
  }, [systemScheme]);

  return { colors, isDark, colorScheme };
}
