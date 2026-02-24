import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, SemanticColors } from '@/theme/semanticColors';

const THEME_PREFERENCE_KEY = '@goodsongs_theme_preference';
const USE_SYSTEM_THEME_KEY = '@goodsongs_use_system_theme';

interface ThemeState {
  colorScheme: 'light' | 'dark';
  useSystemTheme: boolean;
  colors: SemanticColors;
  isDark: boolean;

  // Actions
  setColorScheme: (scheme: 'light' | 'dark') => Promise<void>;
  setUseSystemTheme: (use: boolean) => Promise<void>;
  loadThemePreference: () => Promise<void>;
  updateFromSystem: (systemScheme: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'light',
  useSystemTheme: true,
  colors: lightColors,
  isDark: false,

  setColorScheme: async (scheme: 'light' | 'dark') => {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, scheme);
    const isDark = scheme === 'dark';
    set({
      colorScheme: scheme,
      colors: isDark ? darkColors : lightColors,
      isDark,
    });
  },

  setUseSystemTheme: async (use: boolean) => {
    await AsyncStorage.setItem(USE_SYSTEM_THEME_KEY, use ? 'true' : 'false');
    set({ useSystemTheme: use });
  },

  loadThemePreference: async () => {
    try {
      const [[, savedScheme], [, savedUseSystem]] = await AsyncStorage.multiGet([
        THEME_PREFERENCE_KEY,
        USE_SYSTEM_THEME_KEY,
      ]);

      const useSystemTheme = savedUseSystem !== 'false'; // Default to true
      const colorScheme = (savedScheme as 'light' | 'dark') || 'light';
      const isDark = colorScheme === 'dark';

      set({
        colorScheme,
        useSystemTheme,
        colors: isDark ? darkColors : lightColors,
        isDark,
      });
    } catch (error) {
      // Fall back to light theme on error
      set({
        colorScheme: 'light',
        useSystemTheme: true,
        colors: lightColors,
        isDark: false,
      });
    }
  },

  updateFromSystem: (systemScheme: ColorSchemeName) => {
    const { useSystemTheme, colorScheme: currentScheme } = get();
    if (!useSystemTheme) return;

    const scheme = systemScheme === 'dark' ? 'dark' : 'light';
    // Don't update if scheme hasn't changed - prevents infinite loop
    if (scheme === currentScheme) return;

    const isDark = scheme === 'dark';

    set({
      colorScheme: scheme,
      colors: isDark ? darkColors : lightColors,
      isDark,
    });
  },
}));
