'use client';

import { useState } from 'react';
import { IconBrandInstagram } from '@tabler/icons-react';
import { Button, Group, Text } from '@mantine/core';
import { shareToInstagram } from '@/utils/share';
import { isMobile } from '@/utils/platform';

interface InstagramShareButtonProps {
  text: string;
  url: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md';
}

export function InstagramShareButton({ text, url, imageUrl, size = 'xs' }: InstagramShareButtonProps) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  const mobile = typeof window !== 'undefined' && isMobile();

  const handleClick = async () => {
    const result = await shareToInstagram(text, url, imageUrl);
    if (result.method === 'clipboard') {
      setState('copied');
    }
    // web_share and cancelled need no UI change
  };

  if (state === 'copied') {
    return (
      <Group gap={4}>
        <Button
          variant="subtle"
          color="gray"
          size={size}
          leftSection={<IconBrandInstagram size={16} />}
          onClick={() => window.open('https://www.instagram.com', '_blank', 'noopener')}
        >
          Caption copied — open Instagram
        </Button>
      </Group>
    );
  }

  return (
    <Button
      variant="subtle"
      color="gray"
      size={size}
      leftSection={<IconBrandInstagram size={16} />}
      onClick={handleClick}
    >
      {mobile ? 'Instagram' : 'Instagram (copies caption)'}
    </Button>
  );
}
