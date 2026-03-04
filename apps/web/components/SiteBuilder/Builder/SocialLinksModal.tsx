'use client';

import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Button, Text, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
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
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

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

interface SocialLinksModalProps {
  opened: boolean;
  onClose: () => void;
  initialValues?: Record<string, string>;
  onSaved?: (links: Record<string, string>) => void;
}

export function SocialLinksModal({ opened, onClose, initialValues = {}, onSaved }: SocialLinksModalProps) {
  const { refreshUser } = useAuth();
  const [links, setLinks] = useState<Record<string, string>>(initialValues);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: SocialLinkType, value: string) => {
    setLinks((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();

      // Set each social link field
      SOCIAL_LINK_ORDER.forEach((key) => {
        const fieldName = SOCIAL_PLATFORMS[key].fieldName;
        const value = links[key] || '';
        formData.append(fieldName, value);
      });

      await apiClient.updateProfile(formData);
      await refreshUser();

      notifications.show({
        title: 'Social links updated',
        message: 'Your social links have been saved successfully.',
        color: 'green',
      });

      onSaved?.(links);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update social links';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update local state when modal opens with new values
  useEffect(() => {
    if (opened) {
      setLinks(initialValues);
    }
  }, [opened, initialValues]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Social Links"
      size="md"
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Add your social media links to display on your profile.
        </Text>

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
              size="sm"
            />
          );
        })}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="grape" onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
