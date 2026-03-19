'use client';

import { IconX } from '@tabler/icons-react';
import { ActionIcon, Button, Group, Switch, Stack, Text, ColorInput, NumberInput } from '@mantine/core';
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
  const { singlePostLayout, setSinglePostLayoutField, setSinglePostLayout } = useBuilderStore();

  const hasOverrides = !!(singlePostLayout.background_color || singlePostLayout.font_color || singlePostLayout.max_width);

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
      <Group justify="space-between" align="center">
        <Text className="builder-field-label">Style Overrides</Text>
        {hasOverrides && (
          <Button
            variant="subtle"
            size="compact-xs"
            color="gray"
            onClick={() => setSinglePostLayout({ background_color: null, font_color: null, max_width: null })}
          >
            Reset all
          </Button>
        )}
      </Group>
      <Stack gap="sm">
        <div className="builder-field-row">
          <div className="builder-field-row__label">Background Color</div>
          <div className="builder-field-row__input" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <ColorInput
              size="sm"
              placeholder="Inherit from theme"
              value={singlePostLayout.background_color || ''}
              onChange={(value) => setSinglePostLayoutField('background_color', value || null)}
              format="hex"
              swatches={['#121212', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f5f5f5', '#ffffff']}
              aria-label="Background Color"
              style={{ flex: 1 }}
            />
            {singlePostLayout.background_color && (
              <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => setSinglePostLayoutField('background_color', null)} title="Clear">
                <IconX size={10} />
              </ActionIcon>
            )}
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Font Color</div>
          <div className="builder-field-row__input" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <ColorInput
              size="sm"
              placeholder="Inherit from theme"
              value={singlePostLayout.font_color || ''}
              onChange={(value) => setSinglePostLayoutField('font_color', value || null)}
              format="hex"
              swatches={['#f5f5f5', '#ffffff', '#e0e0e0', '#bdbdbd', '#121212', '#1a1a1a', '#333333', '#666666']}
              aria-label="Font Color"
              style={{ flex: 1 }}
            />
            {singlePostLayout.font_color && (
              <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => setSinglePostLayoutField('font_color', null)} title="Clear">
                <IconX size={10} />
              </ActionIcon>
            )}
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Max Width (px)</div>
          <div className="builder-field-row__input" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <NumberInput
              size="sm"
              placeholder="Inherit from theme"
              value={singlePostLayout.max_width || ''}
              onChange={(value) => setSinglePostLayoutField('max_width', typeof value === 'number' ? value : null)}
              min={600}
              max={1600}
              step={50}
              aria-label="Max Width"
              style={{ flex: 1 }}
            />
            {singlePostLayout.max_width && (
              <ActionIcon variant="subtle" size="xs" color="gray" onClick={() => setSinglePostLayoutField('max_width', null)} title="Clear">
                <IconX size={10} />
              </ActionIcon>
            )}
          </div>
        </div>
      </Stack>
    </Stack>
  );
}
