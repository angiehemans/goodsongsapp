'use client';

import {
  Stack,
  ColorInput,
  Text,
} from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { SectionSettings } from '@/lib/site-builder/types';

interface AppearanceEditorProps {
  index: number;
  settings?: SectionSettings;
  sectionType?: string;
}

export function AppearanceEditor({ index, settings, sectionType }: AppearanceEditorProps) {
  const { updateSectionSettings } = useBuilderStore();

  // Only hero and custom_text sections support background_color override
  const supportsBackgroundColor = sectionType === 'hero' || sectionType === 'custom_text';

  if (!supportsBackgroundColor) {
    return null;
  }

  const currentSettings = settings as { background_color?: string } | undefined;

  const handleBgColorChange = (value: string) => {
    updateSectionSettings(index, { background_color: value || undefined });
  };

  return (
    <Stack gap="md">
      <Text className="builder-field-label" c="var(--gs-text-muted)">
        Appearance
      </Text>

      <div className="builder-field-row">
        <div className="builder-field-row__label">Background Color</div>
        <div className="builder-field-row__input">
          <ColorInput
            value={currentSettings?.background_color || ''}
            onChange={handleBgColorChange}
            placeholder="Inherit from theme"
            format="hex"
            size="sm"
            aria-label="Background Color"
            swatches={[
              '#121212',
              '#1a1a1a',
              '#0a0a0a',
              '#1e1e2e',
              '#0f172a',
              '#ffffff',
              '#f5f5f5',
            ]}
          />
        </div>
      </div>
    </Stack>
  );
}
