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
  IconCheck,
  IconGripVertical,
  IconInfoCircle,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconMusic,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { MusicContent, MusicSettings, MusicData, MusicPlayerLayout, MusicTitleAlign, MusicGap } from '@/lib/site-builder/types';
import { AssetPicker } from '../AssetPicker';

interface MusicEditorProps {
  index: number;
  content: MusicContent;
  settings?: MusicSettings;
  data?: MusicData;
}

type EmbedSource = 'bandcamp' | 'spotify' | 'apple-music' | 'soundcloud' | 'youtube' | 'youtube-music' | 'unknown';

const MAX_EMBEDS = 8;

function detectEmbedSource(embedCode: string): EmbedSource {
  const trimmed = embedCode.trim();

  if (trimmed.includes('bandcamp.com')) {
    return 'bandcamp';
  }
  if (trimmed.includes('spotify.com') || trimmed.includes('open.spotify.com')) {
    return 'spotify';
  }
  if (trimmed.includes('music.apple.com') || trimmed.includes('embed.music.apple.com')) {
    return 'apple-music';
  }
  if (trimmed.includes('soundcloud.com') || trimmed.includes('w.soundcloud.com')) {
    return 'soundcloud';
  }
  // Check YouTube Music before regular YouTube
  if (trimmed.includes('music.youtube.com')) {
    return 'youtube-music';
  }
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return 'youtube';
  }

  return 'unknown';
}

function getSourceLabel(source: EmbedSource): string {
  switch (source) {
    case 'bandcamp':
      return 'Bandcamp';
    case 'spotify':
      return 'Spotify';
    case 'apple-music':
      return 'Apple Music';
    case 'soundcloud':
      return 'SoundCloud';
    case 'youtube':
      return 'YouTube';
    case 'youtube-music':
      return 'YouTube Music';
    default:
      return 'Unknown';
  }
}

// Apply theme colors to Bandcamp embed
function applyBandcampTheme(embedCode: string, bgColor: string, brandColor: string): string {
  const bgHex = bgColor.replace('#', '');
  const linkHex = brandColor.replace('#', '');

  if (!embedCode.includes('<iframe')) {
    return embedCode;
  }

  const srcMatch = embedCode.match(/src="([^"]+)"/);
  if (!srcMatch) return embedCode;

  let srcUrl = srcMatch[1];
  srcUrl = srcUrl.replace(/\/bgcol=[a-fA-F0-9]+/g, '');
  srcUrl = srcUrl.replace(/\/linkcol=[a-fA-F0-9]+/g, '');

  if (srcUrl.endsWith('/')) {
    srcUrl = srcUrl.slice(0, -1);
  }
  srcUrl = `${srcUrl}/bgcol=${bgHex}/linkcol=${linkHex}/`;

  return embedCode.replace(/src="[^"]+"/, `src="${srcUrl}"`);
}

// Layout option components
interface LayoutOption<T extends string> {
  value: T;
  icon: React.ReactNode;
  label: string;
}

const playerLayoutOptions: LayoutOption<MusicPlayerLayout>[] = [
  { value: 'left', icon: <IconLayoutAlignLeft size={18} />, label: 'Left' },
  { value: 'center', icon: <IconLayoutAlignCenter size={18} />, label: 'Center' },
  { value: 'right', icon: <IconLayoutAlignRight size={18} />, label: 'Right' },
];

