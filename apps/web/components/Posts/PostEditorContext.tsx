'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { apiClient, PostAuthorInput, PostStatus } from '@/lib/api';
import { Editor } from '@tiptap/react';

// Attached song type for blog posts
export interface AttachedSong {
  song_name: string;
  band_name: string;
  album_name?: string;
  artwork_url?: string;
  song_link?: string;
}

interface PostEditorState {
  postId?: number;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  title: string;
  slug: string;
  excerpt: string;
  status: PostStatus;
  featured: boolean;
  publishDate: Date | null;
  tags: string[];
  categories: string[];
  authors: PostAuthorInput[];
  featuredImage: File | null;
  featuredImageUrl: string | null;
  featuredImagePreview: string | null;
  attachedSong: AttachedSong | null;
}

interface PostEditorContextValue {
  state: PostEditorState;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  setTitle: (title: string) => void;
  setSlug: (slug: string) => void;
  setExcerpt: (excerpt: string) => void;
  setStatus: (status: PostStatus) => void;
  setFeatured: (featured: boolean) => void;
  setPublishDate: (date: Date | null) => void;
  setTags: (tags: string[]) => void;
  setCategories: (categories: string[]) => void;
  setAuthors: (authors: PostAuthorInput[]) => void;
  setLoading: (loading: boolean) => void;
  setPostId: (postId: number | undefined) => void;
  setFeaturedImageUrl: (url: string | null) => void;
  handleImageSelect: (file: File | null) => void;
  handleRemoveImage: () => void;
  handleSave: (saveStatus?: PostStatus) => Promise<void>;
  handleDelete: () => Promise<void>;
  resetEditor: () => void;
  setAttachedSong: (song: AttachedSong | null) => void;
}

const PostEditorContext = createContext<PostEditorContextValue | null>(null);

const initialState: PostEditorState = {
  postId: undefined,
  loading: false,
  saving: false,
  deleting: false,
  title: '',
  slug: '',
  excerpt: '',
  status: 'draft',
  featured: false,
  publishDate: null,
  tags: [],
  categories: [],
  authors: [],
  featuredImage: null,
  featuredImageUrl: null,
  featuredImagePreview: null,
  attachedSong: null,
};

