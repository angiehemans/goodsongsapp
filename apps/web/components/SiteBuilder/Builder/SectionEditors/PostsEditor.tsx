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
  Tooltip,
} from '@mantine/core';
import {
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconLayoutGrid,
  IconLayoutList,
  IconPhoto,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { PostsContent, PostsSettings, PostsLayout, PostsTitleAlign, PostsGap } from '@/lib/site-builder/types';
import { AssetPicker } from '../AssetPicker';

interface PostsEditorProps {
  index: number;
  content: PostsContent;
  settings?: PostsSettings;
}

// Layout option components
interface LayoutOption<T extends string> {
  value: T;
  icon: React.ReactNode;
  label: string;
}

const layoutOptions: LayoutOption<PostsLayout>[] = [
  { value: 'grid', icon: <IconLayoutGrid size={18} />, label: 'Grid' },
  { value: 'stack', icon: <IconLayoutList size={18} />, label: 'Stack' },
];

const titleAlignOptions: LayoutOption<PostsTitleAlign>[] = [
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

export function PostsEditor({ index, content, settings }: PostsEditorProps) {
  const { updateSectionContent, updateSectionSettings } = useBuilderStore();
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);

  const handleContentChange = (field: keyof PostsContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = <K extends keyof PostsSettings>(field: K, value: PostsSettings[K]) => {
    updateSectionSettings(index, { [field]: value });
  };

  const handleBackgroundSelect = (url: string) => {
    handleSettingsChange('background_image_url', url);
    setAssetPickerOpen(false);
  };

  const handleRemoveBackground = () => {
    handleSettingsChange('background_image_url', undefined);
  };

  const layout = settings?.layout || 'grid';
  const titleAlign = settings?.title_align || 'left';

  return (
    <Stack gap="md">
      {/* Section Title */}
      <TextInput
        label="Section title"
        placeholder="Posts"
        value={content.heading || ''}
        onChange={(e) => handleContentChange('heading', e.target.value)}
      />

      {/* Title Alignment */}
      <div>
        <Text size="sm" fw={500} mb={4}>Title alignment</Text>
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

      {/* Layout */}
      <div>
        <Text size="sm" fw={500} mb={4}>Layout</Text>
        <Group gap="xs">
          {layoutOptions.map((option) => (
            <Tooltip key={option.value} label={option.label} position="top">
              <ActionIcon
                variant={layout === option.value ? 'filled' : 'default'}
                size="lg"
                onClick={() => handleSettingsChange('layout', option.value)}
              >
                {option.icon}
              </ActionIcon>
            </Tooltip>
          ))}
        </Group>
      </div>

      {/* Posts to Show */}
      <NumberInput
        label="Posts to show"
        description="Maximum 9 posts"
        value={settings?.display_limit || 6}
        onChange={(value) => handleSettingsChange('display_limit', value === '' ? undefined : Number(value))}
        min={1}
        max={9}
        size="xs"
      />

      {/* Gap */}
      <Select
        label="Gap"
        size="xs"
        value={settings?.gap || 'md'}
        onChange={(value) => handleSettingsChange('gap', value as PostsGap)}
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
        <Text size="sm" fw={500} mb={8}>Background image</Text>

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
