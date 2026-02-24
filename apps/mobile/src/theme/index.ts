import { StyleSheet } from 'react-native';
import { colors, typography, spacing, radii, borderWidths } from '@goodsongs/tokens';

// Re-export tokens for convenience
export { colors, typography, spacing, radii, borderWidths };

// Re-export semantic colors
export { lightColors, darkColors } from './semanticColors';
export type { SemanticColors } from './semanticColors';

// Theme object matching web app design
export const theme = {
  colors: {
    primary: colors.grape[9],
    primaryLight: colors.grape[6],
    primaryLighter: colors.grape[3],
    primaryLightest: colors.grape[0],

    secondary: colors.blue.base,

    background: colors.grape[0],
    backgroundDark: colors.grape[9],
    surface: colors.grape[1],
    surfaceBorder: colors.grape[3],

    text: colors.grey[9],
    textMuted: colors.grape[6],
    textLight: colors.grape[4],
    textOnDark: colors.grape[0],

    white: '#FFFFFF',
    black: '#000000',

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },

  fonts: {
    heading: typography.fonts.heading,
    body: typography.fonts.body,
    // React Native font family mappings
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    headingRegular: 'AesthetNova-Regular',
    // Thecoa fonts
    thecoa: 'Thecoa-Regular',
    thecoaMedium: 'Thecoa-Medium',
    thecoaBold: 'Thecoa-Bold',
    thecoaHeavy: 'Thecoa-Heavy',
  },

  fontSizes: {
    xs: typography.sizes.xs,
    sm: typography.sizes.sm,
    base: typography.sizes.base,
    lg: typography.sizes.lg,
    xl: typography.sizes.xl,
    '2xl': typography.sizes['2xl'],
    '3xl': typography.sizes['3xl'],
    '4xl': typography.sizes['4xl'],
  },

  spacing: {
    xs: spacing[1],
    sm: spacing[2],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
    '2xl': spacing[12],
  },

  radii: {
    none: radii.none,
    sm: radii.sm,
    md: radii.md,
    lg: radii.lg,
    xl: radii.xl,
    full: radii.full,
  },

  borderWidth: borderWidths.default,
};

// Common style patterns
export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Cards matching web Paper/Card component
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },

  // Typography
  title: {
    fontSize: theme.fontSizes['2xl'],
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  heading: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  bodyText: {
    fontSize: theme.fontSizes.base,
    color: theme.colors.text,
  },
  mutedText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textMuted,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.primary,
  },
  buttonPrimaryText: {
    color: theme.colors.white,
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.secondary,
  },
  buttonOutlineText: {
    color: theme.colors.secondary,
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Inputs matching web TextInput styling
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.primaryLight,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.base,
    color: colors.grape[8],
  },
  inputLabel: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },

  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Center
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Badge matching web Badge component
  badge: {
    backgroundColor: colors.grape[2],
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  badgeText: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[8],
    fontWeight: '500',
  },
});

export type Theme = typeof theme;