export function PostEditorProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [state, setState] = useState<PostEditorState>(initialState);

  const setTitle = useCallback((title: string) => setState((s) => ({ ...s, title })), []);
  const setSlug = useCallback((slug: string) => setState((s) => ({ ...s, slug })), []);
  const setExcerpt = useCallback((excerpt: string) => setState((s) => ({ ...s, excerpt })), []);
  const setStatus = useCallback((status: PostStatus) => setState((s) => ({ ...s, status })), []);
  const setFeatured = useCallback((featured: boolean) => setState((s) => ({ ...s, featured })), []);
  const setPublishDate = useCallback(
    (publishDate: Date | null) => setState((s) => ({ ...s, publishDate })),
    []
  );
  const setTags = useCallback((tags: string[]) => setState((s) => ({ ...s, tags })), []);
  const setCategories = useCallback(
    (categories: string[]) => setState((s) => ({ ...s, categories })),
    []
  );
  const setAuthors = useCallback(
    (authors: PostAuthorInput[]) => setState((s) => ({ ...s, authors })),
    []
  );
  const setLoading = useCallback((loading: boolean) => setState((s) => ({ ...s, loading })), []);
  const setPostId = useCallback(
    (postId: number | undefined) => setState((s) => ({ ...s, postId })),
    []
  );
  const setFeaturedImageUrl = useCallback(
    (featuredImageUrl: string | null) => setState((s) => ({ ...s, featuredImageUrl })),
    []
  );

  const setAttachedSong = useCallback(
    (attachedSong: AttachedSong | null) => setState((s) => ({ ...s, attachedSong })),
    []
  );

  const handleImageSelect = useCallback((file: File | null) => {
    if (file) {
      setState((s) => ({
        ...s,
        featuredImage: file,
        featuredImagePreview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setState((s) => ({
      ...s,
      featuredImage: null,
      featuredImagePreview: null,
      featuredImageUrl: null,
    }));
  }, []);

  const handleSave = useCallback(
    async (saveStatus?: PostStatus) => {
      if (!state.title.trim()) {
        notifications.show({
          title: 'Error',
          message: 'Title is required.',
          color: 'red',
        });
        return;
      }

      const targetStatus = saveStatus || state.status;

      if (targetStatus === 'published' && !editor?.getHTML()) {
        notifications.show({
          title: 'Error',
          message: 'Content is required for published posts.',
          color: 'red',
        });
        return;
      }

      if (targetStatus === 'scheduled' && !state.publishDate) {
        notifications.show({
          title: 'Error',
          message: 'Publish date is required for scheduled posts.',
          color: 'red',
        });
        return;
      }

      setState((s) => ({ ...s, saving: true }));
      try {
        // Determine the publish date based on status:
        // - 'published' (new): use current time (publish immediately)
        // - 'published' (update): keep existing publish date (don't change it)
        // - 'scheduled': use the selected future date
        // - 'draft': no publish date needed
        let publishDate: string | null | undefined = undefined;
        if (targetStatus === 'published') {
          // Only set publish date when newly publishing, not when updating
          if (state.status !== 'published') {
            publishDate = new Date().toISOString();
          }
          // If already published, don't include publish_date - keeps existing
        } else if (targetStatus === 'scheduled' && state.publishDate) {
          publishDate = state.publishDate.toISOString();
        } else if (targetStatus === 'draft') {
          publishDate = null;
        }

        const data = {
          title: state.title,
          slug: state.slug || undefined,
          excerpt: state.excerpt || undefined,
          body: editor?.getHTML() || '',
          status: targetStatus,
          featured: state.featured,
          // Only include publish_date if we need to change it
          ...(publishDate !== undefined && { publish_date: publishDate }),
          tags: state.tags,
          categories: state.categories,
          authors: state.authors.length > 0 ? state.authors : undefined,
          featured_image: state.featuredImage || undefined,
          // Attached song fields
          song_name: state.attachedSong?.song_name || undefined,
          band_name: state.attachedSong?.band_name || undefined,
          album_name: state.attachedSong?.album_name || undefined,
          song_artwork_url: state.attachedSong?.artwork_url || undefined,
          song_link: state.attachedSong?.song_link || undefined,
        };

        if (state.postId) {
          await apiClient.updatePost(state.postId, data);
          notifications.show({
            title: 'Saved',
            message: 'Post updated successfully.',
            color: 'green',
          });
        } else {
          const response = await apiClient.createPost(data);
          notifications.show({
            title: 'Saved',
            message: 'Post created successfully.',
            color: 'green',
          });
          // If not publishing, stay in editor with the new post ID
          if (targetStatus !== 'published') {
            router.replace(`/user/blogger/posts/editor?id=${response.post.id}`);
          }
        }

        setState((s) => ({ ...s, status: targetStatus }));

        // Redirect to posts list after publishing
        if (targetStatus === 'published') {
          router.push('/user/blogger/posts');
        }
      } catch (error) {
        console.error('Failed to save post:', error);
        notifications.show({
          title: 'Error',
          message: error instanceof Error ? error.message : 'Failed to save post.',
          color: 'red',
        });
      } finally {
        setState((s) => ({ ...s, saving: false }));
      }
    },
    [state, editor, router]
  );

  const handleDelete = useCallback(async () => {
    if (!state.postId) {return;}

    if (!window.confirm('Are you sure you want to delete this post?')) {return;}

    setState((s) => ({ ...s, deleting: true }));
    try {
      await apiClient.deletePost(state.postId);
      notifications.show({
        title: 'Deleted',
        message: 'Post deleted successfully.',
        color: 'green',
      });
      router.push('/user/blogger/posts');
    } catch (error) {
      console.error('Failed to delete post:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete post.',
        color: 'red',
      });
    } finally {
      setState((s) => ({ ...s, deleting: false }));
    }
  }, [state.postId, router]);

  const resetEditor = useCallback(() => {
    setState(initialState);
    if (editor) {
      editor.commands.clearContent();
    }
  }, [editor]);

  return (
    <PostEditorContext.Provider
      value={{
        state,
        editor,
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
        handleImageSelect,
        handleRemoveImage,
        handleSave,
        handleDelete,
        resetEditor,
        setAttachedSong,
      }}
    >
      {children}
    </PostEditorContext.Provider>
  );
}

export function usePostEditorContext() {
  const context = useContext(PostEditorContext);
  if (!context) {
    throw new Error('usePostEditorContext must be used within a PostEditorProvider');
  }
  return context;
}
