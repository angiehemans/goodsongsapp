'use client';

import { Switch, Stack, Text, ColorInput, NumberInput } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';

const VISIBILITY_TOGGLES = [
  { field: 'show_featured_image', label: 'Show Featured Image' },
  { field: 'show_author', label: 'Show Author' },
  { field: 'show_song_embed', label: 'Show Song Embed' },
  { field: 'show_comments', label: 'Show Comments' },
  { field: 'show_related_posts', label: 'Show Related Posts' },
  { field: 'show_navigation', label: 'Show Navigation (prev/next)' },
] as const;

export function SinglePostEditor() {
  const { singlePostLayout, setSinglePostLayoutField } = useBuilderStore();

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Configure how individual blog posts appear to visitors.
      </Text>

      {/* Visibility Toggles */}
      <Stack gap="xs">
        {VISIBILITY_TOGGLES.map(({ field, label }) => (
          <Switch
            key={field}
            label={label}
            checked={singlePostLayout[field]}
            onChange={(e) => setSinglePostLayoutField(field, e.currentTarget.checked)}
          />
        ))}
      </Stack>

      {/* Style Overrides */}
      <Text className="builder-field-label">Style Overrides</Text>
      <Stack gap="sm">
        <ColorInput
          label="Background Color"
          placeholder="Inherit from theme"
          value={singlePostLayout.background_color || ''}
          onChange={(value) => setSinglePostLayoutField('background_color', value || null)}
          format="hex"
          swatches={['#121212', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f5f5f5', '#ffffff']}
        />
        <ColorInput
          label="Font Color"
          placeholder="Inherit from theme"
          value={singlePostLayout.font_color || ''}
          onChange={(value) => setSinglePostLayoutField('font_color', value || null)}
          format="hex"
          swatches={['#f5f5f5', '#ffffff', '#e0e0e0', '#bdbdbd', '#121212', '#1a1a1a', '#333333', '#666666']}
        />
        <NumberInput
          label="Max Width (px)"
          placeholder="Inherit from theme"
          value={singlePostLayout.max_width || ''}
          onChange={(value) => setSinglePostLayoutField('max_width', typeof value === 'number' ? value : null)}
          min={600}
          max={1600}
          step={50}
        />
      </Stack>
    </Stack>
  );
}
