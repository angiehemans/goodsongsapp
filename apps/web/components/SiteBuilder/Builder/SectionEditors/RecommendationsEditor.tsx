'use client';

import { NumberInput, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { RecommendationsContent, RecommendationsSettings } from '@/lib/site-builder/types';
import { DISPLAY_LIMITS } from '@/lib/site-builder/constants';

interface RecommendationsEditorProps {
  index: number;
  content: RecommendationsContent;
  settings?: RecommendationsSettings;
}

export function RecommendationsEditor({ index, settings }: RecommendationsEditorProps) {
  const { updateSectionSettings } = useBuilderStore();

  const handleSettingsChange = (field: keyof RecommendationsSettings, value: number | undefined) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <NumberInput
        label="Number of recommendations to show"
        value={settings?.display_limit || DISPLAY_LIMITS.recommendations.default}
        onChange={(value) => handleSettingsChange('display_limit', value as number)}
        min={DISPLAY_LIMITS.recommendations.min}
        max={DISPLAY_LIMITS.recommendations.max}
      />

      <Text size="sm" c="dimmed">
        Shows your song recommendations and reviews.
      </Text>
    </Stack>
  );
}
