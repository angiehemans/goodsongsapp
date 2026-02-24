import { colors } from "@goodsongs/tokens";

/**
 * Light mode semantic colors - uses grape/purple palette
 */
export const lightColors = {
  // Backgrounds
  bgApp: colors.grape[0],
  bgSurface: colors.grape[1],
  bgSurfaceAlt: colors.grape[2],
  bgInput: colors.grape[0],

  // Text
  textPrimary: colors.grape[9],
  textSecondary: colors.grape[8],
  textMuted: colors.grape[6],
  textPlaceholder: colors.grape[4],
  textInverse: colors.grape[0],

  // Borders
  borderDefault: colors.grape[3],
  borderStrong: colors.grape[6],
  borderSubtle: colors.grape[2],

  // Headings & Logo (blue in light mode)
  textHeading: colors.blue.base,
  logoColor: colors.blue.base,

  // Primary button
  btnPrimaryBg: colors.grape[9],
  btnPrimaryText: colors.grape[0],

  // Icon colors
  iconDefault: colors.grape[8],
  iconMuted: colors.grape[6],
  iconSubtle: colors.grape[4],

  // Tab bar
  tabBarBg: colors.grape[0],
  tabBarBorder: colors.grape[2],
  tabBarActive: colors.grape[9],
  tabBarInactive: colors.grey[5],

  // Status colors (same in both modes)
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

/**
 * Dark mode semantic colors - uses gray palette (matching web implementation)
 */
export const darkColors = {
  // Backgrounds - gray palette
  bgApp: colors.grey[9],
  bgSurface: colors.grey[8],
  bgSurfaceAlt: colors.grey[8],
  bgInput: colors.grey[9],

  // Text - light on dark
  textPrimary: colors.grey[0],
  textSecondary: colors.grey[1],
  textMuted: colors.grey[5],
  textPlaceholder: colors.grey[5],
  textInverse: colors.grey[9],

  // Borders
  borderDefault: colors.grey[7],
  borderStrong: colors.grey[5],
  borderSubtle: colors.grey[8],

  // Headings & Logo (gray in dark mode)
  textHeading: colors.grey[0],
  logoColor: colors.grey[2],

  // Primary button - white on dark
  btnPrimaryBg: colors.grey[0],
  btnPrimaryText: colors.grey[9],

  // Icon colors
  iconDefault: colors.grey[1],
  iconMuted: colors.grey[4],
  iconSubtle: colors.grey[5],

  // Tab bar
  tabBarBg: colors.grey[9],
  tabBarBorder: colors.grey[8],
  tabBarActive: colors.grey[0],
  tabBarInactive: colors.grey[5],

  // Status colors (same in both modes)
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

// Use a more flexible type that accepts both light and dark color values
export type SemanticColors = {
  // Backgrounds
  bgApp: string;
  bgSurface: string;
  bgSurfaceAlt: string;
  bgInput: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  textInverse: string;

  // Borders
  borderDefault: string;
  borderStrong: string;
  borderSubtle: string;

  // Headings & Logo
  textHeading: string;
  logoColor: string;

  // Primary button
  btnPrimaryBg: string;
  btnPrimaryText: string;

  // Icon colors
  iconDefault: string;
  iconMuted: string;
  iconSubtle: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
};
