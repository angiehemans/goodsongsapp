'use client';

import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconGripVertical,
  IconInfoCircle,
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutDistributeVertical,
  IconLink,
  IconPhoto,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  Image,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import { CHAR_LIMITS } from '@/lib/site-builder/constants';
import { useBuilderStore, useSourceData } from '@/lib/site-builder/store';
import {
  HeroContent,
  HeroElement,
  HeroGap,
  HeroHeight,
  HeroJustify,
  HeroLayout,
  HeroSettings,
  SocialLinkType,
} from '@/lib/site-builder/types';
import { SOCIAL_LINK_ORDER, SOCIAL_PLATFORMS } from '@/lib/social-links';
import { AssetPicker } from '../AssetPicker';
import { SocialLinksModal } from '../SocialLinksModal';

interface HeroEditorProps {
  index: number;
  content: HeroContent;
  settings?: HeroSettings;
}

const ALL_HERO_ELEMENTS: HeroElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
];
const DEFAULT_ELEMENT_ORDER: HeroElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
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

interface SortableElementProps {
  id: HeroElement;
  children: (gripProps: { attributes: any; listeners: any }) => React.ReactNode;
}

function SortableElement({ id, children }: SortableElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="hero-sortable-item">
      {children({ attributes, listeners })}
    </div>
  );
}

function InlineGrip({ attributes, listeners }: { attributes: any; listeners: any }) {
  return (
    <span
      style={{
        cursor: 'grab',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 4px 2px 1px',
        touchAction: 'none',
      }}
      {...attributes}
      {...listeners}
    >
      <IconGripVertical size={10} style={{ color: 'var(--gs-text-extra-muted)' }} />
    </span>
  );
}

