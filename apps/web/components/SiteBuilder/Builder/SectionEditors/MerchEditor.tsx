'use client';

import { TextInput, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { MerchContent, MerchSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';

interface MerchEditorProps {
  index: number;
  content: MerchContent;
  settings?: MerchSettings;
}

export function MerchEditor({ index, content, settings }: MerchEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();

  const handleContentChange = (field: keyof MerchContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = (field: keyof MerchSettings, value: string) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="Heading"
        placeholder="Merch"
        value={content.heading || ''}
        onChange={(e) => handleContentChange('heading', e.target.value)}
        maxLength={CHAR_LIMITS.section_heading}
      />

      <TextInput
        label="Store URL"
        description="Link to your external merch store"
        placeholder="https://yourband.bandcamp.com/merch"
        value={settings?.store_url || ''}
        onChange={(e) => handleSettingsChange('store_url', e.target.value)}
        type="url"
        required
      />

      <Text size="sm" c="dimmed">
        Visitors will be directed to your external merch store.
      </Text>
    </Stack>
  );
}