const titleAlignOptions: LayoutOption<MusicTitleAlign>[] = [
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

export function MusicEditor({ index, content, settings, data }: MusicEditorProps) {
  const { updateSectionContent, updateSectionSettings, sourceData, theme } = useBuilderStore();
  const [inputValue, setInputValue] = useState('');
  const [isAddingEmbed, setIsAddingEmbed] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);

  // Get embeds array - migrate from legacy single embed if needed
  const getEmbeds = (): string[] => {
    if (content.embed_codes && content.embed_codes.length > 0) {
      return content.embed_codes;
    }
    // Migrate legacy single embed
    if (content.embed_code) {
      return [content.embed_code];
    }
    // Check for default from data
    if (data?.bandcamp_embed) {
      return [data.bandcamp_embed];
    }
    return [];
  };

  const embeds = getEmbeds();
  const canAddMore = embeds.length < MAX_EMBEDS;

  const handleContentChange = (field: keyof MusicContent, value: any) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = <K extends keyof MusicSettings>(field: K, value: MusicSettings[K]) => {
    updateSectionSettings(index, { [field]: value });
  };

  const handleAddEmbed = () => {
    if (!inputValue.trim()) return;

    let processedEmbed = inputValue.trim();
    const source = detectEmbedSource(processedEmbed);

    if (source === 'bandcamp' && theme) {
      processedEmbed = applyBandcampTheme(
        processedEmbed,
        theme.background_color,
        theme.brand_color
      );
    }

    const newEmbeds = [...embeds, processedEmbed];
    updateSectionContent(index, {
      embed_codes: newEmbeds,
      embed_code: undefined // Clear legacy field
    });
    setInputValue('');
    setIsAddingEmbed(false);
  };

  const handleRemoveEmbed = (embedIndex: number) => {
    const newEmbeds = embeds.filter((_, i) => i !== embedIndex);
    updateSectionContent(index, {
      embed_codes: newEmbeds,
      embed_code: undefined
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleAddEmbed();
    }
    if (e.key === 'Escape') {
      setIsAddingEmbed(false);
      setInputValue('');
    }
  };

  const handleBackgroundSelect = (url: string) => {
    handleSettingsChange('background_image_url', url);
    setAssetPickerOpen(false);
  };

  const handleRemoveBackground = () => {
    handleSettingsChange('background_image_url', undefined);
  };

  const playerLayout = settings?.player_layout || 'center';
  const titleAlign = settings?.title_align || 'left';

  return (
    <Stack gap={12}>
      {/* Section Title */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Section title</div>
        <div className="builder-field-row__input">
          <TextInput
            placeholder="Music"
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

      {/* Embeds List */}
      <Box>
        <Group justify="space-between" mb={8}>
          <Text className="builder-field-label">
            Embedded players ({embeds.length}/{MAX_EMBEDS})
          </Text>
        </Group>

        <Stack gap="xs">
          {embeds.map((embed, embedIndex) => {
            const source = detectEmbedSource(embed);
            return (
              <Group
                key={embedIndex}
                p="sm"
                style={{
                  backgroundColor: 'var(--gs-bg-surface-alt)',
                  borderRadius: 'var(--mantine-radius-md)',
                }}
              >
                <IconMusic size={18} style={{ opacity: 0.7 }} />
                <Text size="sm" style={{ flex: 1 }}>
                  {getSourceLabel(source)}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => handleRemoveEmbed(embedIndex)}
                  title="Remove embed"
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            );
          })}

          {/* Add Embed Form */}
          {isAddingEmbed ? (
            <Stack gap="xs" p="sm" style={{
              backgroundColor: 'var(--gs-bg-surface)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--gs-border-default)',
            }}>
              <Textarea
                placeholder={`Paste embed code or link...

• Bandcamp: <iframe src="https://bandcamp.com/EmbeddedPlayer/..."></iframe>
• Spotify: https://open.spotify.com/album/...
• Apple Music: https://music.apple.com/...
• SoundCloud: https://soundcloud.com/...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                minRows={3}
                maxRows={6}
                autosize
                autoFocus
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  },
                }}
              />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  ⌘+Enter to add, Esc to cancel
                </Text>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      setIsAddingEmbed(false);
                      setInputValue('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    leftSection={<IconCheck size={14} />}
                    onClick={handleAddEmbed}
                    disabled={!inputValue.trim()}
                  >
                    Add
                  </Button>
                </Group>
              </Group>
            </Stack>
          ) : canAddMore ? (
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => setIsAddingEmbed(true)}
              fullWidth
              size="sm"
            >
              Add Embed
            </Button>
          ) : null}

          {embeds.length === 0 && !isAddingEmbed && (
            <Text size="xs" c="dimmed" ta="center" py="sm">
              No embeds added yet. Click "Add Embed" to get started.
            </Text>
          )}
        </Stack>
      </Box>

      {/* Player Layout */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Player alignment</div>
        <div className="builder-field-row__input">
          <Group gap={10}>
            {playerLayoutOptions.map((option) => (
              <Tooltip key={option.value} label={option.label} position="top">
                <ActionIcon
                  variant={playerLayout === option.value ? 'filled' : 'default'}
                  size="lg"
                  onClick={() => handleSettingsChange('player_layout', option.value)}
                >
                  {option.icon}
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
        </div>
      </div>

      {/* Gap */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Gap</div>
        <div className="builder-field-row__input">
          <Select
            size="sm"
            value={settings?.gap || 'md'}
            onChange={(value) => handleSettingsChange('gap', value as MusicGap)}
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
