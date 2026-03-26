'use client';

import Link from 'next/link';
import { IconBrandInstagram, IconBrandThreads, IconCheck, IconSettings } from '@tabler/icons-react';
import { Checkbox, Group, Stack, Text } from '@mantine/core';
import { useConnectedAccounts } from '@/lib/connectedAccounts';
import { isMobile } from '@/utils/platform';

interface CreationShareOptionsProps {
  threadsChecked: boolean;
  instagramChecked: boolean;
  onThreadsChange: (checked: boolean) => void;
  onInstagramChange: (checked: boolean) => void;
  /** The content type being created — used to check auto-post status */
  contentType?: 'recommendations' | 'band_posts' | 'events';
}

export function CreationShareOptions({
  threadsChecked,
  instagramChecked,
  onThreadsChange,
  onInstagramChange,
  contentType,
}: CreationShareOptionsProps) {
  const mobile = typeof window !== 'undefined' && isMobile();
  const { isConnected, hasAutoPost } = useConnectedAccounts();

  const threadsConnected = isConnected('threads');
  const threadsAutoPost = threadsConnected && contentType && hasAutoPost('threads', contentType);

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500} c="var(--gs-text-muted)">
        Share after posting
      </Text>

      {/* Threads */}
      {threadsAutoPost ? (
        <Group gap={6}>
          <IconCheck size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm" c="var(--gs-text-secondary)">
            Auto-posting to Threads is on
          </Text>
          <Text
            size="sm"
            c="var(--gs-text-muted)"
            component={Link}
            href="/user/settings"
            style={{ textDecoration: 'none' }}
          >
            <Group gap={4}>
              <IconSettings size={14} />
              settings
            </Group>
          </Text>
        </Group>
      ) : (
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
      )}

      {/* Instagram */}
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
