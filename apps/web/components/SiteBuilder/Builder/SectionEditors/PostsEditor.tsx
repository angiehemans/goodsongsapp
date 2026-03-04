'use client';

import { NumberInput, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { PostsContent, PostsSettings } from '@/lib/site-builder/types';
import { DISPLAY_LIMITS } from '@/lib/site-builder/constants';

interface PostsEditorProps {
  index: number;
  content: PostsContent;
  settings?: PostsSettings;
}

export function PostsEditor({ index, settings }: PostsEditorProps) {
  const { updateSectionSettings } = useBuilderStore();

  const handleSettingsChange = (field: keyof PostsSettings, value: number | undefined) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <NumberInput
        label="Number of posts to show"
        value={settings?.display_limit || DISPLAY_LIMITS.posts.default}
        onChange={(value) => handleSettingsChange('display_limit', value as number)}
        min={DISPLAY_LIMITS.posts.min}
        max={DISPLAY_LIMITS.posts.max}
      />

      <Text size="sm" c="dimmed">
        Shows your most recent blog posts. Visitors can click "View more" to see all posts.
      </Text>
    </Stack>
  );
}