export function HeroEditor({ index, content, settings }: HeroEditorProps) {
  const { updateSectionContent, updateSectionSettings, setSourceData } = useBuilderStore();
  const sourceData = useSourceData();
  const { user } = useAuth();
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const [socialLinksOpen, setSocialLinksOpen] = useState(false);

  // Get available social links from source data
  const availableSocialLinks = sourceData?.social_links || {};
  const socialLinksWithValues = SOCIAL_LINK_ORDER.filter((key) => availableSocialLinks[key]);
  const visibleSocialLinks = settings?.visible_social_links;

  // Ensure all elements are present in the order (handles migration when new elements are added)
  const savedOrder = settings?.element_order || DEFAULT_ELEMENT_ORDER;
  const missingElements = ALL_HERO_ELEMENTS.filter((el) => !savedOrder.includes(el));
  const elementOrder = [...savedOrder, ...missingElements];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleContentChange = (field: keyof HeroContent, value: string) => {
    updateSectionContent(index, { [field]: value });
  };

  const handleSettingsChange = <K extends keyof HeroSettings>(field: K, value: HeroSettings[K]) => {
    updateSectionSettings(index, { [field]: value });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = elementOrder.indexOf(active.id as HeroElement);
      const newIndex = elementOrder.indexOf(over.id as HeroElement);
      const newOrder = arrayMove(elementOrder, oldIndex, newIndex);
      handleSettingsChange('element_order', newOrder);
    }
  };

  const handleBackgroundSelect = (url: string) => {
    handleSettingsChange('background_image_url', url);
    setAssetPickerOpen(false);
  };

  const handleRemoveBackground = () => {
    handleSettingsChange('background_image_url', undefined);
  };

  const handleLogoSelect = (url: string) => {
    handleSettingsChange('headline_logo_url', url);
    setLogoPickerOpen(false);
  };

  const handleToggleSocialLink = (key: SocialLinkType, checked: boolean) => {
    // If visible_social_links is not an array, it means all are visible ("configured" or null/undefined)
    // When toggling off a link, we need to create the array with all except that one
    // When toggling on, we add it back
    if (!Array.isArray(visibleSocialLinks)) {
      if (!checked) {
        // First time hiding a link - create array with all except this one
        handleSettingsChange(
          'visible_social_links',
          socialLinksWithValues.filter((k) => k !== key)
        );
      }
    } else {
      if (checked) {
        handleSettingsChange('visible_social_links', [...visibleSocialLinks, key]);
      } else {
        handleSettingsChange(
          'visible_social_links',
          visibleSocialLinks.filter((k) => k !== key)
        );
      }
    }
  };

  const isSocialLinkVisible = (key: SocialLinkType): boolean => {
    if (!Array.isArray(visibleSocialLinks)) {
      return true;
    }
    return visibleSocialLinks.includes(key);
  };

  const handleSocialLinksSaved = (links: Record<string, string>) => {
    // Update the sourceData in the builder store with the new social links
    if (sourceData) {
      setSourceData({
        ...sourceData,
        social_links: links,
      });
    }
  };

  const LabelWithTooltip = ({
    label,
    tooltip,
    grip,
  }: {
    label: string;
    tooltip: string;
    grip?: React.ReactNode;
  }) => (
    <Group gap={4}>
      {grip}
      <Text className="builder-field-label" c="var(--gs-text-muted)">
        {label}
      </Text>
      <Tooltip label={tooltip} withArrow position="top">
        <IconInfoCircle size={14} style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }} />
      </Tooltip>
    </Group>
  );

  const renderElement = (element: HeroElement) => {
    switch (element) {
      case 'profile_image':
        return (
          <SortableElement key="profile_image" id="profile_image">
            {({ attributes, listeners }) => (
              <Group h={24} justify="space-between">
                <LabelWithTooltip
                  label="Profile Image"
                  tooltip="Display your profile picture in the hero section"
                  grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                />
                <Switch
                  size="xs"
                  checked={settings?.show_profile_image !== false}
                  onChange={(e) => handleSettingsChange('show_profile_image', e.target.checked)}
                />
              </Group>
            )}
          </SortableElement>
        );

      case 'headline':
        return (
          <SortableElement key="headline" id="headline">
            {({ attributes, listeners }) => (
              <Stack gap="xs">
                <Group h={24} justify="space-between">
                  <LabelWithTooltip
                    label="Headline"
                    tooltip="Override your display name or use a logo image"
                    grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                  />
                  <Switch
                    size="xs"
                    checked={settings?.show_headline !== false}
                    onChange={(e) => handleSettingsChange('show_headline', e.target.checked)}
                  />
                </Group>

                {/* Logo Image Option */}
                {settings?.headline_logo_url ? (
                  <Box pos="relative" style={{ borderRadius: 8, overflow: 'hidden' }}>
                    <Image
                      src={settings.headline_logo_url}
                      alt="Logo preview"
                      height={80}
                      fit="contain"
                      radius="sm"
                      bg="dark.6"
                    />
                    <Group pos="absolute" top={8} right={8} gap="xs">
                      <ActionIcon
                        variant="filled"
                        color="dark"
                        onClick={() => setLogoPickerOpen(true)}
                        title="Change logo"
                      >
                        <IconPhoto size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="filled"
                        color="red"
                        onClick={() => {
                          handleSettingsChange('headline_logo_url', undefined);
                          handleSettingsChange('headline_logo_width', undefined);
                        }}
                        title="Remove logo"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Box>
                ) : (
                  <Button
                    variant="light"
                    leftSection={<IconPhoto size={16} />}
                    onClick={() => setLogoPickerOpen(true)}
                    fullWidth
                    size="xs"
                    disabled={settings?.show_headline === false}
                  >
                    Use Logo Image
                  </Button>
                )}

                {/* Logo Width (when logo is set) */}
                {settings?.headline_logo_url && (
                  <div className="builder-field-row">
                    <div className="builder-field-row__label">Logo Width</div>
                    <div className="builder-field-row__input">
                      <NumberInput
                        aria-label="Logo Width"
                        placeholder="e.g. 200"
                        size="sm"
                        value={settings?.headline_logo_width || ''}
                        onChange={(value) =>
                          handleSettingsChange(
                            'headline_logo_width',
                            value === '' ? undefined : Number(value)
                          )
                        }
                        onKeyDownCapture={(e) =>
                          handleNumberInputKeyDown(
                            e,
                            settings?.headline_logo_width,
                            (v) => handleSettingsChange('headline_logo_width', v),
                            50,
                            1024
                          )
                        }
                        min={50}
                        max={1024}
                        suffix=" px"
                        allowDecimal={false}
                      />
                    </div>
                  </div>
                )}

                {/* Text Headline (when no logo) */}
                {!settings?.headline_logo_url && (
                  <>
                    <TextInput
                      placeholder="Enter headline"
                      value={content.headline || ''}
                      onChange={(e) => handleContentChange('headline', e.target.value)}
                      maxLength={CHAR_LIMITS.hero_headline}
                      disabled={settings?.show_headline === false}
                      rightSection={
                        <Text size="xs" c="dimmed">
                          {content.headline?.length || 0}/{CHAR_LIMITS.hero_headline}
                        </Text>
                      }
                      rightSectionWidth={50}
                    />
                    <div className="builder-field-row">
                      <div className="builder-field-row__label">Font Size</div>
                      <div className="builder-field-row__input">
                        <NumberInput
                          aria-label="Font Size"
                          placeholder="e.g. 48"
                          size="sm"
                          value={settings?.headline_font_size || ''}
                          onChange={(value) =>
                            handleSettingsChange(
                              'headline_font_size',
                              value === '' ? undefined : Number(value)
                            )
                          }
                          onKeyDownCapture={(e) =>
                            handleNumberInputKeyDown(
                              e,
                              settings?.headline_font_size,
                              (v) => handleSettingsChange('headline_font_size', v),
                              16,
                              120
                            )
                          }
                          min={16}
                          max={120}
                          suffix=" px"
                          allowDecimal={false}
                          disabled={settings?.show_headline === false}
                        />
                      </div>
                    </div>
                  </>
                )}
              </Stack>
            )}
          </SortableElement>
        );

      case 'subtitle':
        return (
          <SortableElement key="subtitle" id="subtitle">
            {({ attributes, listeners }) => (
              <Stack gap="xs">
                <Group h={24} justify="space-between">
                  <LabelWithTooltip
                    label="Subtitle"
                    tooltip="Override your location text"
                    grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                  />
                  <Switch
                    size="xs"
                    checked={settings?.show_subtitle !== false}
                    onChange={(e) => handleSettingsChange('show_subtitle', e.target.checked)}
                  />
                </Group>
                <TextInput
                  placeholder="Enter subtitle"
                  value={content.subtitle || ''}
                  onChange={(e) => handleContentChange('subtitle', e.target.value)}
                  maxLength={CHAR_LIMITS.hero_subtitle}
                  disabled={settings?.show_subtitle === false}
                  rightSection={
                    <Text size="xs" c="dimmed">
                      {content.subtitle?.length || 0}/{CHAR_LIMITS.hero_subtitle}
                    </Text>
                  }
                  rightSectionWidth={50}
                />
              </Stack>
            )}
          </SortableElement>
        );

      case 'description':
        return (
          <SortableElement key="description" id="description">
            {({ attributes, listeners }) => (
              <Stack gap="xs">
                <Group h={24} justify="space-between">
                  <LabelWithTooltip
                    label="Description"
                    tooltip="A short bio or tagline"
                    grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                  />
                  <Switch
                    size="xs"
                    checked={settings?.show_description !== false}
                    onChange={(e) => handleSettingsChange('show_description', e.target.checked)}
                  />
                </Group>
                <Textarea
                  placeholder="Tell visitors a bit about yourself..."
                  value={content.description || ''}
                  onChange={(e) => handleContentChange('description', e.target.value)}
                  maxLength={CHAR_LIMITS.hero_description}
                  minRows={2}
                  maxRows={4}
                  autosize
                  disabled={settings?.show_description === false}
                />
                <Text size="xs" c="dimmed" ta="right">
                  {content.description?.length || 0}/{CHAR_LIMITS.hero_description}
                </Text>
              </Stack>
            )}
          </SortableElement>
        );

      case 'social_links':
        return (
          <SortableElement key="social_links" id="social_links">
            {({ attributes, listeners }) =>
              socialLinksWithValues.length > 0 ? (
                <Stack gap="xs">
                  <Group h={24} justify="space-between">
                    <LabelWithTooltip
                      label="Social Links"
                      tooltip="Display your social media links in the hero section"
                      grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => setSocialLinksOpen(true)}
                      title="Edit social links"
                    >
                      <IconLink size={14} />
                    </ActionIcon>
                  </Group>
                  <Stack gap={4}>
                    {socialLinksWithValues.map((key) => (
                      <Group key={key} justify="space-between">
                        <Text c="var(--gs-text-extra-muted)" size="xs">
                          {SOCIAL_PLATFORMS[key].name}
                        </Text>
                        <Switch
                          size="xs"
                          checked={isSocialLinkVisible(key)}
                          onChange={(e) => handleToggleSocialLink(key, e.target.checked)}
                        />
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Button
                  variant="light"
                  leftSection={<IconLink size={16} />}
                  onClick={() => setSocialLinksOpen(true)}
                  fullWidth
                  size="xs"
                >
                  Add Social Links
                </Button>
              )
            }
          </SortableElement>
        );

      default:
        return null;
    }
  };

  return (
    <Stack gap={12}>
      {/* Menu Section */}
      <Box>
        <Group justify="space-between" mb="xs">
          <Group h={36} gap={4}>
            <Text fw={500} c="var(--gs-text-muted)" className="builder-field-label">
              Navigation Menu
            </Text>
            <Tooltip
              label="Add a navigation menu at the top of your hero section. Menu links are automatically generated from your visible sections."
              withArrow
              position="top"
            >
              <IconInfoCircle size={14} style={{ opacity: 0.5, cursor: 'help' }} />
            </Tooltip>
          </Group>
          <Switch
            size="xs"
            checked={settings?.show_menu === true}
            onChange={(e) => handleSettingsChange('show_menu', e.target.checked)}
          />
        </Group>
        {settings?.show_menu && (
          <Stack gap="xs">
            <div className="builder-field-row">
              <div className="builder-field-row__label">Menu Title</div>
              <div className="builder-field-row__input">
                <TextInput
                  aria-label="Menu Title"
                  placeholder="Override band/username"
                  size="sm"
                  value={settings?.menu_title || ''}
                  onChange={(e) => handleSettingsChange('menu_title', e.target.value || undefined)}
                />
              </div>
            </div>
            <div className="builder-field-row">
              <div className="builder-field-row__label">Background Color</div>
              <div className="builder-field-row__input">
                <Group gap="xs" align="flex-end">
                  <ColorInput
                    aria-label="Background Color"
                    placeholder="Transparent"
                    size="sm"
                    value={settings?.menu_background_color || ''}
                    onChange={(value) =>
                      handleSettingsChange('menu_background_color', value || undefined)
                    }
                    swatches={['#000000', '#ffffff', '#1a1a1a', '#2d2d2d']}
                    style={{ flex: 1 }}
                  />
                  {settings?.menu_background_color && (
                    <ActionIcon
                      variant="light"
                      color="gray"
                      size="md"
                      onClick={() => handleSettingsChange('menu_background_color', undefined)}
                      title="Reset to transparent"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  )}
                </Group>
              </div>
            </div>
            <Group h={36} justify="space-between">
              <Text size="xs" c="var(--gs-text-extra-muted)">
                Follow Button
              </Text>
              <Switch
                size="xs"
                checked={settings?.show_follow_button !== false}
                onChange={(e) => handleSettingsChange('show_follow_button', e.target.checked)}
              />
            </Group>
          </Stack>
        )}
      </Box>

      <Divider my="xs" />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={elementOrder} strategy={verticalListSortingStrategy}>
          <div>{elementOrder.map(renderElement)}</div>
        </SortableContext>
      </DndContext>

      <Divider my="xs" />

      {/* Section Layout sub-heading */}
      <div className="builder-section-subheading">
        <span className="builder-section-subheading__title">Section Layout</span>
        <Tooltip
          label="Control how content is positioned within the hero section"
          withArrow
          position="top"
        >
          <IconInfoCircle
            size={14}
            style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }}
          />
        </Tooltip>
      </div>

      <Stack gap={12}>
        {/* Horizontal Alignment */}
        <div className="builder-field-row">
          <div className="builder-field-row__label">Horizontal</div>
          <div className="builder-field-row__input">
            <Group gap={10}>
              {[
                { value: 'left', icon: IconLayoutAlignLeft, label: 'Left' },
                { value: 'center', icon: IconLayoutAlignCenter, label: 'Center' },
                { value: 'right', icon: IconLayoutAlignRight, label: 'Right' },
              ].map(({ value, icon: Icon, label }) => (
                <ActionIcon
                  key={value}
                  variant={(settings?.layout || 'center') === value ? 'filled' : 'default'}
                  size="lg"
                  onClick={() => handleSettingsChange('layout', value as HeroLayout)}
                  title={label}
                >
                  <Icon size={18} />
                </ActionIcon>
              ))}
            </Group>
          </div>
        </div>

        {/* Vertical Alignment */}
        <div className="builder-field-row">
          <div className="builder-field-row__label">Vertical</div>
          <div className="builder-field-row__input">
            <Group gap={4} justify="space-between">
              {[
                { value: 'top', icon: IconLayoutAlignTop, label: 'Top', rotate: false },
                { value: 'center', icon: IconLayoutAlignMiddle, label: 'Center', rotate: false },
                { value: 'bottom', icon: IconLayoutAlignBottom, label: 'Bottom', rotate: false },
                {
                  value: 'space-between',
                  icon: IconLayoutDistributeVertical,
                  label: 'Space Between',
                  rotate: true,
                },
              ].map(({ value, icon: Icon, label, rotate }) => (
                <ActionIcon
                  key={value}
                  variant={(settings?.justify || 'center') === value ? 'filled' : 'default'}
                  size="lg"
                  onClick={() => handleSettingsChange('justify', value as HeroJustify)}
                  title={label}
                >
                  <Icon size={18} style={rotate ? { transform: 'rotate(90deg)' } : undefined} />
                </ActionIcon>
              ))}
            </Group>
          </div>
        </div>

        {/* Gap and Height */}
        <div className="builder-field-row">
          <div className="builder-field-row__label">Gap</div>
          <div className="builder-field-row__input">
            <Select
              aria-label="Gap"
              size="sm"
              value={settings?.gap || 'lg'}
              onChange={(value) => handleSettingsChange('gap', value as HeroGap)}
              data={[
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'Extra Large' },
              ]}
            />
          </div>
        </div>

        <div className="builder-field-row">
          <div className="builder-field-row__label">Height</div>
          <div className="builder-field-row__input">
            <Select
              aria-label="Height"
              size="sm"
              value={settings?.height || 'auto'}
              onChange={(value) => handleSettingsChange('height', value as HeroHeight)}
              data={[
                { value: 'auto', label: 'Auto' },
                { value: 'fullscreen', label: 'Fullscreen' },
              ]}
            />
          </div>
        </div>
      </Stack>

      <Divider my="xs" />

      <Box>
        <Group gap={4} mb="xs">
          <Text className="builder-field-label" c="var(--gs-text-muted)">
            Background
          </Text>
          <Tooltip
            label="Customize the background color and image of your hero section"
            withArrow
            position="top"
          >
            <IconInfoCircle
              size={14}
              style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }}
            />
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
                swatches={[
                  '#121212',
                  '#1a1a1a',
                  '#0a0a0a',
                  '#1e1e2e',
                  '#0f172a',
                  '#ffffff',
                  '#f5f5f5',
                ]}
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
              <Text c="var(--gs-text-extra-muted)" size="xs">
                Color Overlay
              </Text>
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
                    aria-label="Overlay Opacity"
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

      <AssetPicker
        opened={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        onSelect={handleLogoSelect}
      />

      <SocialLinksModal
        opened={socialLinksOpen}
        onClose={() => setSocialLinksOpen(false)}
        initialValues={user?.social_links || {}}
        onSaved={handleSocialLinksSaved}
      />
    </Stack>
  );
}
