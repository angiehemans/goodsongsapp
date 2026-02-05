'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconSend, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Center,
  Drawer,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, ReviewComment } from '@/lib/api';
import styles from './CommentsDrawer.module.css';

interface CommentsDrawerProps {
  reviewId: number;
  opened: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

export function CommentsDrawer({
  reviewId,
  opened,
  onClose,
  onCommentCountChange,
}: CommentsDrawerProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load comments when drawer opens
  useEffect(() => {
    if (opened) {
      loadComments(1, true);
    }
  }, [opened, reviewId]);

  const loadComments = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await apiClient.getReviewComments(reviewId, pageNum);
      if (reset) {
        setComments(response.comments);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }
      setHasNextPage(response.pagination.has_next_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      loadComments(page + 1, false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !user) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.createReviewComment(reviewId, newComment.trim());
      // Construct the full comment object with author data in case API doesn't return it
      const comment = {
        ...response,
        author: response.author || {
          id: user.id,
          username: user.username,
          profile_image_url: user.profile_image_url,
        },
      };
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      onCommentCountChange?.(comments.length + 1);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      await apiClient.deleteReviewComment(reviewId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange?.(Math.max(0, comments.length - 1));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
            handleLoadMore();
          }
        },
        { rootMargin: '100px' }
      );
      observerRef.current.observe(node);
    },
    [hasNextPage, isLoadingMore]
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Comments"
      position="right"
      size="md"
      padding="md"
    >
      <Stack gap="md" className={styles.container}>
        {/* Comments List */}
        <div className={styles.commentsList}>
          {isLoading ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : comments.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No comments yet. Be the first to comment!</Text>
            </Center>
          ) : (
            <Stack gap="md">
              {comments.map((comment, index) => {
                const author = comment.author || { id: 0, username: 'unknown', profile_image_url: undefined };
                return (
                  <div key={comment.id ?? `comment-${index}`} className={styles.comment}>
                    <Group gap="sm" align="flex-start">
                      <ProfilePhoto
                        src={author.profile_image_url}
                        alt={author.username}
                        size={32}
                        fallback={author.username}
                        href={`/users/${author.username}`}
                      />
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap="xs" justify="space-between">
                          <Group gap="xs">
                            <Text
                              size="sm"
                              fw={500}
                              component={Link}
                              href={`/users/${author.username}`}
                              className={styles.username}
                            >
                              @{author.username}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatTimeAgo(comment.created_at)}
                            </Text>
                          </Group>
                          {user?.id === author.id && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              loading={deletingId === comment.id}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                        <Text size="sm" className={styles.commentBody}>
                          {comment.body}
                        </Text>
                      </Stack>
                    </Group>
                  </div>
                );
              })}

              {hasNextPage && (
                <div ref={sentinelRef}>
                  <Center py="sm">
                    <Loader size="sm" />
                  </Center>
                </div>
              )}
            </Stack>
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <div className={styles.inputContainer}>
            <Group gap="sm" align="flex-end">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={300}
                minRows={1}
                maxRows={4}
                autosize
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <ActionIcon
                variant="filled"
                color="grape"
                size="lg"
                onClick={handleSubmitComment}
                loading={isSubmitting}
                disabled={!newComment.trim()}
              >
                <IconSend size={18} />
              </ActionIcon>
            </Group>
            <Text size="xs" c="dimmed" ta="right" mt={4}>
              {newComment.length}/300
            </Text>
          </div>
        ) : (
          <div className={styles.loginPrompt}>
            <Text size="sm" c="dimmed" ta="center">
              <Link href="/login" className={styles.loginLink}>
                Log in
              </Link>{' '}
              to leave a comment
            </Text>
          </div>
        )}
      </Stack>
    </Drawer>
  );
}
