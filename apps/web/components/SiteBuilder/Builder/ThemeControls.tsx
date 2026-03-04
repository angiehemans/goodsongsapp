'use client';

import { useState, useEffect } from 'react';
import { ColorInput, NumberInput, Select, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';

// Define font options directly - simple format
const FONT_OPTIONS: string[] = [
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
  'Lora',
  'Merriweather',
  'Playfair Display',
  'Source Serif 4',
  'Libre Baskerville',
  'IBM Plex Mono',
  'JetBrains Mono',
];

const COLOR_SWATCHES: string[] = [
  '#121212',
  '#1a1a1a',
  '#0a0a0a',
  '#ffffff',
  '#f5f5f5',
];

export function ThemeControls() {
  const [mounted, setMounted] = useState(false);
  const theme = useBuilderStore((state) => state.theme);
  const setThemeField = useBuilderStore((state) => state.setThemeField);

  // Ensure we only render on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted on client
  if (!mounted) {
    return (
      <div className="theme-controls">
        <Text c="dimmed" size="sm">Loading theme settings...</Text>
      </div>
    );
  }

  // Safety check - if theme isn't loaded yet, show placeholder
  if (!theme) {
    return (
      <div className="theme-controls">
        <Text c="dimmed" size="sm">Loading theme settings...</Text>
      </div>
    );
  }

  return (
    <div className="theme-controls">
      <Stack gap="md">
        <ColorInput
          label="Background Color"
          format="hex"
          value={theme.background_color ?? '#121212'}
          onChange={(value) => setThemeField('background_color', value)}
          swatches={COLOR_SWATCHES}
        />

        <ColorInput
          label="Brand Color"
          format="hex"
          value={theme.brand_color ?? '#6366f1'}
          onChange={(value) => setThemeField('brand_color', value)}
          swatches={COLOR_SWATCHES}
        />

        <ColorInput
          label="Text Color"
          format="hex"
          value={theme.font_color ?? '#f5f5f5'}
          onChange={(value) => setThemeField('font_color', value)}
          swatches={COLOR_SWATCHES}
        />

        <Select
          label="Header Font"
          data={FONT_OPTIONS}
          value={theme.header_font ?? 'Inter'}
          onChange={(value) => value && setThemeField('header_font', value)}
        />

        <Select
          label="Body Font"
          data={FONT_OPTIONS}
          value={theme.body_font ?? 'Inter'}
          onChange={(value) => value && setThemeField('body_font', value)}
        />

        <NumberInput
          label="Content Max Width"
          description="Maximum width for section content (except hero)"
          value={theme.content_max_width ?? 1200}
          onChange={(value) => setThemeField('content_max_width', value === '' ? 1200 : Number(value))}
          min={600}
          max={2000}
          step={50}
          suffix="px"
        />
      </Stack>
    </div>
  );
}
