'use client';

import { useEffect, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconHeart,
  IconInfoCircle,
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutDistributeVertical,
  IconLink,
  IconMail,
  IconMusic,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconShoppingBag,
  IconStar,
  IconTrash,
  IconVideo,
  IconWorld,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  Image,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import {
  createProfileLink,
  deleteProfileLink,
  reorderProfileLinks,
  updateProfileLink,
} from '@/lib/site-builder/api';
import { CHAR_LIMITS, LINK_ICON_OPTIONS } from '@/lib/site-builder/constants';
import { FONT_CATEGORIES } from '@/lib/site-builder/fonts';
import { useBuilderStore } from '@/lib/site-builder/store';
import {
  LinkPageHeaderElement,
  LinkPageHeaderGap,
  LinkPageHeaderHeight,
  LinkPageHeaderJustify,
  LinkPageHeaderLayout,
  LinkPageSettings,
  ProfileLink,
} from '@/lib/site-builder/types';
import { AssetPicker } from './AssetPicker';

// --- Font options ---

const LINK_FONT_OPTIONS = FONT_CATEGORIES.map((category) => ({
  group: category.label,
  items: category.fonts.map((font) => ({ value: font, label: font })),
}));

function renderFontOption({ option }: { option: { value: string; label: string } }) {
  return (
    <Text size="sm" style={{ fontFamily: `"${option.value}", sans-serif` }}>
      {option.label}
    </Text>
  );
}

// --- Icon helpers ---

const ICON_MAP: Record<string, React.ReactNode> = {
  link: <IconLink size={16} />,
  music: <IconMusic size={16} />,
  shop: <IconShoppingBag size={16} />,
  video: <IconVideo size={16} />,
  heart: <IconHeart size={16} />,
  star: <IconStar size={16} />,
  globe: <IconWorld size={16} />,
  mail: <IconMail size={16} />,
};

function getLinkIcon(icon?: string) {
  return ICON_MAP[icon || 'link'] || <IconLink size={16} />;
}

// --- Number input shift+arrow helper ---

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

// --- Header element ordering ---

const ALL_HEADER_ELEMENTS: LinkPageHeaderElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
];
const DEFAULT_ELEMENT_ORDER: LinkPageHeaderElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
];

function SortableHeaderElement({
  id,
  children,
}: {
  id: LinkPageHeaderElement;
  children: (gripProps: { attributes: any; listeners: any }) => React.ReactNode;
}) {
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

// --- Sortable Link Item ---

interface SortableLinkItemProps {
  link: ProfileLink;
  onEdit: (link: ProfileLink) => void;
  onDelete: (link: ProfileLink) => void;
  onToggleVisibility: (link: ProfileLink) => void;
}

function SortableLinkItem({ link, onEdit, onDelete, onToggleVisibility }: SortableLinkItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Group
        gap="xs"
        wrap="nowrap"
        style={{
          padding: '8px 10px',
          borderRadius: 6,
          background: 'var(--gs-bg-surface-alt)',
          opacity: link.visible ? 1 : 0.5,
        }}
      >
        <ActionIcon
          variant="subtle"
          size="sm"
          color="gray"
          style={{ cursor: 'grab' }}
          {...listeners}
        >
          <IconGripVertical size={14} />
        </ActionIcon>
        {link.thumbnail_url ? (
          <img
            src={link.thumbnail_url}
            alt=""
            style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {getLinkIcon(link.icon)}
          </span>
        )}
        <Text
          size="sm"
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {link.title}
        </Text>
        <Group gap={4}>
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" size="sm" color="gray" onClick={() => onEdit(link)}>
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={link.visible ? 'Hide' : 'Show'}>
            <ActionIcon
              variant="subtle"
              size="sm"
              color="gray"
              onClick={() => onToggleVisibility(link)}
            >
              {link.visible ? <IconEye size={14} /> : <IconEyeOff size={14} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" size="sm" color="red" onClick={() => onDelete(link)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </div>
  );
}

function LinkItemOverlay({ link }: { link: ProfileLink }) {
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        background: 'var(--gs-bg-surface-hover)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <IconGripVertical size={14} style={{ opacity: 0.5 }} />
      {link.thumbnail_url ? (
        <img
          src={link.thumbnail_url}
          alt=""
          style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }}
        />
      ) : (
        <span style={{ display: 'flex', alignItems: 'center' }}>{getLinkIcon(link.icon)}</span>
      )}
      <Text size="sm">{link.title}</Text>
    </Group>
  );
}

