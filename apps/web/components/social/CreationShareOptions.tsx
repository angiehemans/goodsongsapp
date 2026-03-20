'use client';

import { IconBrandInstagram, IconBrandThreads } from '@tabler/icons-react';
import { Checkbox, Group, Stack, Text } from '@mantine/core';
import { isMobile } from '@/utils/platform';

interface CreationShareOptionsProps {
  threadsChecked: boolean;
  instagramChecked: boolean;
  onThreadsChange: (checked: boolean) => void;
  onInstagramChange: (checked: boolean) => void;
}

export function CreationShareOptions({
  threadsChecked,
  instagramChecked,
  onThreadsChange,
  onInstagramChange,
}: CreationShareOptionsProps) {
  const mobile = typeof window !== 'undefined' && isMobile();

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500} c="var(--gs-text-muted)">
        Share after posting
      </Text>
      <Checkbox
        label={
          <Group gap={6}>
            <IconBrandThreads size={16} />
            <span>Share to Threads</span>
          </Group>
        }
        checked={threadsChecked}
        onChange={(e) => onThreadsChange(e.currentTarget.checked)}
        size="sm"
      />
      <Checkbox
        label={
          <Group gap={6}>
            <IconBrandInstagram size={16} />
            <span>{mobile ? 'Share to Instagram' : 'Share to Instagram (caption will be copied)'}</span>
          </Group>
        }
        checked={instagramChecked}
        onChange={(e) => onInstagramChange(e.currentTarget.checked)}
        size="sm"
      />
    </Stack>
  );
}
