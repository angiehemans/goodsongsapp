'use client';

import { Stack, Textarea, Text, Group, Switch } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { AboutContent, AboutSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';

interface AboutEditorProps {
  index: number;
  content: AboutContent;
  settings?: AboutSettings;
}

export function AboutEditor({ index, content, settings }: AboutEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();

  const handleContentChange = (value: string) => {
    updateSectionContent(index, { bio: value });
  };

  const handleSettingsChange = (field: keyof AboutSettings, value: boolean) => {
    updateSectionSettings(index, { [field]: value });
  };

  const charCount = content.bio?.length || 0;

  return (
    <Stack gap="sm">
      <Textarea
        label="About text"
        description="Supports basic markdown: **bold**, *italic*, [links](url)"
        placeholder="Tell visitors about yourself..."
        value={content.bio || ''}
        onChange={(e) => handleContentChange(e.target.value)}
        maxLength={CHAR_LIMITS.about_body}
        minRows={6}
        autosize
        maxRows={12}
      />

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Tip: Use **text** for bold, *text* for italic
        </Text>
        <Text size="xs" c={charCount > CHAR_LIMITS.about_body * 0.9 ? 'orange' : 'dimmed'}>
          {charCount}/{CHAR_LIMITS.about_body}
        </Text>
      </Group>

      <Switch
        label="Show social links"
        description="Display your social media links in this section"
        checked={settings?.show_social_links !== false}
        onChange={(e) => handleSettingsChange('show_social_links', e.target.checked)}
      />
    </Stack>
  );
}
