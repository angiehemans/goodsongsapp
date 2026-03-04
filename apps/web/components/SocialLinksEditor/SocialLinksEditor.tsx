'use client';

import { useState, useEffect } from 'react';
import { Stack, TextInput, Button, Text, Group } from '@mantine/core';
import {
  IconBrandInstagram,
  IconBrandThreads,
  IconBrandBluesky,
  IconBrandX,
  IconBrandTumblr,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { SocialLinkType } from '@/lib/site-builder/types';
import { SOCIAL_PLATFORMS, SOCIAL_LINK_ORDER } from '@/lib/social-links';

const SOCIAL_ICONS: Record<SocialLinkType, React.ReactNode> = {
  instagram: <IconBrandInstagram size={18} />,
  threads: <IconBrandThreads size={18} />,
  bluesky: <IconBrandBluesky size={18} />,
  twitter: <IconBrandX size={18} />,
  tumblr: <IconBrandTumblr size={18} />,
  tiktok: <IconBrandTiktok size={18} />,
  facebook: <IconBrandFacebook size={18} />,
  youtube: <IconBrandYoutube size={18} />,
};

export interface SocialLinksData {
  instagram?: string;
  threads?: string;
  bluesky?: string;
  twitter?: string;
  tumblr?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
}

interface SocialLinksEditorProps {
  initialValues?: Record<string, string>;
  onSave: (links: Record<string, string>) => Promise<void>;
  isSaving?: boolean;
}

export function SocialLinksEditor({ initialValues = {}, onSave, isSaving = false }: SocialLinksEditorProps) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLinks(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const changed = SOCIAL_LINK_ORDER.some(
      (key) => (links[key] || '') !== (initialValues[key] || '')
    );
    setHasChanges(changed);
  }, [links, initialValues]);

  const handleChange = (key: SocialLinkType, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    // Filter out empty values and create the save payload
    const payload: Record<string, string> = {};
    SOCIAL_LINK_ORDER.forEach((key) => {
      const value = links[key]?.trim();
      if (value) {
        payload[key] = value;
      }
    });
    await onSave(payload);
  };

  return (
    <Stack gap="sm">
      {SOCIAL_LINK_ORDER.map((key) => {
        const platform = SOCIAL_PLATFORMS[key];
        return (
          <TextInput
            key={key}
            label={
              <Group gap={6}>
                {SOCIAL_ICONS[key]}
                <Text size="sm">{platform.name}</Text>
              </Group>
            }
            placeholder={platform.placeholder}
            value={links[key] || ''}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        );
      })}

      <Button
        color="grape"
        onClick={handleSave}
        loading={isSaving}
        disabled={!hasChanges}
        mt="sm"
      >
        Save Social Links
      </Button>
    </Stack>
  );
}
