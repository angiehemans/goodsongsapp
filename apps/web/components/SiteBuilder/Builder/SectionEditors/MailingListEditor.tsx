'use client';

import { TextInput, Textarea, Stack, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { MailingListContent, MailingListSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';

interface MailingListEditorProps {
  index: number;
  content: MailingListContent;
  settings?: MailingListSettings;
}

export function MailingListEditor({ index, content, settings }: MailingListEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();

  const handleContentChange = (field: keyof MailingListContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = (field: keyof MailingListSettings, value: string) => {
    updateSectionSettings(index, { [field]: value });
  };

  return (
    <Stack gap="sm">
      <div className="builder-field-row">
        <div className="builder-field-row__label">Heading</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="Stay Updated"
            value={content.heading || ''}
            onChange={(e) => handleContentChange('heading', e.target.value)}
            maxLength={CHAR_LIMITS.section_heading}
            size="sm"
            aria-label="Heading"
          />
        </div>
      </div>

      <div>
        <div className="builder-field-row__label">Description</div>
        <Textarea
          placeholder="Subscribe to get the latest updates..."
          value={content.description || ''}
          onChange={(e) => handleContentChange('description', e.target.value)}
          maxLength={CHAR_LIMITS.mailing_list_description}
          minRows={2}
          size="sm"
          aria-label="Description"
        />
      </div>

      <div className="builder-field-row">
        <div className="builder-field-row__label">External Provider URL</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="https://..."
            value={settings?.provider_url || ''}
            onChange={(e) => handleSettingsChange('provider_url', e.target.value)}
            type="url"
            size="sm"
            aria-label="External Provider URL"
          />
        </div>
      </div>

      <Text size="sm" c="dimmed">
        {settings?.provider_url
          ? 'Visitors will be directed to your external signup form.'
          : 'Subscribers will be added to your GoodSongs mailing list.'}
      </Text>
    </Stack>
  );
}
