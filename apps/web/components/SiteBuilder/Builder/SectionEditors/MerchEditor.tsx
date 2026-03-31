'use client';

import { Group, TextInput, Stack, Text, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { MerchContent, MerchSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';

interface MerchEditorProps {
  index: number;
  content: MerchContent;
  settings?: MerchSettings;
}

export function MerchEditor({ index, content, settings }: MerchEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();

  const handleContentChange = (field: keyof MerchContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = (field: keyof MerchSettings, value: string) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <div className="builder-field-row">
        <div className="builder-field-row__label">Heading</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="Merch"
            value={content.heading || ''}
            onChange={(e) => handleContentChange('heading', e.target.value)}
            maxLength={CHAR_LIMITS.section_heading}
            size="sm"
            aria-label="Heading"
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

      <div className="builder-field-row">
        <div className="builder-field-row__label">Store URL</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="https://yourband.bandcamp.com/merch"
            value={settings?.store_url || ''}
            onChange={(e) => handleSettingsChange('store_url', e.target.value)}
            type="url"
            required
            size="sm"
            aria-label="Store URL"
          />
        </div>
      </div>

      <Text size="sm" c="dimmed">
        Visitors will be directed to your external merch store.
      </Text>
    </Stack>
  );
}
