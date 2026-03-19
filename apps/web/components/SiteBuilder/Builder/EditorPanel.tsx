'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IconDeviceFloppy, IconUpload, IconTrash, IconArrowLeft, IconPlus, IconSun, IconMoon, IconChevronDown, IconCheck } from '@tabler/icons-react';
import { ActionIcon, Button, Collapse, Group, Text, Badge, Stack, Tooltip, Menu, useMantineColorScheme } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useBuilderStore } from '@/lib/site-builder/store';
import { SectionType } from '@/lib/site-builder/types';
import { SECTION_LABELS } from '@/lib/site-builder/constants';
import { updateProfileTheme, publishProfileTheme, discardProfileThemeDraft } from '@/lib/site-builder/api';
import { ThemeControls } from './ThemeControls';
import { SectionList } from './SectionList';
import { SinglePostEditor } from './SinglePostEditor';
import { LinksEditor } from './LinksEditor';
import { HiddenSectionsBanner, usePlanGating } from './PlanGating';

// All available section types
const ALL_SECTION_TYPES: SectionType[] = [
  'hero', 'music', 'events', 'posts', 'about',
  'recommendations', 'mailing_list', 'merch', 'custom_text',
];

const PAGE_OPTIONS = [
  { value: 'main', label: 'Main Page' },
  { value: 'posts', label: 'Posts' },
  { value: 'events', label: 'Events' },
  { value: 'links', label: 'Links' },
] as const;

// Section types that can only appear once
const UNIQUE_SECTIONS: SectionType[] = [
  'hero', 'music', 'events', 'posts', 'about',
  'recommendations', 'mailing_list', 'merch',
];

// Section types not yet available
const COMING_SOON_SECTIONS: SectionType[] = ['mailing_list', 'merch'];

