'use client';

import { useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Group,
  Image,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import {
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconPhoto,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { AboutContent, AboutSettings, AboutTitleAlign, AboutGap } from '@/lib/site-builder/types';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';
import { AssetPicker } from '../AssetPicker';

interface AboutEditorProps {
  index: number;
  content: AboutContent;
  settings?: AboutSettings;
}

interface LayoutOption<T extends string> {
  value: T;
  icon: React.ReactNode;
  label: string;
}

const titleAlignOptions: LayoutOption<AboutTitleAlign>[] = [
  { value: 'left', icon: <IconLayoutAlignLeft size={18} />, label: 'Left' },
  { value: 'center', icon: <IconLayoutAlignCenter size={18} />, label: 'Center' },
  { value: 'right', icon: <IconLayoutAlignRight size={18} />, label: 'Right' },
];

// Helper to handle shift+arrow keys for NumberInput (step by 10)
const handleNumberInputKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  currentValue: number | undefined,
  onChange: (value: number | undefined) => void,
  min?: number,
  max?: number
) => {
  if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    e.stopPropagation();
    const current = currentValue ?? 0;
    const step = e.key === 'ArrowUp' ? 10 : -10;
    let newValue = current + step;
    if (min !== undefined) newValue = Math.max(min, newValue);
    if (max !== undefined) newValue = Math.min(max, newValue);
    onChange(newValue);
  }
};

export function AboutEditor({ index, content, settings }: AboutEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);

  const handleContentChange = (field: keyof AboutContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = <K extends keyof AboutSettings>(field: K, value: AboutSettings[K]) => {
    updateSectionSettings(index, { [field]: value });
  };

  const handleBackgroundSelect = (url: string) => {
    handleSettingsChange('background_image_url', url);
    setAssetPickerOpen(false);
  };

  const handleRemoveBackground = () => {
    handleSettingsChange('background_image_url', undefined);
  };

  const charCount = content.bio?.length || 0;
  const titleAlign = settings?.title_align || 'left';

  return (
    <Stack gap="md">
      {/* Section Title */}
      <TextInput
        label="Section title"
        placeholder="About"
        value={content.heading || ''}
        onChange={(e) => handleContentChange('heading', e.target.value)}
      />

      {/* Title Alignment */}
      <div>
        <Text className="builder-field-label" mb={4}>Title alignment</Text>
        <Group gap="xs">
          {titleAlignOptions.map((option) => (
            <Tooltip key={option.value} label={option.label} position="top">
              <ActionIcon
                variant={titleAlign === option.value ? 'filled' : 'default'}
                size="lg"
                onClick={() => handleSettingsChange('title_align', option.value)}
              >
                {option.icon}
              </ActionIcon>
            </Tooltip>
          ))}
        </Group>
      </div>

      {/* About Text */}
      <Textarea
        label="About text"
        description="Supports basic markdown: **bold**, *italic*, [links](url)"
        placeholder="Tell visitors about yourself..."
        value={content.bio || ''}
        onChange={(e) => handleContentChange('bio', e.target.value)}
        maxLength={CHAR_LIMITS.about_body}
        minRows={6}
        autosize
        maxRows={12}
      />

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Tip: Use **text** for bold, *text* for italic
        </Text>
        <Text size="xs" c={charCount > CHAR_LIMITS.about_body * 0.9 ? 'orange' : 'dimmed'}>
          {charCount}/{CHAR_LIMITS.about_body}
        </Text>
      </Group>

      {/* Gap */}
      <Select
        label="Gap"
        size="xs"
        value={settings?.gap || 'md'}
        onChange={(value) => handleSettingsChange('gap', value as AboutGap)}
        data={[
          { value: 'none', label: 'None' },
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
          { value: 'xl', label: 'Extra Large' },
        ]}
      />

      {/* Background Color */}
      <Group align="flex-end" gap="xs">
        <ColorInput
          label="Background color"
          placeholder="Use theme default"
          value={settings?.background_color || ''}
          onChange={(value) => handleSettingsChange('background_color', value || undefined)}
          style={{ flex: 1 }}
          size="xs"
        />
        {settings?.background_color && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => handleSettingsChange('background_color', undefined)}
            title="Reset to default"
          >
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>

      {/* Background Image */}
      <Box>
        <Text className="builder-field-label" mb={8}>Background image</Text>

        {settings?.background_image_url ? (
          <Stack gap="xs">
            <Box pos="relative" style={{ borderRadius: 8, overflow: 'hidden' }}>
              <Image
                src={settings.background_image_url}
                alt="Background preview"
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
                  onClick={handleRemoveBackground}
                  title="Remove image"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Box>
            <Group justify="space-between">
              <Text size="xs">Color Overlay</Text>
              <Switch
                size="xs"
                checked={settings?.background_overlay !== false}
                onChange={(e) => handleSettingsChange('background_overlay', e.target.checked)}
              />
            </Group>
            {settings?.background_overlay !== false && (
              <NumberInput
                label="Overlay Opacity"
                size="xs"
                value={settings?.background_overlay_opacity ?? 85}
                onChange={(value) =>
                  handleSettingsChange(
                    'background_overlay_opacity',
                    value === '' ? undefined : Number(value)
                  )
                }
                onKeyDownCapture={(e) =>
                  handleNumberInputKeyDown(
                    e,
                    settings?.background_overlay_opacity ?? 85,
                    (v) => handleSettingsChange('background_overlay_opacity', v),
                    0,
                    100
                  )
                }
                min={0}
                max={100}
                suffix="%"
                allowDecimal={false}
              />
            )}
          </Stack>
        ) : (
          <Button
            variant="light"
            leftSection={<IconPhoto size={16} />}
            onClick={() => setAssetPickerOpen(true)}
            fullWidth
          >
            Add Background Image
          </Button>
        )}
      </Box>

      <AssetPicker
        opened={assetPickerOpen}
        onClose={() => setAssetPickerOpen(false)}
        onSelect={handleBackgroundSelect}
      />
    </Stack>
  );
}
