'use client';

import { NumberInput, Stack, Switch, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { EventsContent, EventsSettings } from '@/lib/site-builder/types';
import { DISPLAY_LIMITS } from '@/lib/site-builder/constants';

interface EventsEditorProps {
  index: number;
  content: EventsContent;
  settings?: EventsSettings;
}

export function EventsEditor({ index, settings }: EventsEditorProps) {
  const { updateSectionSettings } = useBuilderStore();

  const handleSettingsChange = (field: keyof EventsSettings, value: number | boolean | undefined) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <NumberInput
        label="Number of events to show"
        value={settings?.display_limit || DISPLAY_LIMITS.events.default}
        onChange={(value) => handleSettingsChange('display_limit', value as number)}
        min={DISPLAY_LIMITS.events.min}
        max={DISPLAY_LIMITS.events.max}
      />

      <Switch
        label="Show past events"
        description="Display events that have already happened"
        checked={settings?.show_past_events || false}
        onChange={(e) => handleSettingsChange('show_past_events', e.target.checked)}
      />

      <Text size="sm" c="dimmed">
        {settings?.show_past_events
          ? 'Shows your upcoming and past events'
          : 'Shows your upcoming events only'}
      </Text>
    </Stack>
  );
}