export function EditorPanel() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const justAddedRef = useRef(false);
  const { getHiddenSections } = usePlanGating();
  const hiddenSections = getHiddenSections();
  const {
    theme,
    sections,
    singlePostLayout,
    pages,
    activePage,
    setActivePage,
    config,
    hasUnsavedChanges,
    isSaving,
    isPublishing,
    isDiscarding,
    setSaving,
    setPublishing,
    setDiscarding,
    markAsSaved,
    restoreFromSaved,
    setError,
    addSection,
  } = useBuilderStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add section logic
  const existingSectionTypes = sections.map((s) => s.type);
  const customTextCount = sections.filter((s) => s.type === 'custom_text').length;
  const maxCustomText = config?.max_custom_text || 3;
  const availableSectionTypes = config?.section_types || ALL_SECTION_TYPES;

  const getAddSectionStatus = (type: SectionType) => {
    if (COMING_SOON_SECTIONS.includes(type)) {
      return { canAdd: false, reason: 'coming_soon' };
    }
    if (!availableSectionTypes.includes(type)) {
      return { canAdd: false, reason: 'upgrade' };
    }
    if (UNIQUE_SECTIONS.includes(type) && existingSectionTypes.includes(type)) {
      return { canAdd: false, reason: 'exists' };
    }
    if (type === 'custom_text' && customTextCount >= maxCustomText) {
      return { canAdd: false, reason: 'limit' };
    }
    return { canAdd: true, reason: null };
  };

  const handleAddSection = (type: SectionType) => {
    const status = getAddSectionStatus(type);
    if (status.canAdd) {
      justAddedRef.current = true;
      addSection(type);
      setCollapsedSections((prev) => ({ ...prev, sections: false }));
      // Reset the guard after the menu-close events finish
      setTimeout(() => { justAddedRef.current = false; }, 300);
    }
  };

  const toggleCollapse = useCallback((section: string) => {
    if (justAddedRef.current) return;
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileTheme({
        ...theme,
        sections,
        single_post_layout: singlePostLayout,
        pages,
      });
      markAsSaved();
      notifications.show({
        title: 'Draft saved',
        message: 'Your changes have been saved as a draft.',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Save failed',
        message: 'Could not save your changes. Please try again.',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Save first if there are unsaved changes
      if (hasUnsavedChanges) {
        await updateProfileTheme({
          ...theme,
          sections,
          single_post_layout: singlePostLayout,
          pages,
        });
      }
      await publishProfileTheme();
      markAsSaved();
      notifications.show({
        title: 'Published!',
        message: 'Your profile is now live.',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Publish failed',
        message: 'Could not publish your changes. Please try again.',
        color: 'red',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscard = () => {
    modals.openConfirmModal({
      title: 'Discard changes?',
      children: (
        <Text size="sm">
          This will discard all unpublished changes and restore your last published version.
        </Text>
      ),
      labels: { confirm: 'Discard', cancel: 'Keep editing' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        setDiscarding(true);
        try {
          await discardProfileThemeDraft();
          restoreFromSaved();
          notifications.show({
            title: 'Changes discarded',
            message: 'Your draft has been discarded.',
            color: 'blue',
          });
        } catch (error) {
          notifications.show({
            title: 'Discard failed',
            message: 'Could not discard changes. Please try again.',
            color: 'red',
          });
        } finally {
          setDiscarding(false);
        }
      },
    });
  };

  return (
    <div className="builder-editor">
      {/* Top Bar */}
      <div className="builder-editor__topbar">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <ActionIcon variant="subtle" color="gray" onClick={() => router.back()}>
                <IconArrowLeft size={18} />
              </ActionIcon>
              <Text fw={600}>Site Builder</Text>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => toggleColorScheme()}
                aria-label="Toggle color scheme"
              >
                {mounted ? (
                  colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />
                ) : (
                  <IconMoon size={16} />
                )}
              </ActionIcon>
              {hasUnsavedChanges && (
                <Badge size="xs" color="orange" variant="dot">
                  Unsaved
                </Badge>
              )}
            </Group>
          </Group>

          <Group gap="xs">
            <Tooltip label="Save as draft">
              <Button
                variant="default"
                size="xs"
                leftSection={<IconDeviceFloppy size={14} />}
                loading={isSaving}
                disabled={!hasUnsavedChanges || isPublishing || isDiscarding}
                onClick={handleSave}
              >
                Save Draft
              </Button>
            </Tooltip>

            <Button
              size="xs"
              leftSection={<IconUpload size={14} />}
              loading={isPublishing}
              disabled={isDiscarding}
              onClick={handlePublish}
            >
              Publish
            </Button>

            {hasUnsavedChanges && (
              <Button
                variant="subtle"
                size="xs"
                color="red"
                leftSection={<IconTrash size={14} />}
                loading={isDiscarding}
                disabled={isSaving || isPublishing}
                onClick={handleDiscard}
              >
                Discard
              </Button>
            )}
          </Group>
        </Stack>
      </div>

      {/* Editor Content */}
      <div className="builder-editor__content">
        {/* THEME Section */}
        <div
          className="builder-section-header"
          onClick={() => toggleCollapse('theme')}
        >
          <span className="builder-section-header__title">Theme</span>
          <ActionIcon variant="subtle" size="xs" color="gray">
            <IconChevronDown
              size={16}
              style={{
                transform: collapsedSections.theme ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </ActionIcon>
        </div>
        <Collapse in={!collapsedSections.theme}>
          <div className="builder-section-content">
            <ThemeControls />
          </div>
        </Collapse>

        {/* PAGES Section */}
        <div
          className="builder-section-header"
          onClick={() => toggleCollapse('pages')}
        >
          <span className="builder-section-header__title">Pages</span>
          <ActionIcon variant="subtle" size="xs" color="gray">
            <IconChevronDown
              size={16}
              style={{
                transform: collapsedSections.pages ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </ActionIcon>
        </div>
        <Collapse in={!collapsedSections.pages}>
          <div className="builder-page-list">
            {PAGE_OPTIONS.map((page) => (
              <div
                key={page.value}
                className={`builder-page-item ${activePage === page.value ? 'builder-page-item--active' : ''}`}
                onClick={() => setActivePage(page.value as 'main' | 'posts' | 'events' | 'links')}
              >
                <span>{page.label}</span>
                {activePage === page.value && <IconCheck size={16} />}
              </div>
            ))}
          </div>
        </Collapse>

        {/* SECTIONS / Page-specific content */}
        <div
          className="builder-section-header"
          onClick={() => toggleCollapse('sections')}
        >
          <span className="builder-section-header__title">
            {activePage === 'main' ? 'Sections' : activePage === 'posts' ? 'Post Layout' : activePage === 'events' ? 'Event Page' : 'Link Page'}
          </span>
          <div className="builder-section-header__actions">
            {activePage === 'main' && (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    color="gray"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <IconPlus size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {ALL_SECTION_TYPES.map((type) => {
                    const status = getAddSectionStatus(type);
                    const label = SECTION_LABELS[type];
                    return (
                      <Menu.Item
                        key={type}
                        disabled={!status.canAdd}
                        onClick={() => handleAddSection(type)}
                      >
                        <Group justify="space-between" w="100%">
                          <Text size="sm" c={status.canAdd ? undefined : 'dimmed'}>{label}</Text>
                          {status.reason === 'exists' && <Text size="xs" c="dimmed">Added</Text>}
                          {status.reason === 'limit' && <Text size="xs" c="dimmed">Max</Text>}
                          {status.reason === 'upgrade' && <Text size="xs" c="dimmed">Upgrade</Text>}
                          {status.reason === 'coming_soon' && <Text size="xs" c="dimmed">Soon</Text>}
                        </Group>
                      </Menu.Item>
                    );
                  })}
                </Menu.Dropdown>
              </Menu>
            )}
            <ActionIcon variant="subtle" size="xs" color="gray">
              <IconChevronDown
                size={16}
                style={{
                  transform: collapsedSections.sections ? 'rotate(-90deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            </ActionIcon>
          </div>
        </div>
        <Collapse in={!collapsedSections.sections}>
          {activePage === 'links' ? (
            <div className="builder-section-content">
              <LinksEditor />
            </div>
          ) : activePage === 'events' ? (
            <div className="builder-section-content">
              <Text size="sm" c="dimmed">
                This preview shows how your individual event pages will look with your current theme. Event pages automatically use your theme colors, fonts, and card styles.
              </Text>
            </div>
          ) : activePage === 'main' ? (
            <>
              <HiddenSectionsBanner hiddenSections={hiddenSections} requiredPlan="band_pro" />
              <SectionList />
            </>
          ) : (
            <div className="builder-section-content">
              <SinglePostEditor />
            </div>
          )}
        </Collapse>
      </div>
    </div>
  );
}
