'use client';

import { useState } from 'react';
import {
  IconCalendarEvent,
  IconChevronDown,
  IconDeviceFloppy,
  IconMusic,
  IconPhoto,
  IconSend,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  FileButton,
  Flex,
  Group,
  Image,
  Menu,
  Paper,
  Stack,
  Switch,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { SongPickerModal } from '@/components/SongPicker';
import { usePostEditorContext } from './PostEditorContext';

export function PostEditorAside() {
  const {
    state,
    setSlug,
    setExcerpt,
    setFeatured,
    setPublishDate,
    setTags,
    setCategories,
    setAuthors,
    handleImageSelect,
    handleRemoveImage,
    handleSave,
    handleDelete,
    setAttachedSong,
  } = usePostEditorContext();

  const [showScheduleUI, setShowScheduleUI] = useState(false);
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const imagePreviewSrc = state.featuredImagePreview || state.featuredImageUrl;
  const isPublished = state.status === 'published';
  const isScheduled = state.status === 'scheduled';

  const handlePublishNow = () => {
    setShowScheduleUI(false);
    handleSave('published');
  };

  const handleSchedulePost = () => {
    setShowScheduleUI(true);
  };

  const handleConfirmSchedule = () => {
    setShowScheduleUI(false);
    handleSave('scheduled');
  };

  const handleUpdateSchedule = () => {
    handleSave('scheduled');
  };

  const handleRevertToDraft = () => {
    setShowScheduleUI(false);
    handleSave('draft');
  };

  const handleUpdatePost = () => {
    // Save with current status - keeps publish date intact
    handleSave('published');
  };

  return (
    <Stack gap="md">
      {/* Action Buttons */}
      <Stack gap="md">
        {isPublished ? (
          <>
            {/* Published state */}
            <Flex justify="space-between" align="center">
              <Text size="sm" fw={500}>
                Status
              </Text>
              <Badge color="green" size="lg" variant="light">
                Published
              </Badge>
            </Flex>

            <Button
              color="grape"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleUpdatePost}
              loading={state.saving}
              fullWidth
            >
              Update Post
            </Button>

            <Button
              variant="light"
              color="gray"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleRevertToDraft}
              loading={state.saving}
              fullWidth
            >
              Revert to Draft
            </Button>

            {state.postId && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
                loading={state.deleting}
                fullWidth
              >
                Delete Post
              </Button>
            )}
          </>
        ) : isScheduled ? (
          <>
            {/* Scheduled state */}
            <Flex justify="space-between" align="center">
              <Text size="sm" fw={500}>
                Status
              </Text>
              <Badge color="blue" size="lg" variant="light">
                Scheduled
              </Badge>
            </Flex>

            <DateTimePicker
              label="Scheduled For"
              value={state.publishDate}
              onChange={(value) => setPublishDate(value ? new Date(value) : null)}
              minDate={new Date()}
              placeholder="Select date and time"
            />

            <Button
              color="grape"
              leftSection={<IconCalendarEvent size={16} />}
              onClick={handleUpdateSchedule}
              loading={state.saving}
              fullWidth
              disabled={!state.publishDate}
            >
              Update Schedule
            </Button>

            <Button
              variant="light"
              color="gray"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleRevertToDraft}
              loading={state.saving}
              fullWidth
            >
              Revert to Draft
            </Button>

            {state.postId && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
                loading={state.deleting}
                fullWidth
              >
                Delete
              </Button>
            )}
          </>
        ) : showScheduleUI ? (
          <>
            {/* Schedule UI - setting up a new schedule */}
            <DateTimePicker
              label="Publish Date"
              value={state.publishDate}
              onChange={(value) => setPublishDate(value ? new Date(value) : null)}
              minDate={new Date()}
              placeholder="Select date and time"
            />

            <Button
              color="grape"
              leftSection={<IconCalendarEvent size={16} />}
              onClick={handleConfirmSchedule}
              loading={state.saving}
              fullWidth
              disabled={!state.publishDate}
            >
              Schedule
            </Button>

            <Button variant="light" color="gray" onClick={() => setShowScheduleUI(false)} fullWidth>
              Cancel
            </Button>
          </>
        ) : (
          <>
            {/* Draft state - Publish dropdown */}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button
                  color="grape"
                  rightSection={<IconChevronDown size={16} />}
                  loading={state.saving}
                  fullWidth
                >
                  Publish
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item leftSection={<IconSend size={16} />} onClick={handlePublishNow}>
                  Publish Now
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCalendarEvent size={16} />}
                  onClick={handleSchedulePost}
                >
                  Schedule Post
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button
              variant="light"
              color="grape"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => handleSave('draft')}
              loading={state.saving}
              fullWidth
            >
              Save Draft
            </Button>

            {state.postId && (
              <Button
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={handleDelete}
                loading={state.deleting}
                fullWidth
              >
                Delete
              </Button>
            )}
          </>
        )}
      </Stack>

      <Title order={5}>Post Settings</Title>

      <TextInput
        label="Slug"
        placeholder="auto-generated-from-title"
        value={state.slug}
        onChange={(e) => setSlug(e.target.value)}
        description="URL-friendly version of the title"
      />

      <Textarea
        label="Excerpt"
        placeholder="Brief summary for previews..."
        value={state.excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        minRows={3}
      />

      <Switch
        label="Featured post"
        checked={state.featured}
        onChange={(e) => setFeatured(e.currentTarget.checked)}
      />

      {/* Featured Image */}
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Featured Image
        </Text>
        {imagePreviewSrc ? (
          <Box pos="relative">
            <Image
              src={imagePreviewSrc}
              alt="Featured image preview"
              radius="md"
              h={150}
              fit="cover"
            />
            <ActionIcon
              variant="filled"
              color="red"
              size="sm"
              pos="absolute"
              top={8}
              right={8}
              onClick={handleRemoveImage}
            >
              <IconX size={14} />
            </ActionIcon>
          </Box>
        ) : (
          <FileButton onChange={handleImageSelect} accept="image/*">
            {(props) => (
              <Button
                {...props}
                variant="light"
                color="gray"
                fullWidth
                leftSection={<IconPhoto size={16} />}
              >
                Upload Image
              </Button>
            )}
          </FileButton>
        )}
      </Box>

      {/* Attached Song */}
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Attached Song
        </Text>
        {state.attachedSong ? (
          <Paper p="sm" radius="md" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                {state.attachedSong.artwork_url ? (
                  <Image
                    src={state.attachedSong.artwork_url}
                    w={48}
                    h={48}
                    radius="sm"
                    fit="cover"
                  />
                ) : (
                  <Center
                    w={48}
                    h={48}
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      backgroundColor: 'var(--gs-bg-accent)',
                    }}
                  >
                    <IconMusic size={24} color="var(--gs-text-muted)" />
                  </Center>
                )}
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {state.attachedSong.song_name}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {state.attachedSong.band_name}
                  </Text>
                </Stack>
              </Group>
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => setAttachedSong(null)}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Paper>
        ) : (
          <Button
            variant="light"
            color="gray"
            fullWidth
            leftSection={<IconMusic size={16} />}
            onClick={() => setSongPickerOpen(true)}
          >
            Attach Song
          </Button>
        )}
      </Box>

      <SongPickerModal
        opened={songPickerOpen}
        onClose={() => setSongPickerOpen(false)}
        onSelect={(song) => {
          setAttachedSong(song);
          setSongPickerOpen(false);
        }}
        initialSong={state.attachedSong}
      />

      <TagsInput label="Tags" placeholder="Add tags..." value={state.tags} onChange={setTags} />

      <TagsInput
        label="Categories"
        placeholder="Add categories..."
        value={state.categories}
        onChange={setCategories}
      />

      <TagsInput
        label="Authors"
        placeholder="Add authors..."
        description="Leave empty to use your name"
        value={state.authors.map((a) => a.name)}
        onChange={(names) => setAuthors(names.map((name) => ({ name })))}
      />
    </Stack>
  );
}
