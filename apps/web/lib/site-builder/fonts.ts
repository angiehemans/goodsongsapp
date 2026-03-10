// Approved fonts for the site builder
export const APPROVED_FONTS = [
  // Sans-serif
  'Inter',
  'Space Grotesk',
  'DM Sans',
  'Plus Jakarta Sans',
  'Outfit',
  'Sora',
  'Manrope',
  'Rubik',
  'Work Sans',
  'Nunito Sans',
  // Serif
  'Lora',
  'Merriweather',
  'Playfair Display',
  'Source Serif 4',
  'Libre Baskerville',
  // Monospace
  'IBM Plex Mono',
  'JetBrains Mono',
  'Courier Prime',
  'Cutive Mono',
  // Display
  'Creepster',
  'Jacquard 12',
  'Astloch',
  'Pirata One',
  'Special Elite',
] as const;

export type ApprovedFont = (typeof APPROVED_FONTS)[number];

// Font categories for UI grouping
export interface FontCategory {
  label: string;
  fonts: ApprovedFont[];
}

export const FONT_CATEGORIES: FontCategory[] = [
  {
    label: 'Sans-serif',
    fonts: [
      'Inter',
      'Space Grotesk',
      'DM Sans',
      'Plus Jakarta Sans',
      'Outfit',
      'Sora',
      'Manrope',
      'Rubik',
      'Work Sans',
      'Nunito Sans',
    ],
  },
  {
    label: 'Serif',
    fonts: ['Lora', 'Merriweather', 'Playfair Display', 'Source Serif 4', 'Libre Baskerville'],
  },
  {
    label: 'Monospace',
    fonts: ['IBM Plex Mono', 'JetBrains Mono', 'Courier Prime', 'Cutive Mono'],
  },
  {
    label: 'Display',
    fonts: ['Creepster', 'Jacquard 12', 'Astloch', 'Pirata One', 'Special Elite'],
  },
];

// Generate Google Fonts URL for given fonts
export function getGoogleFontsUrl(fonts: string[]): string {
  const uniqueFonts = Array.from(new Set(fonts));
  const fontParams = uniqueFonts
    .map((font) => {
      // Replace spaces with + for URL
      const fontName = font.replace(/ /g, '+');
      // Request regular and bold weights
      return `family=${fontName}:wght@400;500;600;700`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
}

// Generate preload link for a font
export function getFontPreloadLinks(fonts: string[]): Array<{ href: string; as: string; type: string }> {
  return [
    {
      href: getGoogleFontsUrl(fonts),
      as: 'style',
      type: 'text/css',
    },
  ];
}

// Get font-family CSS value with fallback
export function getFontFamily(font: string): string {
  // Determine the fallback based on font category
  const category = FONT_CATEGORIES.find((cat) => cat.fonts.includes(font as ApprovedFont));

  let fallback = 'sans-serif';
  if (category?.label === 'Serif') {
    fallback = 'serif';
  } else if (category?.label === 'Monospace') {
    fallback = 'monospace';
  } else if (category?.label === 'Display') {
    fallback = 'cursive';
  }

  return `"${font}", ${fallback}`;
}

// Check if a font is approved
export function isApprovedFont(font: string): font is ApprovedFont {
  return APPROVED_FONTS.includes(font as ApprovedFont);
}
