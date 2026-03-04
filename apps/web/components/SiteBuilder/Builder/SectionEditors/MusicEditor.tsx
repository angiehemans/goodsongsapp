'use client';

import { NumberInput, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { MusicContent, MusicSettings } from '@/lib/site-builder/types';
import { DISPLAY_LIMITS } from '@/lib/site-builder/constants';

interface MusicEditorProps {
  index: number;
  content: MusicContent;
  settings?: MusicSettings;
}

export function MusicEditor({ index, settings }: MusicEditorProps) {
  const { updateSectionSettings } = useBuilderStore();

  const handleSettingsChange = (field: keyof MusicSettings, value: number | undefined) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <NumberInput
        label="Number of tracks to show"
        value={settings?.display_limit || DISPLAY_LIMITS.music.default}
        onChange={(value) => handleSettingsChange('display_limit', value as number)}
        min={DISPLAY_LIMITS.music.min}
        max={DISPLAY_LIMITS.music.max}
      />

      <Text size="sm" c="dimmed">
        Shows your most recent releases from your connected music accounts.
      </Text>
    </Stack>
  );
}
