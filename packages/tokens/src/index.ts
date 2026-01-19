// Colors - extracted from theme.ts for use across web and mobile
export const colors = {
  // Primary brand color (grape)
  grape: {
    0: '#FAF5FD', // lightest
    1: '#F8F0FC',
    2: '#F1E9F5',
    3: '#DBC8E5',
    4: '#C0A3CD',
    5: '#AE8BBC',
    6: '#8C5B9E',
    7: '#723886',
    8: '#580D6C',
    9: '#420154', // darkest
  },
  // Blue accent
  blue: {
    base: '#0124B0',
  },
  // Grey scale
  grey: {
    0: '#F9F9FA',
    1: '#F6F5F6',
    2: '#ECEAED',
    3: '#DAD7DC',
    4: '#C2BCC5',
    5: '#968E9A',
    6: '#7A717D',
    7: '#514755',
    8: '#352C38',
    9: '#1B151D',
  },
} as const;

// Typography
export const typography = {
  fonts: {
    heading: 'aesthet-nova, serif',
    body: 'Inter, sans-serif',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Spacing (base unit: 4px)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// Border radius
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Border widths
export const borderWidths = {
  default: 2,
} as const;

// Primary color configuration
export const primaryColor = 'grape' as const;
export const primaryShade = 9 as const;

// Type exports for convenience
export type GrapeShade = keyof typeof colors.grape;
export type GreyShade = keyof typeof colors.grey;
export type SpacingKey = keyof typeof spacing;
export type RadiiKey = keyof typeof radii;
export type FontSizeKey = keyof typeof typography.sizes;
export type FontWeightKey = keyof typeof typography.weights;
