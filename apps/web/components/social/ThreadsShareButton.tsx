'use client';

import { useState } from 'react';
import { IconBrandThreads } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { shareToThreads } from '@/utils/share';

interface ThreadsShareButtonProps {
  intentUrl: string;
  size?: 'xs' | 'sm' | 'md';
}

export function ThreadsShareButton({ intentUrl, size = 'xs' }: ThreadsShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handleClick = () => {
    shareToThreads(intentUrl);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Button
      variant="subtle"
      color="gray"
      size={size}
      leftSection={<IconBrandThreads size={16} />}
      onClick={handleClick}
    >
      {shared ? 'Opened in Threads' : 'Threads'}
    </Button>
  );
}
