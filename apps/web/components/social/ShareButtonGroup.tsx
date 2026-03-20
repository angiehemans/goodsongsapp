'use client';

import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { apiClient } from '@/lib/api';
import { ThreadsShareButton } from './ThreadsShareButton';
import { InstagramShareButton } from './InstagramShareButton';
import { CopyLinkButton } from './CopyLinkButton';

interface SharePayload {
  text: string;
  url: string;
  image_url: string | null;
  threads_intent_url: string;
  instagram_intent_url: string | null;
}

interface ShareButtonGroupProps {
  postableType: 'review' | 'post' | 'event';
  postableId: number | string;
  size?: 'xs' | 'sm' | 'md';
}

export function ShareButtonGroup({ postableType, postableId, size = 'xs' }: ShareButtonGroupProps) {
  const [payload, setPayload] = useState<SharePayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .getSharePayload(postableType, postableId)
      .then((data) => {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[ShareButtonGroup] payload:', data);
          }
          setPayload(data);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[ShareButtonGroup] failed to fetch payload:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [postableType, postableId]);

  if (!payload) return null;

  return (
    <Group gap={4} wrap="wrap">
      {payload.threads_intent_url && (
        <ThreadsShareButton intentUrl={payload.threads_intent_url} size={size} />
      )}
      <InstagramShareButton text={payload.text} url={payload.url} imageUrl={payload.image_url} size={size} />
      <CopyLinkButton url={payload.url} size={size} />
    </Group>
  );
}
