'use client';

import { useRouter } from 'next/navigation';
import { IconDeviceFloppy, IconUpload, IconTrash, IconArrowLeft, IconPlus } from '@tabler/icons-react';
import { ActionIcon, Button, Group, Text, Badge, Stack, Tooltip, Menu, SegmentedControl } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useBuilderStore } from '@/lib/site-builder/store';
import { SectionType } from '@/lib/site-builder/types';
import { SECTION_LABELS } from '@/lib/site-builder/constants';
import { updateProfileTheme, publishProfileTheme, discardProfileThemeDraft } from '@/lib/site-builder/api';
import { ThemeControls } from './ThemeControls';
import { SectionList } from './SectionList';
import { SinglePostEditor } from './SinglePostEditor';
import { HiddenSectionsBanner, usePlanGating } from './PlanGating';

// All available section types
const ALL_SECTION_TYPES: SectionType[] = [
  'hero', 'music', 'events', 'posts', 'about',
  'recommendations', 'mailing_list', 'merch', 'custom_text',
];

// Section types that can only appear once
const UNIQUE_SECTIONS: SectionType[] = [
  'hero', 'music', 'events', 'posts', 'about',
  'recommendations', 'mailing_list', 'merch',
];

// Section types not yet available
const COMING_SOON_SECTIONS: SectionType[] = ['mailing_list', 'merch'];

export function EditorPanel() {
  const router = useRouter();
  const { getHiddenSections } = usePlanGating();
  const hiddenSections = getHiddenSections();
  const {
    theme,
    sections,
    singlePostLayout,
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
      addSection(type);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileTheme({
        ...theme,
        sections,
        single_post_layout: singlePostLayout,
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
        {/* Global Theme Section (always visible) */}
        <div className="builder-editor__section">
          <div className="builder-editor__section-title">Theme</div>
          <ThemeControls />
        </div>

        {/* Page Tabs */}
        <div className="builder-editor__section" style={{ paddingBottom: 0 }}>
          <SegmentedControl
            fullWidth
            value={activePage}
            onChange={(value) => setActivePage(value as 'main' | 'posts')}
            data={[
              { value: 'main', label: 'Main Page' },
              { value: 'posts', label: 'Posts' },
            ]}
          />
        </div>

        {activePage === 'main' ? (
          <>
            {/* Hidden sections warning */}
            <HiddenSectionsBanner hiddenSections={hiddenSections} requiredPlan="band_pro" />

            {/* Sections List */}
            <div className="builder-editor__section">
              <Group justify="space-between" align="center" mb="sm">
                <div className="builder-editor__section-title" style={{ marginBottom: 0 }}>Sections</div>
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="light" size="sm">
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
                            {status.reason === 'exists' && (
                              <Text size="xs" c="dimmed">Added</Text>
                            )}
                            {status.reason === 'limit' && (
                              <Text size="xs" c="dimmed">Max</Text>
                            )}
                            {status.reason === 'upgrade' && (
                              <Text size="xs" c="dimmed">Upgrade</Text>
                            )}
                            {status.reason === 'coming_soon' && (
                              <Text size="xs" c="dimmed">Soon</Text>
                            )}
                          </Group>
                        </Menu.Item>
                      );
                    })}
                  </Menu.Dropdown>
                </Menu>
              </Group>
              <SectionList />
            </div>
          </>
        ) : (
          <div className="builder-editor__section">
            <div className="builder-editor__section-title">Post Layout</div>
            <SinglePostEditor />
          </div>
        )}
      </div>
    </div>
  );
}
