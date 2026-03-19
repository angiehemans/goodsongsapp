'use client';

import { TextInput, Textarea, Stack, Text, Group, SegmentedControl } from '@mantine/core';
import { IconAlignLeft, IconAlignCenter, IconAlignRight } from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { CustomTextContent, CustomTextSettings } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';

interface CustomTextEditorProps {
  index: number;
  content: CustomTextContent;
  settings?: CustomTextSettings;
}

export function CustomTextEditor({ index, content, settings }: CustomTextEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();

  const handleContentChange = (field: keyof CustomTextContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = (field: keyof CustomTextSettings, value: string) => {
    updateSectionSettings(index, { [field]: value });
  };

  const charCount = content.body?.length || 0;

  return (
    <Stack gap="sm">
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

      <div>
        <div className="builder-field-row__label">Content</div>
        <Textarea
          description="Supports markdown: **bold**, *italic*, [links](url), lists"
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

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Use ### for headings, **bold**, *italic*, and [links](url)
        </Text>
        <Text size="xs" c={charCount > CHAR_LIMITS.custom_text_body * 0.9 ? 'orange' : 'dimmed'}>
          {charCount}/{CHAR_LIMITS.custom_text_body}
        </Text>
      </Group>

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
    </Stack>
  );
}
