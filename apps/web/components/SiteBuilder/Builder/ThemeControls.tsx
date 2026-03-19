'use client';

import { useEffect, useState } from 'react';
import { ColorInput, NumberInput, Select, Stack, Text } from '@mantine/core';
import { APPROVED_FONTS, FONT_CATEGORIES, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { useBuilderStore } from '@/lib/site-builder/store';

// Build grouped font options from the shared font list
const FONT_OPTIONS = FONT_CATEGORIES.map((category) => ({
  group: category.label,
  items: category.fonts.map((font) => ({ value: font, label: font })),
}));

const COLOR_SWATCHES: string[] = ['#121212', '#1a1a1a', '#0a0a0a', '#ffffff', '#f5f5f5'];

// Render font option with the font applied for preview
function renderFontOption({ option }: { option: { value: string; label: string } }) {
  return (
    <Text size="sm" style={{ fontFamily: `"${option.value}", sans-serif` }}>
      {option.label}
    </Text>
  );
}

export function ThemeControls() {
  const [mounted, setMounted] = useState(false);
  const theme = useBuilderStore((state) => state.theme);
  const setThemeField = useBuilderStore((state) => state.setThemeField);

  // Ensure we only render on the client after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload all approved fonts so the dropdown previews render correctly
  useEffect(() => {
    if (!mounted) return;

    const linkId = 'font-picker-google-fonts';
    if (document.getElementById(linkId)) return;

    const linkEl = document.createElement('link');
    linkEl.id = linkId;
    linkEl.rel = 'stylesheet';
    linkEl.href = getGoogleFontsUrl([...APPROVED_FONTS]);
    document.head.appendChild(linkEl);
  }, [mounted]);

  // Don't render anything until mounted on client
  if (!mounted) {
    return (
      <div className="theme-controls">
        <Text c="dimmed" size="sm">
          Loading theme settings...
        </Text>
      </div>
    );
  }

  // Safety check - if theme isn't loaded yet, show placeholder
  if (!theme) {
    return (
      <div className="theme-controls">
        <Text c="dimmed" size="sm">
          Loading theme settings...
        </Text>
      </div>
    );
  }

  return (
    <div className="theme-controls">
      <Stack gap={16}>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Background Color</div>
          <div className="builder-field-row__input">
            <ColorInput
              format="hex"
              size="sm"
              value={theme.background_color ?? '#121212'}
              onChange={(value) => setThemeField('background_color', value)}
              swatches={COLOR_SWATCHES}
              aria-label="Background Color"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Brand Color</div>
          <div className="builder-field-row__input">
            <ColorInput
              format="hex"
              size="sm"
              value={theme.brand_color ?? '#6366f1'}
              onChange={(value) => setThemeField('brand_color', value)}
              swatches={COLOR_SWATCHES}
              aria-label="Brand Color"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Text Color</div>
          <div className="builder-field-row__input">
            <ColorInput
              format="hex"
              size="sm"
              value={theme.font_color ?? '#f5f5f5'}
              onChange={(value) => setThemeField('font_color', value)}
              swatches={COLOR_SWATCHES}
              aria-label="Text Color"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Card Background</div>
          <div className="builder-field-row__input">
            <ColorInput
              format="hex"
              size="sm"
              placeholder="Inherit"
              value={theme.card_background_color ?? ''}
              onChange={(value) => setThemeField('card_background_color', value || '')}
              swatches={COLOR_SWATCHES}
              aria-label="Card Background"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Card BG Opacity</div>
          <div className="builder-field-row__input">
            <NumberInput
              size="sm"
              value={theme.card_background_opacity ?? 10}
              onChange={(value) =>
                setThemeField('card_background_opacity', value === '' ? 10 : Number(value))
              }
              min={0}
              max={100}
              step={5}
              suffix="%"
              aria-label="Card BG Opacity"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Header Font</div>
          <div className="builder-field-row__input">
            <Select
              size="sm"
              data={FONT_OPTIONS}
              value={theme.header_font ?? 'Inter'}
              onChange={(value) => value && setThemeField('header_font', value)}
              renderOption={renderFontOption}
              styles={{ input: { fontFamily: `"${theme.header_font ?? 'Inter'}", sans-serif` } }}
              aria-label="Header Font"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Body Font</div>
          <div className="builder-field-row__input">
            <Select
              size="sm"
              data={FONT_OPTIONS}
              value={theme.body_font ?? 'Inter'}
              onChange={(value) => value && setThemeField('body_font', value)}
              renderOption={renderFontOption}
              styles={{ input: { fontFamily: `"${theme.body_font ?? 'Inter'}", sans-serif` } }}
              aria-label="Body Font"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Content Max Width</div>
          <div className="builder-field-row__input">
            <NumberInput
              size="sm"
              value={theme.content_max_width ?? 1200}
              onChange={(value) =>
                setThemeField('content_max_width', value === '' ? 1200 : Number(value))
              }
              min={600}
              max={2000}
              step={50}
              suffix="px"
              aria-label="Content Max Width"
            />
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Border Radius</div>
          <div className="builder-field-row__input">
            <NumberInput
              size="sm"
              value={theme.border_radius ?? 12}
              onChange={(value) =>
                setThemeField('border_radius', value === '' ? 12 : Number(value))
              }
              min={0}
              max={32}
              step={2}
              suffix="px"
              aria-label="Border Radius"
            />
          </div>
        </div>
      </Stack>
    </div>
  );
}
