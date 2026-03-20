'use client';

import { useState } from 'react';
import { IconCheck, IconLink } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { copyLink } from '@/utils/share';

interface CopyLinkButtonProps {
  url: string;
  size?: 'xs' | 'sm' | 'md';
}

export function CopyLinkButton({ url, size = 'xs' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await copyLink(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="subtle"
      color={copied ? 'green' : 'gray'}
      size={size}
      leftSection={copied ? <IconCheck size={16} /> : <IconLink size={16} />}
      onClick={handleClick}
    >
      {copied ? 'Link copied' : 'Copy link'}
    </Button>
  );
}
