'use client';

import {
  Stack,
  ColorInput,
  Switch,
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
  const { theme, updateSectionSettings } = useBuilderStore();

  // Only hero and custom_text sections support background_color override
  const supportsBackgroundColor = sectionType === 'hero' || sectionType === 'custom_text';

  if (!supportsBackgroundColor) {
    return null;
  }

  const currentSettings = settings as { background_color?: string } | undefined;
  const useCustomBg = !!currentSettings?.background_color;

  const handleToggleCustomBg = (checked: boolean) => {
    updateSectionSettings(index, {
      background_color: checked ? theme.background_color : undefined,
    });
  };

  const handleBgColorChange = (value: string) => {
    updateSectionSettings(index, { background_color: value });
  };

  return (
    <Stack gap="md">
      <Text size="sm" fw={500} c="dimmed">
        Appearance
      </Text>

      <div>
        <Switch
          label="Custom background color"
          checked={useCustomBg}
          onChange={(e) => handleToggleCustomBg(e.target.checked)}
          mb={useCustomBg ? 'xs' : 0}
        />
        {useCustomBg && (
          <ColorInput
            value={currentSettings?.background_color || ''}
            onChange={handleBgColorChange}
            format="hex"
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
        )}
      </div>
    </Stack>
  );
}
