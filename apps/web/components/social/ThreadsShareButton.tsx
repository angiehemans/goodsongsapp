'use client';

import { useState } from 'react';
import { IconBrandThreads, IconCheck } from '@tabler/icons-react';
import { Button, Group, Text } from '@mantine/core';
import { useConnectedAccounts } from '@/lib/connectedAccounts';
import { shareToThreads } from '@/utils/share';

interface ThreadsShareButtonProps {
  intentUrl: string;
  contentType?: 'recommendations' | 'band_posts' | 'events';
  size?: 'xs' | 'sm' | 'md';
}

export function ThreadsShareButton({ intentUrl, contentType, size = 'xs' }: ThreadsShareButtonProps) {
  const [shared, setShared] = useState(false);
  const { hasAutoPost, isConnected } = useConnectedAccounts();

  const connected = isConnected('threads');
  const autoPosted = connected && contentType && hasAutoPost('threads', contentType);

  const handleClick = () => {
    shareToThreads(intentUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  // Auto-posted state: show confirmation + share again option
  if (autoPosted) {
    return (
      <Group gap={4}>
        <Button
          variant="subtle"
          color="green"
          size={size}
          leftSection={<IconCheck size={16} />}
          style={{ pointerEvents: 'none' }}
        >
          Posted to Threads
        </Button>
        <Button
          variant="subtle"
          color="gray"
          size={size}
          onClick={handleClick}
        >
          {shared ? 'Opened' : 'Share again'}
        </Button>
      </Group>
    );
  }

  // Connected but auto-post off, or not connected
  return (
    <Button
      variant="subtle"
      color="gray"
      size={size}
      leftSection={<IconBrandThreads size={16} />}
      onClick={handleClick}
    >
      {shared ? 'Opened in Threads' : connected ? 'Post to Threads' : 'Threads'}
    </Button>
  );
}
