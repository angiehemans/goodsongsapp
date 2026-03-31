'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Image,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconInfoCircle,
  IconPhoto,
  IconTrash,
} from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { CustomTextContent, CustomTextSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';
import { AssetPicker } from '../AssetPicker';

interface CustomTextEditorProps {
  index: number;
  content: CustomTextContent;
  settings?: CustomTextSettings;
}

export function CustomTextEditor({ index, content, settings }: CustomTextEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);

  const handleContentChange = (field: keyof CustomTextContent, value: string | undefined) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = (field: keyof CustomTextSettings, value: string) => {
    updateSectionSettings(index, { [field]: value });
  };

  const handleImageSelect = (url: string) => {
    handleContentChange('image_url', url);
    setAssetPickerOpen(false);
  };

  const charCount = content.body?.length || 0;

  return (
    <Stack gap={12}>
      <div className="builder-field-row">
        <div className="builder-field-row__label">Title</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="e.g., Press & Booking"
            value={content.title || ''}
            onChange={(e) => handleContentChange('title', e.target.value)}
            maxLength={CHAR_LIMITS.section_heading}
            size="sm"
            aria-label="Title"
          />
        </div>
      </div>

      {/* Menu Text */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">
          <Group gap={4}>
            Menu text
            <Tooltip label="Leave blank to use section title" withArrow position="top">
              <IconInfoCircle size={14} style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }} />
            </Tooltip>
          </Group>
        </div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder=""
            value={content.menu_label || ''}
            onChange={(e) => handleContentChange('menu_label', e.target.value)}
            size="sm"
            aria-label="Menu text"
          />
        </div>
      </div>

      <div>
        <Group gap={4} mb={4}>
          <div className="builder-field-row__label" style={{ marginBottom: 0 }}>Content</div>
          <Text size="xs" c="dimmed">— you can use markdown</Text>
          <Tooltip
            label={
              '**text** — Bold\n' +
              '*text* — Italic\n' +
              '[text](url) — Link\n' +
              '### text — Heading 3\n' +
              '#### text — Heading 4\n' +
              '- item — Bullet list\n' +
              '1. item — Numbered list\n' +
              '> text — Blockquote'
            }
            multiline
            w={220}
            position="top"
            withArrow
            styles={{
              tooltip: {
                whiteSpace: 'pre-line',
                fontSize: '12px',
                lineHeight: 1.8,
                backgroundColor: 'var(--gs-bg-app)',
                color: 'var(--gs-text-primary)',
                border: '1px solid var(--gs-border-default)',
              },
            }}
          >
            <IconInfoCircle size={14} style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }} />
          </Tooltip>
        </Group>
        <Textarea
          placeholder="Add your custom content here..."
          value={content.body || ''}
          onChange={(e) => handleContentChange('body', e.target.value)}
          maxLength={CHAR_LIMITS.custom_text_body}
          minRows={6}
          autosize
          maxRows={15}
          aria-label="Content"
        />
      </div>

      <Group justify="flex-end">
        <Text size="xs" c={charCount > CHAR_LIMITS.custom_text_body * 0.9 ? 'orange' : 'dimmed'}>
          {charCount}/{CHAR_LIMITS.custom_text_body}
        </Text>
      </Group>

      {/* Image */}
      <Box>
        <Text className="builder-field-label" c="var(--gs-text-muted)" mb="xs">
          Image
        </Text>
        {content.image_url ? (
          <Stack gap="xs">
            <Box pos="relative" style={{ borderRadius: 8, overflow: 'hidden' }}>
              <Image
                src={content.image_url}
                alt="Section image"
                height={120}
                fit="cover"
                radius="sm"
              />
              <Group pos="absolute" top={8} right={8} gap="xs">
                <ActionIcon
                  variant="filled"
                  color="dark"
                  onClick={() => setAssetPickerOpen(true)}
                  title="Change image"
                >
                  <IconPhoto size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="filled"
                  color="red"
                  onClick={() => handleContentChange('image_url', undefined)}
                  title="Remove image"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Box>
          </Stack>
        ) : (
          <Button
            variant="light"
            leftSection={<IconPhoto size={16} />}
            onClick={() => setAssetPickerOpen(true)}
            fullWidth
            size="xs"
          >
            Add Image
          </Button>
        )}
      </Box>

      {/* Action Button */}
      <Box>
        <Text className="builder-field-label" c="var(--gs-text-muted)" mb="xs">
          Action Button
        </Text>
        <Stack gap="xs">
          <div className="builder-field-row">
            <div className="builder-field-row__label">Button Text</div>
            <div className="builder-field-row__input">
              <TextInput
                placeholder="e.g., Book Now"
                value={content.button_text || ''}
                onChange={(e) => handleContentChange('button_text', e.target.value || undefined)}
                size="sm"
                aria-label="Button Text"
                maxLength={50}
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Button URL</div>
            <div className="builder-field-row__input">
              <TextInput
                placeholder="https://..."
                value={content.button_url || ''}
                onChange={(e) => handleContentChange('button_url', e.target.value || undefined)}
                size="sm"
                aria-label="Button URL"
                type="url"
              />
            </div>
          </div>
          {content.button_text && !content.button_url && (
            <Text size="xs" c="orange">Add a URL for the button to work</Text>
          )}
        </Stack>
      </Box>

      {/* Layout */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Layout</div>
        <div className="builder-field-row__input">
          <Select
            value={settings?.layout || 'row'}
            onChange={(value) => value && handleSettingsChange('layout', value)}
            data={[
              { value: 'row', label: 'Row' },
              { value: 'row-reverse', label: 'Row Reverse' },
              { value: 'stack', label: 'Stacked' },
            ]}
            size="sm"
            aria-label="Layout"
          />
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <Text className="builder-field-label" mb={4}>
          Text Alignment
        </Text>
        <SegmentedControl
          value={settings?.text_align || 'left'}
          onChange={(value) => handleSettingsChange('text_align', value)}
          data={[
            {
              value: 'left',
              label: (
                <Group gap={4}>
                  <IconAlignLeft size={16} />
                  <span>Left</span>
                </Group>
              ),
            },
            {
              value: 'center',
              label: (
                <Group gap={4}>
                  <IconAlignCenter size={16} />
                  <span>Center</span>
                </Group>
              ),
            },
            {
              value: 'right',
              label: (
                <Group gap={4}>
                  <IconAlignRight size={16} />
                  <span>Right</span>
                </Group>
              ),
            },
          ]}
          fullWidth
        />
      </div>

      <AssetPicker
        opened={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={handleImageSelect}
      />
    </Stack>
  );
}
