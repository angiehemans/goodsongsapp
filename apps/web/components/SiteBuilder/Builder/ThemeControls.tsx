'use client';

import { useEffect, useState } from 'react';
import { ColorInput, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { APPROVED_FONTS, FONT_CATEGORIES, getGoogleFontsUrl, isGoogleFontsUrl, fontNameFromUrl, normalizeGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { useBuilderStore } from '@/lib/site-builder/store';

// Build grouped font options from the shared font list
const FONT_OPTIONS = FONT_CATEGORIES.map((category) => ({
  group: category.label,
  items: category.fonts.map((font) => ({ value: font, label: font })),
}));

const COLOR_SWATCHES: string[] = ['#121212', '#1a1a1a', '#0a0a0a', '#ffffff', '#f5f5f5'];

const FONT_WEIGHT_OPTIONS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
];

// Render font option with the font applied for preview
function renderFontOption({ option }: { option: { value: string; label: string } }) {
  return (
    <Text size="sm" style={{ fontFamily: `"${option.value}", sans-serif` }}>
      {option.label}
    </Text>
  );
}

// Helper to get display name for a font value (could be a name or URL)
function getDisplayName(value: string): string {
  if (isGoogleFontsUrl(value)) {
    return fontNameFromUrl(value) || value;
  }
  return value;
}

// Check if value is a custom font (URL, not in approved list)
function isCustomFont(value: string): boolean {
  return isGoogleFontsUrl(value);
}

interface FontFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function FontField({ label, value, onChange }: FontFieldProps) {
  const [showCustom, setShowCustom] = useState(isCustomFont(value));
  const [customUrl, setCustomUrl] = useState(isCustomFont(value) ? value : '');

  const handleSelectChange = (v: string | null) => {
    if (v) {
      onChange(v);
      setShowCustom(false);
      setCustomUrl('');
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url);
    if (isGoogleFontsUrl(url)) {
      const normalized = normalizeGoogleFontsUrl(url);
      setCustomUrl(normalized);
      onChange(normalized);
    }
  };

  const handleToggleCustom = () => {
    if (showCustom) {
      // Switch back to dropdown — reset to Inter
      setShowCustom(false);
      setCustomUrl('');
      onChange('Inter');
    } else {
      setShowCustom(true);
    }
  };

  const displayName = getDisplayName(value);
  const isValid = !showCustom || isGoogleFontsUrl(customUrl);

  return (
    <Stack gap={4}>
      <div className="builder-field-row">
        <div className="builder-field-row__label">
          <Group gap={4}>
            {label}
            {isCustomFont(value) && (
              <Text size="xs" c="var(--gs-text-muted)" style={{ fontStyle: 'italic' }}>
                ({displayName})
              </Text>
            )}
          </Group>
        </div>
        <div className="builder-field-row__input">
          {showCustom ? (
            <TextInput
              size="sm"
              placeholder="https://fonts.google.com/specimen/..."
              value={customUrl}
              onChange={(e) => handleCustomUrlChange(e.target.value)}
              aria-label={`${label} custom URL`}
              error={customUrl && !isGoogleFontsUrl(customUrl) ? 'Paste a Google Fonts URL' : undefined}
              styles={{ input: isValid && customUrl ? { fontFamily: `"${displayName}", sans-serif` } : undefined }}
            />
          ) : (
            <Select
              size="sm"
              data={FONT_OPTIONS}
              value={isCustomFont(value) ? null : value}
              onChange={handleSelectChange}
              renderOption={renderFontOption}
              styles={{ input: { fontFamily: `"${displayName}", sans-serif` } }}
              aria-label={label}
              searchable
              placeholder={isCustomFont(value) ? displayName : undefined}
            />
          )}
        </div>
      </div>
      <Text
        size="xs"
        c="var(--gs-text-extra-muted)"
        style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
        onClick={handleToggleCustom}
      >
        {showCustom ? 'Use curated font list' : 'Use custom Google Font'}
      </Text>
    </Stack>
  );
}

export function ThemeControls() {
  const [mounted, setMounted] = useState(false);
  const theme = useBuilderStore((state) => state.theme);
  const setThemeField = useBuilderStore((state) => state.setThemeField);

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

  // Load custom fonts if they're Google Fonts URLs
  useEffect(() => {
    if (!mounted || !theme) return;

    const customFonts: string[] = [];
    for (const fontValue of [theme.header_font, theme.body_font]) {
      if (isGoogleFontsUrl(fontValue)) {
        const name = fontNameFromUrl(fontValue);
        if (name) customFonts.push(name);
      }
    }

    // Also load any custom_font_urls from the backend
    if (theme.custom_font_urls) {
      for (const url of theme.custom_font_urls) {
        const linkId = `custom-font-${btoa(url).slice(0, 20)}`;
        if (!document.getElementById(linkId)) {
          const linkEl = document.createElement('link');
          linkEl.id = linkId;
          linkEl.rel = 'stylesheet';
          linkEl.href = url;
          document.head.appendChild(linkEl);
        }
      }
    }

    if (customFonts.length > 0) {
      const linkId = 'custom-fonts-preview';
      const existing = document.getElementById(linkId);
      const href = getGoogleFontsUrl(customFonts);
      if (existing) {
        (existing as HTMLLinkElement).href = href;
      } else {
        const linkEl = document.createElement('link');
        linkEl.id = linkId;
        linkEl.rel = 'stylesheet';
        linkEl.href = href;
        document.head.appendChild(linkEl);
      }
    }
  }, [mounted, theme?.header_font, theme?.body_font, theme?.custom_font_urls]);

  if (!mounted || !theme) {
    return (
      <div className="theme-controls">
        <Text c="dimmed" size="sm">Loading theme settings...</Text>
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

        <FontField
          label="Header Font"
          value={theme.header_font ?? 'Inter'}
          onChange={(value) => setThemeField('header_font', value)}
        />
        <div className="builder-field-row">
          <div className="builder-field-row__label">Header Weight</div>
          <div className="builder-field-row__input">
            <Select
              size="sm"
              value={String(theme.header_font_weight ?? 700)}
              onChange={(value) => value && setThemeField('header_font_weight', Number(value))}
              data={FONT_WEIGHT_OPTIONS}
              aria-label="Header Font Weight"
            />
          </div>
        </div>

        <FontField
          label="Body Font"
          value={theme.body_font ?? 'Inter'}
          onChange={(value) => setThemeField('body_font', value)}
        />
        <div className="builder-field-row">
          <div className="builder-field-row__label">Body Weight</div>
          <div className="builder-field-row__input">
            <Select
              size="sm"
              value={String(theme.body_font_weight ?? 400)}
              onChange={(value) => value && setThemeField('body_font_weight', Number(value))}
              data={FONT_WEIGHT_OPTIONS}
              aria-label="Body Font Weight"
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
