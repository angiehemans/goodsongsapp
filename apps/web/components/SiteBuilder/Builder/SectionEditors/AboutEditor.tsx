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
  IconInfoCircle,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconPhoto,
  IconTrash,
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
    <Stack gap={12}>
      {/* Section Title */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Section title</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="About"
            value={content.heading || ''}
            onChange={(e) => handleContentChange('heading', e.target.value)}
            size="sm"
            aria-label="Section title"
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

      {/* Title Alignment */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Title alignment</div>
        <div className="builder-field-row__input">
          <Group gap={10}>
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
      </div>

      {/* About Text */}
      <div>
        <Group gap={4} mb={4}>
          <div className="builder-field-row__label" style={{ marginBottom: 0 }}>About text</div>
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
          placeholder="Tell visitors about yourself..."
          value={content.bio || ''}
          onChange={(e) => handleContentChange('bio', e.target.value)}
          maxLength={CHAR_LIMITS.about_body}
          minRows={6}
          autosize
          maxRows={12}
          aria-label="About text"
        />
      </div>

      <Group justify="flex-end">
        <Text size="xs" c={charCount > CHAR_LIMITS.about_body * 0.9 ? 'orange' : 'dimmed'}>
          {charCount}/{CHAR_LIMITS.about_body}
        </Text>
      </Group>

      {/* Gap */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Gap</div>
        <div className="builder-field-row__input">
          <Select
            size="sm"
            value={settings?.gap || 'md'}
            onChange={(value) => handleSettingsChange('gap', value as AboutGap)}
            data={[
              { value: 'none', label: 'None' },
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
              { value: 'xl', label: 'Extra Large' },
            ]}
            aria-label="Gap"
          />
        </div>
      </div>

      {/* Background */}
      <Box>
        <Group gap={4} mb="xs">
          <Text className="builder-field-label" c="var(--gs-text-muted)">Background</Text>
          <Tooltip label="Customize the background of this section" withArrow position="top">
            <IconInfoCircle size={14} style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }} />
          </Tooltip>
        </Group>

        <Stack gap="xs" mb="sm">
          <div className="builder-field-row">
            <div className="builder-field-row__label">Background Color</div>
            <div className="builder-field-row__input">
              <ColorInput
                aria-label="Background Color"
                placeholder="Inherit"
                size="sm"
                format="hex"
                value={settings?.background_color || ''}
                onChange={(value) => handleSettingsChange('background_color', value || undefined)}
                swatches={['#121212', '#1a1a1a', '#0a0a0a', '#1e1e2e', '#0f172a', '#ffffff', '#f5f5f5']}
              />
            </div>
          </div>
        </Stack>

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
              <div className="builder-field-row">
                <div className="builder-field-row__label">Overlay Opacity</div>
                <div className="builder-field-row__input">
                  <NumberInput
                    size="sm"
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
                    aria-label="Overlay Opacity"
                  />
                </div>
              </div>
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
