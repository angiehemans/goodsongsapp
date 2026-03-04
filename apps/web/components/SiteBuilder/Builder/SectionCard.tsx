'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconGripVertical,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconChevronUp,
  IconTrash,
} from '@tabler/icons-react';
import { ActionIcon, Collapse, Text, Tooltip, Stack, Divider } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useBuilderStore } from '@/lib/site-builder/store';
import { Section, SectionType } from '@/lib/site-builder/types';
import { SECTION_LABELS } from '@/lib/site-builder/constants';
import {
  HeroEditor,
  MusicEditor,
  EventsEditor,
  PostsEditor,
  AboutEditor,
  RecommendationsEditor,
  MailingListEditor,
  MerchEditor,
  CustomTextEditor,
  AppearanceEditor,
} from './SectionEditors';

interface SectionCardProps {
  id: string;
  section: Section;
  index: number;
}

// Render the appropriate editor based on section type
function SectionEditor({ section, index }: { section: Section; index: number }) {
  // Content type is determined by section.type at runtime
  // We use type assertions since TypeScript can't narrow union types here
  // Default to empty object if content/settings are undefined (API may return null/undefined)
  const content = section.content || {};
  const settings = section.settings || {};
  const data = section.data || {};

  switch (section.type) {
    case 'hero':
      return <HeroEditor index={index} content={content as any} settings={settings as any} />;
    case 'music':
      return <MusicEditor index={index} content={content as any} settings={settings as any} data={data as any} />;
    case 'events':
      return <EventsEditor index={index} content={content as any} settings={settings as any} />;
    case 'posts':
      return <PostsEditor index={index} content={content as any} settings={settings as any} />;
    case 'about':
      return <AboutEditor index={index} content={content as any} settings={settings as any} />;
    case 'recommendations':
      return <RecommendationsEditor index={index} content={content as any} settings={settings as any} />;
    case 'mailing_list':
      return <MailingListEditor index={index} content={content as any} settings={settings as any} />;
    case 'merch':
      return <MerchEditor index={index} content={content as any} settings={settings as any} />;
    case 'custom_text':
      return <CustomTextEditor index={index} content={content as any} settings={settings as any} />;
    default:
      return (
        <Text size="sm" c="dimmed">
          No settings available for this section.
        </Text>
      );
  }
}

export function SectionCard({ id, section, index }: SectionCardProps) {
  const {
    expandedSectionId,
    toggleSection,
    toggleSectionVisibility,
    removeSection,
  } = useBuilderStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isExpanded = expandedSectionId === id;
  const label = SECTION_LABELS[section.type];

  const handleToggleExpand = () => {
    toggleSection(id);
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSectionVisibility(index);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    modals.openConfirmModal({
      title: `Remove ${label}?`,
      children: (
        <Text size="sm">
          This will remove the section from your profile. You can add it back later.
        </Text>
      ),
      labels: { confirm: 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => removeSection(index),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`section-card ${isDragging ? 'section-card--dragging' : ''} ${
        !section.visible ? 'section-card--hidden' : ''
      }`}
    >
      <div className="section-card__header" onClick={handleToggleExpand}>
        <div
          className="section-card__drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <IconGripVertical size={18} />
        </div>

        <span className="section-card__title">{label}</span>

        <div className="section-card__actions">
          <Tooltip label={section.visible ? 'Hide section' : 'Show section'}>
            <ActionIcon
              variant="subtle"
              size="sm"
              color={section.visible ? 'gray' : 'yellow'}
              onClick={handleToggleVisibility}
            >
              {section.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Remove section">
            <ActionIcon
              variant="subtle"
              size="sm"
              color="red"
              onClick={handleRemove}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>

          <ActionIcon variant="subtle" size="sm" color="gray">
            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </div>
      </div>

      <Collapse in={isExpanded}>
        <div className="section-card__content">
          <Stack gap="md">
            {/* Section-specific settings */}
            <SectionEditor section={section} index={index} />

            {/* Appearance settings (only for sections that support it) */}
            {(section.type === 'hero' || section.type === 'custom_text') && (
              <>
                <Divider my="xs" />
                <AppearanceEditor index={index} settings={section.settings} sectionType={section.type} />
              </>
            )}
          </Stack>
        </div>
      </Collapse>
    </div>
  );
}

// Overlay component for drag preview
interface SectionCardOverlayProps {
  section: Section;
  index: number;
}

export function SectionCardOverlay({ section, index }: SectionCardOverlayProps) {
  const label = SECTION_LABELS[section.type];

  return (
    <div className="section-card section-card-overlay">
      <div className="section-card__header">
        <div className="section-card__drag-handle">
          <IconGripVertical size={18} />
        </div>
        <span className="section-card__title">{label}</span>
      </div>
    </div>
  );
}
