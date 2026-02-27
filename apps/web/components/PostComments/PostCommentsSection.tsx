'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconArrowBackUp,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconSend,
  IconTrash,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { MentionText } from '@/components/MentionText/MentionText';
import { MentionTextarea } from '@/components/MentionTextarea/MentionTextarea';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { useClaimToken } from '@/hooks/useClaimToken';
import { apiClient, PostComment } from '@/lib/api';
import { formatTimeAgo } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { SignupPromptModal } from './SignupPromptModal';
import styles from './PostCommentsSection.module.css';

interface PostCommentsSectionProps {
  postId: number;
  initialCommentsCount?: number;
  allowAnonymous?: boolean;
}

export function PostCommentsSection({
  postId,
  initialCommentsCount = 0,
  allowAnonymous = false,
}: PostCommentsSectionProps) {
  const { user } = useAuth();
  const { storeClaimToken } = useClaimToken();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [likingId, setLikingId] = useState<number | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Anonymous comment form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [anonymousComment, setAnonymousComment] = useState('');

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuestEmail(value);
    // Clear error when user starts typing, validate on blur
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    if (guestEmail.trim() && !validateEmail(guestEmail.trim())) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  // Signup prompt modal state
  const [signupPromptOpen, setSignupPromptOpen] = useState(false);
  const [pendingClaimToken, setPendingClaimToken] = useState<string | null>(null);

  // Load comments on mount
  useEffect(() => {
    loadComments(1, true);
  }, [postId]);

  const loadComments = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await apiClient.getPostComments(postId, pageNum);
      if (reset) {
        setComments(response.comments);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }
      setHasNextPage(response.pagination.has_next_page);
      setPage(pageNum);
      if (reset) {
        setCommentsCount(response.pagination.total_count);
      }
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

  // Authenticated user comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !user) return;

    const commentText = newComment.trim();
    setIsSubmitting(true);
    try {
      const response = await apiClient.createPostComment(postId, { body: commentText });
      setComments((prev) => [...prev, response.comment]);
      setNewComment('');
      setCommentsCount(response.comments_count);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Anonymous comment submission
  const handleSubmitAnonymousComment = async () => {
    if (!anonymousComment.trim() || !guestName.trim() || !guestEmail.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.createPostComment(postId, {
        body: anonymousComment.trim(),
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
      });
      setComments((prev) => [...prev, response.comment]);
      setAnonymousComment('');
      setGuestName('');
      setGuestEmail('');
      setCommentsCount(response.comments_count);

      // If we got a claim token, show the signup prompt
      if (response.claim_token) {
        setPendingClaimToken(response.claim_token);
        setSignupPromptOpen(true);
      }
    } catch (error) {
      console.error('Failed to post anonymous comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      const response = await apiClient.deletePostComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount(response.comments_count);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeComment = async (comment: PostComment) => {
    if (likingId !== null || !user) return;

    setLikingId(comment.id);
    try {
      if (comment.liked_by_current_user) {
        const response = await apiClient.unlikePostComment(comment.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? { ...c, liked_by_current_user: false, likes_count: response.likes_count }
              : c
          )
        );
      } else {
        const response = await apiClient.likePostComment(comment.id);
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? { ...c, liked_by_current_user: true, likes_count: response.likes_count }
              : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
    } finally {
      setLikingId(null);
    }
  };

  const handleReply = (username: string) => {
    if (user) {
      setNewComment(`@${username} `);
    }
    setTimeout(() => {
      inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const textarea = inputContainerRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 100);
  };

  const handleCreateAccount = () => {
    if (pendingClaimToken) {
      storeClaimToken(pendingClaimToken);
    }
    setSignupPromptOpen(false);
    window.location.href = '/signup';
  };

  const canSubmitAnonymous =
    anonymousComment.trim() &&
    guestName.trim() &&
    guestEmail.trim() &&
    validateEmail(guestEmail.trim()) &&
    !isSubmitting;

  return (
    <>
      <Box className={styles.container}>
        {/* Header */}
        <Group gap="xs" mb="md">
          <IconMessage size={20} />
          <Title order={4}>Comments {commentsCount > 0 && `(${commentsCount})`}</Title>
        </Group>

        {/* Comment Input - Show at top */}
        {user ? (
          // Authenticated user input
          <Paper
            p="md"
            radius="md"
            withBorder
            mb="lg"
            ref={inputContainerRef}
            className={styles.darkPaper}
          >
            <Stack gap="sm">
              <Group gap="sm" align="flex-start">
                <ProfilePhoto
                  src={user.profile_image_url}
                  alt={user.username || 'You'}
                  size={36}
                  fallback={user.username || '?'}
                />
                <Box style={{ flex: 1 }}>
                  <MentionTextarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={setNewComment}
                    maxLength={500}
                    minRows={2}
                    maxRows={6}
                    autosize
                    classNames={{ root: styles.darkInput }}
                  />
                </Box>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {newComment.length}/500
                </Text>
                <Button
                  color="grape"
                  size="sm"
                  onClick={handleSubmitComment}
                  loading={isSubmitting}
                  disabled={!newComment.trim()}
                  leftSection={<IconSend size={16} />}
                >
                  Post Comment
                </Button>
              </Group>
            </Stack>
          </Paper>
        ) : allowAnonymous ? (
          // Anonymous comment form
          <Paper
            p="md"
            radius="md"
            withBorder
            mb="lg"
            ref={inputContainerRef}
            className={styles.darkPaper}
          >
            <Stack gap="sm">
              <Text size="sm" fw={500}>
                Leave a comment
              </Text>
              {emailError && (
                <Text size="xs" c="red">
                  {emailError}
                </Text>
              )}
              <Group grow>
                <TextInput
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  size="sm"
                  classNames={{ root: styles.darkInput }}
                />
                <TextInput
                  placeholder="Your email"
                  type="email"
                  value={guestEmail}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  error={!!emailError}
                  size="sm"
                  classNames={{ root: styles.darkInput }}
                />
              </Group>
              <Textarea
                placeholder="Write your comment..."
                value={anonymousComment}
                onChange={(e) => setAnonymousComment(e.target.value)}
                maxLength={500}
                minRows={3}
                maxRows={6}
                autosize
                classNames={{ root: styles.darkInput }}
              />
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {anonymousComment.length}/500
                </Text>
                <Button
                  color="gray.9"
                  size="sm"
                  onClick={handleSubmitAnonymousComment}
                  loading={isSubmitting}
                  disabled={!canSubmitAnonymous}
                  leftSection={<IconSend size={16} />}
                >
                  Post Comment
                </Button>
              </Group>
            </Stack>
          </Paper>
        ) : (
          // Login prompt
          <Paper p="md" radius="md" withBorder mb="lg" className={styles.darkPaper}>
            <Text size="sm" c="dimmed" ta="center">
              <Link href="/login" className={styles.loginLink}>
                Log in
              </Link>{' '}
              to leave a comment
            </Text>
          </Paper>
        )}

        {/* Comments List */}
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
              const isAnonymous = comment.anonymous;
              const author = comment.author;

              return (
                <Paper
                  key={comment.id ?? `comment-${index}`}
                  p="md"
                  radius="md"
                  withBorder
                  className={`${styles.darkPaper} ${isAnonymous ? styles.anonymousComment : ''}`}
                >
                  <Group gap="sm" align="flex-start">
                    {isAnonymous ? (
                      <Box w={36} h={36} className={styles.guestAvatar}>
                        <Logo size={20} />
                      </Box>
                    ) : (
                      <ProfilePhoto
                        src={author?.profile_image_url}
                        alt={author?.username || 'User'}
                        size={36}
                        fallback={author?.username || '?'}
                        href={author ? `/users/${author.username}` : undefined}
                      />
                    )}
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group gap="xs" justify="space-between">
                        <Group gap="xs">
                          {isAnonymous ? (
                            <Text size="sm" fw={500} className={styles.guestName}>
                              {comment.guest_name || 'Anonymous'}
                            </Text>
                          ) : (
                            <Text
                              size="sm"
                              fw={500}
                              component={Link}
                              href={`/users/${author?.username}`}
                              className={styles.username}
                            >
                              @{author?.username}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed">
                            {formatTimeAgo(comment.created_at)}
                          </Text>
                        </Group>
                        {!isAnonymous && user?.id === author?.id && (
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

                      {isAnonymous ? (
                        <Text size="sm" className={styles.commentBody}>
                          {comment.body}
                        </Text>
                      ) : (
                        <MentionText
                          text={comment.formatted_body || comment.body}
                          size="sm"
                          className={styles.commentBody}
                        />
                      )}

                      {/* Comment Actions */}
                      <Group gap="md" mt="xs">
                        {/* Reply Button - only for authenticated users and non-anonymous comments */}
                        {user && !isAnonymous && author && (
                          <Button
                            variant="subtle"
                            color="gray"
                            size="xs"
                            leftSection={<IconArrowBackUp size={14} />}
                            onClick={() => handleReply(author.username)}
                          >
                            Reply
                          </Button>
                        )}
                        {/* Like Button - only show for logged in users */}
                        {user && (
                          <Group gap={4}>
                            <ActionIcon
                              variant="subtle"
                              color={comment.liked_by_current_user ? 'red' : 'gray.6'}
                              size="sm"
                              onClick={() => handleLikeComment(comment)}
                              loading={likingId === comment.id}
                            >
                              {comment.liked_by_current_user ? (
                                <IconHeartFilled size={16} />
                              ) : (
                                <IconHeart size={16} />
                              )}
                            </ActionIcon>
                            {comment.likes_count > 0 && (
                              <Text size="sm" c={comment.liked_by_current_user ? 'red' : 'dimmed'}>
                                {comment.likes_count}
                              </Text>
                            )}
                          </Group>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}

            {/* Load More Button */}
            {hasNextPage && (
              <Center>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={handleLoadMore}
                  loading={isLoadingMore}
                >
                  Load more comments
                </Button>
              </Center>
            )}
          </Stack>
        )}
      </Box>

      {/* Signup Prompt Modal */}
      <SignupPromptModal
        opened={signupPromptOpen}
        onClose={() => setSignupPromptOpen(false)}
        onCreateAccount={handleCreateAccount}
      />
    </>
  );
}
