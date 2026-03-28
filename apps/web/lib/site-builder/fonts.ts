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
// If fontName is provided (from backend's header_font_name/body_font_name), use that instead
export function getFontFamily(font: string, fontName?: string): string {
  const resolvedName = fontName || (isGoogleFontsUrl(font) ? fontNameFromUrl(font) : null) || font;

  // Determine the fallback based on font category
  const category = FONT_CATEGORIES.find((cat) => cat.fonts.includes(resolvedName as ApprovedFont));

  let fallback = 'sans-serif';
  if (category?.label === 'Serif') {
    fallback = 'serif';
  } else if (category?.label === 'Monospace') {
    fallback = 'monospace';
  } else if (category?.label === 'Display') {
    fallback = 'cursive';
  }

  return `"${resolvedName}", ${fallback}`;
}

// Check if a font is approved
export function isApprovedFont(font: string): font is ApprovedFont {
  return APPROVED_FONTS.includes(font as ApprovedFont);
}

// Check if a value is a Google Fonts URL
export function isGoogleFontsUrl(value: string): boolean {
  return value.startsWith('https://fonts.google.com/specimen/');
}

// Extract the font name from a Google Fonts specimen URL
// e.g., "https://fonts.google.com/specimen/Open+Sans" → "Open Sans"
export function fontNameFromUrl(url: string): string | null {
  const match = url.match(/\/specimen\/(.+?)(?:\?|$)/);
  if (!match) return null;
  return decodeURIComponent(match[1].replace(/\+/g, ' '));
}

// Normalize a Google Fonts URL by stripping query parameters
// e.g., "https://fonts.google.com/specimen/Open+Sans?preview.script=Latn" → "https://fonts.google.com/specimen/Open+Sans"
export function normalizeGoogleFontsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

// Get the resolved font name — uses font_name from backend if available, falls back to extracting from URL
export function getResolvedFontName(fontValue: string, fontName?: string): string {
  if (fontName) return fontName;
  if (isGoogleFontsUrl(fontValue)) {
    return fontNameFromUrl(fontValue) || fontValue;
  }
  return fontValue;
}