// --- Link Form Modal ---

interface LinkFormValues {
  title: string;
  url: string;
  icon: string;
}

// Thumbnail state tracked outside mantine form (File objects don't work well with useForm)
interface ThumbnailState {
  file: File | null; // New file to upload
  previewUrl: string; // Local preview or existing thumbnail_url
  remove: boolean; // Whether to remove existing thumbnail
}

interface LinkFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: LinkFormValues, thumbnail: ThumbnailState) => Promise<void>;
  initialValues?: LinkFormValues;
  existingThumbnailUrl?: string;
  isEditing?: boolean;
}

function LinkFormModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
  existingThumbnailUrl,
  isEditing,
}: LinkFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({
    file: null,
    previewUrl: '',
    remove: false,
  });
  const defaults: LinkFormValues = { title: '', url: '', icon: 'link' };
  const form = useForm<LinkFormValues>({
    initialValues: initialValues || defaults,
    validate: {
      title: (value) => {
        if (!value.trim()) return 'Title is required';
        if (value.length > CHAR_LIMITS.link_title)
          return `Max ${CHAR_LIMITS.link_title} characters`;
        return null;
      },
      url: (value) => {
        if (!value.trim()) return 'URL is required';
        if (!value.startsWith('http://') && !value.startsWith('https://'))
          return 'URL must start with http:// or https://';
        return null;
      },
    },
  });

  // Reset form values when modal opens
  useEffect(() => {
    if (opened) {
      form.setValues(initialValues || defaults);
      form.clearErrors();
      setThumbnail({ file: null, previewUrl: existingThumbnailUrl || '', remove: false });
    }
    return () => {
      // Clean up any blob URLs when modal closes
      setThumbnail((prev) => {
        if (prev.file && prev.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notifications.show({
        title: 'File too large',
        message: 'Thumbnail must be under 2MB',
        color: 'red',
      });
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notifications.show({
        title: 'Invalid file',
        message: 'Please use JPEG, PNG, or WebP',
        color: 'red',
      });
      return;
    }
    // Revoke previous blob URL if any
    if (thumbnail.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnail.previewUrl);
    }
    setThumbnail({ file, previewUrl: URL.createObjectURL(file), remove: false });
  };

  const handleRemoveThumbnail = () => {
    if (thumbnail.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnail.previewUrl);
    }
    setThumbnail({ file: null, previewUrl: '', remove: !!existingThumbnailUrl });
  };

  const handleSubmit = async (values: LinkFormValues) => {
    setLoading(true);
    try {
      await onSubmit(values, thumbnail);
      form.reset();
      onClose();
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Could not save link. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasImage = !!thumbnail.previewUrl;

  return (
    <Modal opened={opened} onClose={onClose} title={isEditing ? 'Edit Link' : 'Add Link'} size="sm">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Title"
            placeholder="My Website"
            maxLength={CHAR_LIMITS.link_title}
            {...form.getInputProps('title')}
          />
          <TextInput label="URL" placeholder="https://example.com" {...form.getInputProps('url')} />

          {/* Thumbnail */}
          <div>
            <Text size="sm" fw={500} mb={4}>
              Thumbnail
            </Text>
            {hasImage ? (
              <Group gap="sm" align="center">
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={thumbnail.previewUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Group gap={4}>
                  <Button variant="light" size="xs" component="label">
                    Change
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  <ActionIcon variant="light" color="red" size="sm" onClick={handleRemoveThumbnail}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            ) : (
              <Button
                variant="light"
                size="xs"
                leftSection={<IconPhoto size={14} />}
                component="label"
              >
                Add Thumbnail
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            )}
            {!hasImage && (
              <Text size="xs" c="dimmed" mt={4}>
                Without a thumbnail, the icon below will be shown.
              </Text>
            )}
          </div>

          {!hasImage && (
            <Select
              label="Icon"
              data={LINK_ICON_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              {...form.getInputProps('icon')}
            />
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Save' : 'Add Link'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// --- Label with tooltip helper ---

function LabelWithTooltip({
  label,
  tooltip,
  grip,
}: {
  label: string;
  tooltip: string;
  grip?: React.ReactNode;
}) {
  return (
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
}

// --- Main LinksEditor ---

export function LinksEditor() {
  const { pages, profileLinks, updatePageSettings, togglePageVisibility, setProfileLinks } =
    useBuilderStore();

  const linkPage = pages.find((p) => p.type === 'links');
  const settings: LinkPageSettings = linkPage?.settings || {};

  const [modalOpened, setModalOpened] = useState(false);
  const [editingLink, setEditingLink] = useState<ProfileLink | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<number | null>(null);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  // Sensors for both header element and link item dnd
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Settings helpers ---

  const handleSettingChange = <K extends keyof LinkPageSettings>(
    field: K,
    value: LinkPageSettings[K]
  ) => {
    updatePageSettings('links', { [field]: value });
  };

  // --- Header element ordering ---

  const savedOrder = settings.element_order || DEFAULT_ELEMENT_ORDER;
  const missingElements = ALL_HEADER_ELEMENTS.filter((el) => !savedOrder.includes(el));
  const elementOrder = [...savedOrder, ...missingElements];

  const handleHeaderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = elementOrder.indexOf(active.id as LinkPageHeaderElement);
      const newIndex = elementOrder.indexOf(over.id as LinkPageHeaderElement);
      const newOrder = arrayMove(elementOrder, oldIndex, newIndex);
      handleSettingChange('element_order', newOrder);
    }
  };

  // --- Background ---

  const handleBackgroundSelect = (url: string) => {
    handleSettingChange('background_image_url', url);
    setAssetPickerOpen(false);
  };

  const handleLogoSelect = (url: string) => {
    handleSettingChange('headline_logo_url', url);
    setLogoPickerOpen(false);
  };

  // --- Render header element ---

  const renderHeaderElement = (element: LinkPageHeaderElement) => {
    switch (element) {
      case 'profile_image':
        return (
          <SortableHeaderElement key="profile_image" id="profile_image">
            {({ attributes, listeners }) => (
              <Group h={24} justify="space-between">
                <LabelWithTooltip
                  label="Profile Image"
                  tooltip="Display your profile picture"
                  grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                />
                <Switch
                  size="xs"
                  checked={settings.show_profile_image !== false}
                  onChange={(e) => handleSettingChange('show_profile_image', e.target.checked)}
                />
              </Group>
            )}
          </SortableHeaderElement>
        );

      case 'headline':
        return (
          <SortableHeaderElement key="headline" id="headline">
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
                    checked={settings.show_headline !== false}
                    onChange={(e) => handleSettingChange('show_headline', e.target.checked)}
                  />
                </Group>
                {settings.headline_logo_url ? (
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
                          handleSettingChange('headline_logo_url', undefined);
                          handleSettingChange('headline_logo_width', undefined);
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
                    disabled={settings.show_headline === false}
                  >
                    Use Logo Image
                  </Button>
                )}
                {settings.headline_logo_url && (
                  <div className="builder-field-row">
                    <div className="builder-field-row__label">Logo Width</div>
                    <div className="builder-field-row__input">
                      <NumberInput
                        aria-label="Logo Width"
                        placeholder="e.g. 200"
                        size="sm"
                        value={settings.headline_logo_width || ''}
                        onChange={(value) =>
                          handleSettingChange(
                            'headline_logo_width',
                            value === '' ? undefined : Number(value)
                          )
                        }
                        onKeyDownCapture={(e) =>
                          handleNumberInputKeyDown(
                            e,
                            settings.headline_logo_width,
                            (v) => handleSettingChange('headline_logo_width', v),
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
                {!settings.headline_logo_url && (
                  <>
                    <TextInput
                      placeholder="Enter headline"
                      value={settings.headline_text || ''}
                      onChange={(e) => handleSettingChange('headline_text', e.target.value)}
                      maxLength={CHAR_LIMITS.link_page_heading}
                      disabled={settings.show_headline === false}
                      rightSection={
                        <Text size="xs" c="dimmed">
                          {settings.headline_text?.length || 0}/{CHAR_LIMITS.link_page_heading}
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
                          value={settings.headline_font_size || ''}
                          onChange={(value) =>
                            handleSettingChange(
                              'headline_font_size',
                              value === '' ? undefined : Number(value)
                            )
                          }
                          onKeyDownCapture={(e) =>
                            handleNumberInputKeyDown(
                              e,
                              settings.headline_font_size,
                              (v) => handleSettingChange('headline_font_size', v),
                              16,
                              120
                            )
                          }
                          min={16}
                          max={120}
                          suffix=" px"
                          allowDecimal={false}
                          disabled={settings.show_headline === false}
                        />
                      </div>
                    </div>
                  </>
                )}
              </Stack>
            )}
          </SortableHeaderElement>
        );

      case 'subtitle':
        return (
          <SortableHeaderElement key="subtitle" id="subtitle">
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
                    checked={settings.show_subtitle !== false}
                    onChange={(e) => handleSettingChange('show_subtitle', e.target.checked)}
                  />
                </Group>
                <TextInput
                  placeholder="Enter subtitle"
                  value={settings.subtitle_text || ''}
                  onChange={(e) => handleSettingChange('subtitle_text', e.target.value)}
                  maxLength={200}
                  disabled={settings.show_subtitle === false}
                  rightSection={
                    <Text size="xs" c="dimmed">
                      {settings.subtitle_text?.length || 0}/200
                    </Text>
                  }
                  rightSectionWidth={50}
                />
              </Stack>
            )}
          </SortableHeaderElement>
        );

      case 'description':
        return (
          <SortableHeaderElement key="description" id="description">
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
                    checked={settings.show_description !== false}
                    onChange={(e) => handleSettingChange('show_description', e.target.checked)}
                  />
                </Group>
                <Textarea
                  placeholder="Tell visitors a bit about yourself..."
                  value={settings.description_text || ''}
                  onChange={(e) => handleSettingChange('description_text', e.target.value)}
                  maxLength={CHAR_LIMITS.link_page_description}
                  minRows={2}
                  maxRows={4}
                  autosize
                  disabled={settings.show_description === false}
                />
                <Text size="xs" c="dimmed" ta="right">
                  {settings.description_text?.length || 0}/{CHAR_LIMITS.link_page_description}
                </Text>
              </Stack>
            )}
          </SortableHeaderElement>
        );

      case 'social_links':
        return (
          <SortableHeaderElement key="social_links" id="social_links">
            {({ attributes, listeners }) => (
              <Stack gap="xs">
                <Group justify="space-between">
                  <LabelWithTooltip
                    label="Social & Streaming"
                    tooltip="Display your social media and streaming platform links"
                    grip={<InlineGrip attributes={attributes} listeners={listeners} />}
                  />
                  <Group gap="xs">
                    <Switch
                      size="xs"
                      label="Social"
                      checked={settings.show_social_links !== false}
                      onChange={(e) => handleSettingChange('show_social_links', e.target.checked)}
                      styles={{ label: { fontSize: '0.7rem', paddingLeft: 4 } }}
                    />
                    <Switch
                      size="xs"
                      label="Streaming"
                      checked={settings.show_streaming_links !== false}
                      onChange={(e) =>
                        handleSettingChange('show_streaming_links', e.target.checked)
                      }
                      styles={{ label: { fontSize: '0.7rem', paddingLeft: 4 } }}
                    />
                  </Group>
                </Group>
              </Stack>
            )}
          </SortableHeaderElement>
        );

      default:
        return null;
    }
  };

  // --- Link CRUD ---

  const sortedLinks = [...profileLinks].sort((a, b) => a.position - b.position);
  const activeLink = activeLinkId != null ? sortedLinks.find((l) => l.id === activeLinkId) : null;

  const handleAddLink = async (values: LinkFormValues, thumb: ThumbnailState) => {
    const res = await createProfileLink({
      title: values.title,
      url: values.url,
      icon: thumb.previewUrl ? undefined : values.icon || undefined,
      thumbnail: thumb.file || undefined,
      position: profileLinks.length,
    });
    setProfileLinks([...profileLinks, res.data]);
  };

  const handleEditLink = async (values: LinkFormValues, thumb: ThumbnailState) => {
    if (!editingLink) return;
    const res = await updateProfileLink(editingLink.id, {
      title: values.title,
      url: values.url,
      icon: thumb.previewUrl ? undefined : values.icon || undefined,
      thumbnail: thumb.file || undefined,
      remove_thumbnail: thumb.remove || undefined,
    });
    setProfileLinks(profileLinks.map((l) => (l.id === editingLink.id ? res.data : l)));
    setEditingLink(null);
  };

  const handleDeleteLink = (link: ProfileLink) => {
    modals.openConfirmModal({
      title: 'Delete link?',
      children: <Text size="sm">Are you sure you want to delete &ldquo;{link.title}&rdquo;?</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteProfileLink(link.id);
          setProfileLinks(profileLinks.filter((l) => l.id !== link.id));
        } catch {
          notifications.show({ title: 'Error', message: 'Could not delete link.', color: 'red' });
        }
      },
    });
  };

  const handleToggleLinkVisibility = async (link: ProfileLink) => {
    try {
      const res = await updateProfileLink(link.id, { visible: !link.visible });
      setProfileLinks(profileLinks.map((l) => (l.id === link.id ? res.data : l)));
    } catch {
      notifications.show({ title: 'Error', message: 'Could not update link.', color: 'red' });
    }
  };

  const handleLinkDragStart = (event: DragStartEvent) => {
    setActiveLinkId(event.active.id as number);
  };

  const handleLinkDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLinkId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sortedLinks.findIndex((l) => l.id === active.id);
    const newIndex = sortedLinks.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newLinks = [...sortedLinks];
    const [moved] = newLinks.splice(oldIndex, 1);
    newLinks.splice(newIndex, 0, moved);
    const reorderedLinks = newLinks.map((l, i) => ({ ...l, position: i }));
    setProfileLinks(reorderedLinks);
    try {
      const res = await reorderProfileLinks(reorderedLinks.map((l) => l.id));
      setProfileLinks(res.data);
    } catch {
      setProfileLinks(sortedLinks);
      notifications.show({ title: 'Error', message: 'Could not reorder links.', color: 'red' });
    }
  };

  return (
    <Stack gap={12}>
      {/* Page Visibility */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Page visible</div>
        <div className="builder-field-row__input" style={{ flex: 'none' }}>
          <Switch
            size="xs"
            checked={linkPage?.visible ?? true}
            onChange={() => togglePageVisibility('links')}
            aria-label="Page visible"
          />
        </div>
      </div>

      <Divider />

      {/* Header Elements (drag-and-drop order) */}
      <div className="builder-section-subheading">
        <span className="builder-section-subheading__title">Header</span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleHeaderDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={elementOrder} strategy={verticalListSortingStrategy}>
          <div>{elementOrder.map(renderHeaderElement)}</div>
        </SortableContext>
      </DndContext>

      <Divider />

      {/* Layout & Alignment */}
      <div className="builder-section-subheading">
        <span className="builder-section-subheading__title">Header Layout</span>
        <Tooltip
          label="Control how content is positioned within the header"
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
        <div className="builder-field-row">
          <div className="builder-field-row__label">Horizontal</div>
          <div className="builder-field-row__input">
            <Group gap={10}>
              {(
                [
                  { value: 'left', icon: IconLayoutAlignLeft, label: 'Left' },
                  { value: 'center', icon: IconLayoutAlignCenter, label: 'Center' },
                  { value: 'right', icon: IconLayoutAlignRight, label: 'Right' },
                ] as const
              ).map(({ value, icon: Icon, label }) => (
                <ActionIcon
                  key={value}
                  variant={(settings.header_layout || 'center') === value ? 'filled' : 'default'}
                  size="lg"
                  onClick={() =>
                    handleSettingChange('header_layout', value as LinkPageHeaderLayout)
                  }
                  title={label}
                >
                  <Icon size={18} />
                </ActionIcon>
              ))}
            </Group>
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Vertical</div>
          <div className="builder-field-row__input">
            <Group gap={10} justify="space-between" wrap="nowrap">
              {(
                [
                  { value: 'top', icon: IconLayoutAlignTop, label: 'Top', rotate: false },
                  { value: 'center', icon: IconLayoutAlignMiddle, label: 'Center', rotate: false },
                  { value: 'bottom', icon: IconLayoutAlignBottom, label: 'Bottom', rotate: false },
                  {
                    value: 'space-between',
                    icon: IconLayoutDistributeVertical,
                    label: 'Space Between',
                    rotate: true,
                  },
                ] as const
              ).map(({ value, icon: Icon, label, rotate }) => (
                <ActionIcon
                  key={value}
                  variant={(settings.header_justify || 'center') === value ? 'filled' : 'default'}
                  size="lg"
                  onClick={() =>
                    handleSettingChange('header_justify', value as LinkPageHeaderJustify)
                  }
                  title={label}
                >
                  <Icon size={18} style={rotate ? { transform: 'rotate(90deg)' } : undefined} />
                </ActionIcon>
              ))}
            </Group>
          </div>
        </div>
        <div className="builder-field-row">
          <div className="builder-field-row__label">Gap</div>
          <div className="builder-field-row__input">
            <Select
              aria-label="Gap"
              size="sm"
              value={settings.header_gap || 'lg'}
              onChange={(value) => handleSettingChange('header_gap', value as LinkPageHeaderGap)}
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
              value={settings.header_height || 'auto'}
              onChange={(value) =>
                handleSettingChange('header_height', value as LinkPageHeaderHeight)
              }
              data={[
                { value: 'auto', label: 'Auto' },
                { value: 'fullscreen', label: 'Fullscreen' },
              ]}
            />
          </div>
        </div>
      </Stack>

      <Divider />

      {/* Background */}
      <Box>
        <Group gap={4} mb="xs">
          <Text className="builder-field-label" c="var(--gs-text-muted)">
            Background
          </Text>
          <Tooltip label="Customize the background of the header" withArrow position="top">
            <IconInfoCircle
              size={14}
              style={{ color: 'var(--gs-text-extra-muted)', cursor: 'help' }}
            />
          </Tooltip>
        </Group>
        {settings.background_image_url ? (
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
                  onClick={() => handleSettingChange('background_image_url', undefined)}
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
                checked={settings.background_overlay !== false}
                onChange={(e) => handleSettingChange('background_overlay', e.target.checked)}
              />
            </Group>
            {settings.background_overlay !== false && (
              <div className="builder-field-row">
                <div className="builder-field-row__label">Overlay Opacity</div>
                <div className="builder-field-row__input">
                  <NumberInput
                    aria-label="Overlay Opacity"
                    size="sm"
                    value={settings.background_overlay_opacity ?? 85}
                    onChange={(value) =>
                      handleSettingChange(
                        'background_overlay_opacity',
                        value === '' ? undefined : Number(value)
                      )
                    }
                    onKeyDownCapture={(e) =>
                      handleNumberInputKeyDown(
                        e,
                        settings.background_overlay_opacity ?? 85,
                        (v) => handleSettingChange('background_overlay_opacity', v),
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

      <Divider />

      {/* Link Layout */}
      <div className="builder-field-row">
        <div className="builder-field-row__label">Link Layout</div>
        <div className="builder-field-row__input">
          <SegmentedControl
            fullWidth
            value={settings.layout || 'list'}
            onChange={(value) => handleSettingChange('layout', value as 'list' | 'grid')}
            data={[
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
            ]}
          />
        </div>
      </div>

      <Divider />

      {/* Link Card Styles */}
      <div>
        <Group justify="space-between" align="center" mb="xs">
          <div className="builder-section-subheading">
            <span className="builder-section-subheading__title">Link Card Styles</span>
          </div>
          {(settings.link_bg_color ||
            settings.link_font_color ||
            settings.link_font_size ||
            settings.link_font_family ||
            settings.link_border_width ||
            settings.link_border_color ||
            (settings.link_border_style !== undefined && settings.link_border_style !== 'solid') ||
            settings.link_hover_bg_color ||
            settings.link_hover_font_color) && (
            <Button
              variant="subtle"
              size="compact-xs"
              color="gray"
              onClick={() => {
                updatePageSettings('links', {
                  link_bg_color: undefined,
                  link_font_color: undefined,
                  link_font_size: undefined,
                  link_border_width: undefined,
                  link_border_color: undefined,
                  link_border_style: undefined,
                  link_hover_bg_color: undefined,
                  link_hover_font_color: undefined,
                  link_font_family: undefined,
                });
              }}
            >
              Reset all
            </Button>
          )}
        </Group>
        <Stack gap={12}>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Background</div>
            <div className="builder-field-row__input">
              <ColorInput
                size="sm"
                format="hex"
                placeholder="Inherit"
                value={settings.link_bg_color || ''}
                onChange={(value) => handleSettingChange('link_bg_color', value || undefined)}
                swatches={['#ffffff', '#000000', '#1a1a1a', '#f5f5f5']}
                aria-label="Background"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Font Color</div>
            <div className="builder-field-row__input">
              <ColorInput
                size="sm"
                format="hex"
                placeholder="Inherit"
                value={settings.link_font_color || ''}
                onChange={(value) => handleSettingChange('link_font_color', value || undefined)}
                swatches={['#ffffff', '#000000', '#1a1a1a', '#f5f5f5']}
                aria-label="Font Color"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Font Size</div>
            <div className="builder-field-row__input">
              <NumberInput
                size="sm"
                placeholder="Default"
                value={settings.link_font_size || ''}
                onChange={(value) =>
                  handleSettingChange('link_font_size', value === '' ? undefined : Number(value))
                }
                min={10}
                max={24}
                suffix="px"
                aria-label="Font Size"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Font Family</div>
            <div className="builder-field-row__input">
              <Select
                size="sm"
                placeholder="Inherit from theme"
                data={LINK_FONT_OPTIONS}
                value={settings.link_font_family || null}
                onChange={(value) => handleSettingChange('link_font_family', value || undefined)}
                renderOption={renderFontOption}
                clearable
                searchable
                styles={
                  settings.link_font_family
                    ? { input: { fontFamily: `"${settings.link_font_family}", sans-serif` } }
                    : undefined
                }
                aria-label="Font Family"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Border Width</div>
            <div className="builder-field-row__input">
              <NumberInput
                size="sm"
                value={settings.link_border_width ?? ''}
                onChange={(value) =>
                  handleSettingChange('link_border_width', value === '' ? undefined : Number(value))
                }
                min={0}
                max={6}
                suffix="px"
                placeholder="None"
                aria-label="Border Width"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Border Style</div>
            <div className="builder-field-row__input">
              <Select
                aria-label="Border Style"
                size="sm"
                value={settings.link_border_style || 'solid'}
                onChange={(value) =>
                  handleSettingChange(
                    'link_border_style',
                    (value || 'solid') as 'solid' | 'dashed' | 'dotted'
                  )
                }
                data={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'dashed', label: 'Dashed' },
                  { value: 'dotted', label: 'Dotted' },
                ]}
              />
            </div>
          </div>
          {(settings.link_border_width ?? 0) > 0 && (
            <div className="builder-field-row">
              <div className="builder-field-row__label">Border Color</div>
              <div className="builder-field-row__input">
                <ColorInput
                  size="sm"
                  format="hex"
                  placeholder="Inherit from brand"
                  value={settings.link_border_color || ''}
                  onChange={(value) => handleSettingChange('link_border_color', value || undefined)}
                  swatches={['#ffffff', '#000000', '#1a1a1a', '#f5f5f5']}
                  aria-label="Border Color"
                />
              </div>
            </div>
          )}
          <Text className="builder-field-label" c="var(--gs-text-muted)" mt={4}>
            Hover Styles
          </Text>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Hover Background</div>
            <div className="builder-field-row__input">
              <ColorInput
                size="sm"
                format="hex"
                placeholder="None"
                value={settings.link_hover_bg_color || ''}
                onChange={(value) => handleSettingChange('link_hover_bg_color', value || undefined)}
                swatches={['#ffffff', '#000000', '#1a1a1a', '#f5f5f5']}
                aria-label="Hover Background"
              />
            </div>
          </div>
          <div className="builder-field-row">
            <div className="builder-field-row__label">Hover Font Color</div>
            <div className="builder-field-row__input">
              <ColorInput
                size="sm"
                format="hex"
                placeholder="None"
                value={settings.link_hover_font_color || ''}
                onChange={(value) =>
                  handleSettingChange('link_hover_font_color', value || undefined)
                }
                swatches={['#ffffff', '#000000', '#1a1a1a', '#f5f5f5']}
                aria-label="Hover Font Color"
              />
            </div>
          </div>
        </Stack>
      </div>

      <Divider />

      {/* Custom Links */}
      <div>
        <Group justify="space-between" align="center" mb="sm">
          <div className="builder-section-subheading">
            <span className="builder-section-subheading__title">Custom Links</span>
          </div>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => {
              setEditingLink(null);
              setModalOpened(true);
            }}
          >
            Add Link
          </Button>
        </Group>

        {sortedLinks.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No custom links yet. Add your first link above.
          </Text>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleLinkDragStart}
            onDragEnd={handleLinkDragEnd}
            onDragCancel={() => setActiveLinkId(null)}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={sortedLinks.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap={6}>
                {sortedLinks.map((link) => (
                  <SortableLinkItem
                    key={link.id}
                    link={link}
                    onEdit={(l) => {
                      setEditingLink(l);
                      setModalOpened(true);
                    }}
                    onDelete={handleDeleteLink}
                    onToggleVisibility={handleToggleLinkVisibility}
                  />
                ))}
              </Stack>
            </SortableContext>
            <DragOverlay>{activeLink ? <LinkItemOverlay link={activeLink} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      <LinkFormModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingLink(null);
        }}
        onSubmit={editingLink ? handleEditLink : handleAddLink}
        initialValues={
          editingLink
            ? { title: editingLink.title, url: editingLink.url, icon: editingLink.icon || 'link' }
            : undefined
        }
        existingThumbnailUrl={editingLink?.thumbnail_url}
        isEditing={!!editingLink}
      />

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
    </Stack>
  );
}
