'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { IconPhoto } from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Box, Center, Flex, Loader, ScrollArea, Stack, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, RichTextEditor, useRichTextEditorContext } from '@mantine/tiptap';
import { apiClient } from '@/lib/api';
import { usePostEditorContext } from './PostEditorContext';

interface PostEditorProps {
  postId?: number;
}

// Custom Image Upload Control
function ImageUploadControl() {
  const { editor } = useRichTextEditorContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) {return;}

      // Validate file type
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file (JPEG, PNG, WebP, or GIF)',
          color: 'red',
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'File too large',
          message: 'Please select an image smaller than 5MB',
          color: 'red',
        });
        return;
      }

      setIsUploading(true);

      try {
        const response = await apiClient.uploadBlogImage(file);

        // Insert the image at current cursor position
        editor.chain().focus().setImage({ src: response.url, alt: file.name }).run();

        notifications.show({
          title: 'Image uploaded',
          message: 'Image has been added to your post',
          color: 'green',
        });
      } catch (error) {
        console.error('Failed to upload image:', error);
        notifications.show({
          title: 'Upload failed',
          message: error instanceof Error ? error.message : 'Failed to upload image',
          color: 'red',
        });
      } finally {
        setIsUploading(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [editor]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Tooltip label={isUploading ? 'Uploading...' : 'Insert image'}>
        <RichTextEditor.Control
          onClick={handleClick}
          aria-label="Insert image"
          disabled={isUploading}
        >
          {isUploading ? <Loader size={16} /> : <IconPhoto size={16} stroke={1.5} />}
        </RichTextEditor.Control>
      </Tooltip>
    </>
  );
}

export function PostEditor({ postId: propPostId }: PostEditorProps) {
  const searchParams = useSearchParams();
  const postId =
    propPostId || (searchParams.get('id') ? Number(searchParams.get('id')) : undefined);

  const {
    state,
    setEditor,
    setTitle,
    setSlug,
    setExcerpt,
    setStatus,
    setFeatured,
    setPublishDate,
    setTags,
    setCategories,
    setAuthors,
    setLoading,
    setPostId,
    setFeaturedImageUrl,
    resetEditor,
    setAttachedSong,
  } = usePostEditorContext();

  // Track the 'new' param to reset editor when creating a new post
  const newPostKey = searchParams.get('new');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Underline,
      Link,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your post...' }),
      Image.configure({
        HTMLAttributes: {
          class: 'post-image',
        },
        allowBase64: false,
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        // Handle image drag and drop
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            // Upload and insert at drop position
            if (file.size > 5 * 1024 * 1024) {
              notifications.show({
                title: 'File too large',
                message: 'Please drop an image smaller than 5MB',
                color: 'red',
              });
              return true;
            }

            apiClient.uploadBlogImage(file)
              .then((response) => {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src: response.url, alt: file.name });
                if (coordinates) {
                  const transaction = view.state.tr.insert(coordinates.pos, node);
                  view.dispatch(transaction);
                }
                notifications.show({
                  title: 'Image uploaded',
                  message: 'Image has been added to your post',
                  color: 'green',
                });
              })
              .catch((error) => {
                notifications.show({
                  title: 'Upload failed',
                  message: error instanceof Error ? error.message : 'Failed to upload image',
                  color: 'red',
                });
              });

            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Handle image paste
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) {continue;}

              if (file.size > 5 * 1024 * 1024) {
                notifications.show({
                  title: 'File too large',
                  message: 'Please paste an image smaller than 5MB',
                  color: 'red',
                });
                return true;
              }

              apiClient.uploadBlogImage(file)
                .then((response) => {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: response.url, alt: 'Pasted image' });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                  notifications.show({
                    title: 'Image uploaded',
                    message: 'Image has been added to your post',
                    color: 'green',
                  });
                })
                .catch((error) => {
                  notifications.show({
                    title: 'Upload failed',
                    message: error instanceof Error ? error.message : 'Failed to upload image',
                    color: 'red',
                  });
                });

              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Store editor in context
  useEffect(() => {
    setEditor(editor);
  }, [editor, setEditor]);

  // Reset editor when starting a new post (new param changes)
  useEffect(() => {
    if (newPostKey && !postId) {
      resetEditor();
    }
  }, [newPostKey, postId, resetEditor]);

  // Set postId in context
  useEffect(() => {
    if (postId !== state.postId) {
      setPostId(postId);
      if (postId) {
        setLoading(true);
      }
    }
  }, [postId, state.postId, setPostId, setLoading]);

  // Load post if editing
  const fetchPost = useCallback(async () => {
    if (!postId) {return;}

    try {
      const response = await apiClient.getPost(postId);
      // Handle both { post: ... } wrapper and direct post response
      const post = response.post || response;

      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || '');
      setStatus(post.status);
      setFeatured(post.featured);
      setPublishDate(post.publish_date ? new Date(post.publish_date) : null);
      setTags(post.tags || []);
      setCategories(post.categories || []);
      setAuthors(post.authors || []);
      setFeaturedImageUrl(post.featured_image_url || null);

      // Load attached song if present (handle both nested and flat formats)
      if (post.song) {
        setAttachedSong({
          song_name: post.song.song_name,
          band_name: post.song.band_name || '',
          album_name: post.song.album_name,
          artwork_url: post.song.artwork_url,
          song_link: post.song.song_link,
        });
      } else if (post.song_name) {
        setAttachedSong({
          song_name: post.song_name,
          band_name: post.band_name || '',
          album_name: post.album_name,
          artwork_url: post.song_artwork_url,
          song_link: post.song_link,
        });
      }

      if (editor && post.body) {
        editor.commands.setContent(post.body);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load post.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [
    postId,
    editor,
    setTitle,
    setSlug,
    setExcerpt,
    setStatus,
    setFeatured,
    setPublishDate,
    setTags,
    setCategories,
    setAuthors,
    setFeaturedImageUrl,
    setLoading,
    setAttachedSong,
  ]);

  useEffect(() => {
    if (postId && editor) {
      fetchPost();
    }
  }, [postId, editor, fetchPost]);

  if (state.loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack flex={1} gap={0} h="100%">
      <Flex px="md" direction="column">
        {/* Title */}
        <TextInput
          placeholder="Post title"
          value={state.title}
          onChange={(e) => setTitle(e.target.value)}
          size="xl"
          styles={{
            input: {
              fontSize: '1.5rem',
              fontWeight: 600,
              border: 'none',
              backgroundColor: 'transparent',
              padding: 0,
            },
          }}
        />
      </Flex>

      {/* Rich Text Editor */}
      <Box
        flex={1}
        style={{
          overflow: 'hidden',
          minHeight: 300,
        }}
      >
        {editor ? (
          <RichTextEditor
            editor={editor}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            variant="subtle"
          >
            <RichTextEditor.Toolbar sticky stickyOffset={0}>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Underline />
                <RichTextEditor.Strikethrough />
                <RichTextEditor.Highlight />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H1 />
                <RichTextEditor.H2 />
                <RichTextEditor.H3 />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.AlignLeft />
                <RichTextEditor.AlignCenter />
                <RichTextEditor.AlignRight />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Link />
                <RichTextEditor.Unlink />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <ImageUploadControl />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Blockquote />
                <RichTextEditor.Hr />
              </RichTextEditor.ControlsGroup>

              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Undo />
                <RichTextEditor.Redo />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>

            <ScrollArea flex={1}>
              <RichTextEditor.Content />
            </ScrollArea>
          </RichTextEditor>
        ) : (
          <Center h="100%">
            <Loader size="md" />
          </Center>
        )}
      </Box>
    </Stack>
  );
}
