'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconBrandInstagram,
  IconCheck,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconLink,
  IconMessage,
  IconMusic,
  IconPhoto,
  IconSend,
  IconShare,
  IconTrash,
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import {
  ActionIcon,
  Badge,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Textarea,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Review, ReviewComment } from '@/lib/api';
import styles from './page.module.css';

export default function SingleReviewPage() {
  const params = useParams();
  const username = params.username as string;
  const reviewId = params.reviewId as string;
  const { user } = useAuth();

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [renderFormat, setRenderFormat] = useState<'story' | 'post' | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Comments state
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);

  const storyRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);

  // Proxy external images to avoid CORS issues with html2canvas
  const getProxiedImageUrl = (url: string | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('/') || url.includes('goodsongs.app')) {
      return url;
    }
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInstagramShare = async (format: 'story' | 'post') => {
    setGeneratingImage(true);
    setRenderFormat(format);
  };

  // Effect to capture image once the renderer is mounted
  useEffect(() => {
    if (!renderFormat || !generatingImage || !review) return;

    const targetRef = renderFormat === 'story' ? storyRef : postRef;

    const captureImage = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!targetRef.current) {
        setGeneratingImage(false);
        setRenderFormat(null);
        return;
      }

      const images = targetRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      await Promise.race([
        Promise.all(imagePromises),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);

      try {
        const canvas = await html2canvas(targetRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        const link = document.createElement('a');
        const authorName = review.author?.username || review.user?.username || username;
        link.download = `${review.song_name}-review-by-${authorName}-${renderFormat}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to generate image:', err);
      } finally {
        setGeneratingImage(false);
        setRenderFormat(null);
      }
    };

    captureImage();
  }, [renderFormat, generatingImage, review, username]);

  const handleLikeClick = async () => {
    if (isLiking || !review) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeReview(review.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likeReview(review.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error('Failed to like/unlike review:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Load comments
  const loadComments = useCallback(async (page: number, reset: boolean = false) => {
    if (reset) {
      setCommentsLoading(true);
    } else {
      setLoadingMoreComments(true);
    }

    try {
      const response = await apiClient.getReviewComments(parseInt(reviewId, 10), page);
      if (reset) {
        setComments(response.comments);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }
      setHasMoreComments(response.pagination.has_next_page);
      setCommentsPage(page);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
      setLoadingMoreComments(false);
    }
  }, [reviewId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment || !user) return;

    setIsSubmittingComment(true);
    try {
      const response = await apiClient.createReviewComment(parseInt(reviewId, 10), newComment.trim());
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
      setCommentsCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setDeletingCommentId(commentId);
    try {
      await apiClient.deleteReviewComment(parseInt(reviewId, 10), commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingCommentId(null);
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

  useEffect(() => {
    async function fetchReview() {
      try {
        setLoading(true);
        const fetchedReview = await apiClient.getReview(parseInt(reviewId, 10));
        setReview(fetchedReview);
        setIsLiked(fetchedReview.liked_by_current_user ?? false);
        setLikesCount(fetchedReview.likes_count ?? 0);
        setCommentsCount(fetchedReview.comments_count ?? 0);
      } catch (err) {
        console.error('Failed to fetch review:', err);
        setError('Review not found');
      } finally {
        setLoading(false);
      }
    }

    if (reviewId) {
      fetchReview();
      loadComments(1, true);
    }
  }, [reviewId, loadComments]);

  if (loading) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Center py="xl">
          <Loader size="lg" color="grape" />
        </Center>
      </Container>
    );
  }

  if (error || !review) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Container size="xs" py="xl">
          <Center>
            <Stack align="center" gap="md">
              <IconMusic size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed">Review not found</Text>
              <UnstyledButton
                component={Link}
                href={`/users/${username}`}
                className={styles.linkButton}
              >
                Back to profile
              </UnstyledButton>
            </Stack>
          </Center>
        </Container>
      </Container>
    );
  }

  const authorUsername = review.author?.username || review.user?.username || username;
  const authorProfileImage = review.author?.profile_image_url;

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Truncate text for Instagram formats
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + '...';
  };

  return (
    <Container p={0} fluid className={styles.container}>
      <Header showBackButton />

      <div className={styles.pageWrapper}>
        <div className={styles.post}>
          {/* Author Row */}
          <div className={styles.authorRow}>
            <ProfilePhoto
              src={authorProfileImage}
              alt={authorUsername}
              size={44}
              fallback={authorUsername}
              href={`/users/${authorUsername}`}
            />
            <div className={styles.authorInfo}>
              <Group gap={6} align="center">
                <Text
                  component={Link}
                  href={`/users/${authorUsername}`}
                  className={styles.authorName}
                >
                  {authorUsername}
                </Text>
                <Text c="dimmed" size="sm">
                  ·
                </Text>
                <Text c="dimmed" size="sm">
                  {getRelativeTime(review.created_at)}
                </Text>
              </Group>
            </div>
          </div>

          {/* Song Card */}
          <UnstyledButton
            component={review.song_link ? 'a' : 'div'}
            href={review.song_link || undefined}
            target={review.song_link ? '_blank' : undefined}
            rel={review.song_link ? 'noopener noreferrer' : undefined}
            className={styles.songCard}
          >
            {review.artwork_url ? (
              <img
                src={review.artwork_url}
                alt={`${review.song_name} artwork`}
                className={styles.songArtwork}
              />
            ) : (
              <div className={styles.songArtworkPlaceholder}>
                <IconMusic size={28} color="var(--mantine-color-grape-4)" />
              </div>
            )}
            <div className={styles.songDetails}>
              <Text className={styles.songName}>{review.song_name}</Text>
              <Text className={styles.artistName}>{review.band_name}</Text>
            </div>
            {review.song_link && (
              <IconExternalLink size={18} className={styles.songLinkIcon} />
            )}
          </UnstyledButton>

          {/* Review Text */}
          <Text className={styles.reviewText}>{review.review_text}</Text>

          {/* Tags */}
          {review.liked_aspects && review.liked_aspects.length > 0 && (
            <Group gap={8} className={styles.tags}>
              {review.liked_aspects.map((aspect, index) => (
                <Badge
                  key={index}
                  variant="light"
                  color="grape"
                  size="sm"
                  className={styles.tag}
                >
                  {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                </Badge>
              ))}
            </Group>
          )}

          {/* Actions Row */}
          <div className={styles.actionsRow}>
            <Group gap="md">
              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  color={isLiked ? 'red' : 'gray'}
                  size="lg"
                  onClick={handleLikeClick}
                  loading={isLiking}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  {isLiked ? <IconHeartFilled size={22} /> : <IconHeart size={22} />}
                </ActionIcon>
                {likesCount > 0 && (
                  <Text size="sm" c="dimmed">
                    {likesCount}
                  </Text>
                )}
              </Group>

              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  aria-label="Comments"
                >
                  <IconMessage size={22} />
                </ActionIcon>
                {commentsCount > 0 && (
                  <Text size="sm" c="dimmed">
                    {commentsCount}
                  </Text>
                )}
              </Group>
            </Group>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  loading={generatingImage}
                  aria-label="Share"
                >
                  {copied ? <IconCheck size={22} /> : <IconShare size={22} />}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Share this review</Menu.Label>
                <Menu.Item leftSection={<IconLink size={16} />} onClick={handleCopyLink}>
                  {copied ? 'Copied!' : 'Copy link'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Download for Instagram</Menu.Label>
                <Menu.Item
                  leftSection={<IconBrandInstagram size={16} />}
                  onClick={() => handleInstagramShare('story')}
                  disabled={generatingImage}
                >
                  Story (9:16)
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => handleInstagramShare('post')}
                  disabled={generatingImage}
                >
                  Post (1:1)
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>

        </div>

        {/* Comments Section */}
        <div className={styles.commentsSection}>
          <Title order={4} mb="md">
            Comments {commentsCount > 0 && `(${commentsCount})`}
          </Title>

          {/* Comment Input */}
          {user ? (
            <div className={styles.commentInput}>
              <Group gap="sm" align="flex-end">
                <ProfilePhoto
                  src={user.profile_image_url}
                  alt={user.username}
                  size={36}
                  fallback={user.username}
                />
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
                  loading={isSubmittingComment}
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
            <Text size="sm" c="dimmed" ta="center" py="md">
              <Link href="/login" style={{ color: 'var(--mantine-color-grape-6)', fontWeight: 500 }}>
                Log in
              </Link>{' '}
              to leave a comment
            </Text>
          )}

          <Divider my="md" />

          {/* Comments List */}
          {commentsLoading ? (
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
                              style={{ textDecoration: 'none', color: 'var(--mantine-color-grape-7)' }}
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
                              loading={deletingCommentId === comment.id}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          )}
                        </Group>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                          {comment.body}
                        </Text>
                      </Stack>
                    </Group>
                  </div>
                );
              })}

              {hasMoreComments && (
                <Center>
                  <UnstyledButton
                    onClick={() => loadComments(commentsPage + 1, false)}
                    className={styles.loadMoreButton}
                  >
                    {loadingMoreComments ? <Loader size="sm" /> : 'Load more comments'}
                  </UnstyledButton>
                </Center>
              )}
            </Stack>
          )}
        </div>
      </div>

      {/* Hidden Instagram Story Renderer */}
      {renderFormat === 'story' && (
        <div className={styles.hiddenRenderer}>
          <div ref={storyRef} className={styles.storyContainer}>
            <div className={styles.storyContent}>
              {review.artwork_url ? (
                <img
                  src={getProxiedImageUrl(review.artwork_url)}
                  alt={`${review.song_name} artwork`}
                  className={styles.storyArtwork}
                />
              ) : (
                <div className={styles.storyArtworkPlaceholder}>
                  <IconMusic size={80} color="#9c36b5" />
                </div>
              )}
              <div className={styles.storySongInfo}>
                <h1 className={styles.storySongName}>{review.song_name}</h1>
                <p className={styles.storyArtistName}>{review.band_name}</p>
              </div>
              <div className={styles.storyReviewText}>
                <p>"{truncateText(review.review_text, 280)}"</p>
                <div className={styles.storyAuthor}>
                  <ProfilePhoto
                    src={authorProfileImage}
                    alt={authorUsername}
                    size={40}
                    fallback={authorUsername}
                  />
                  <span>@{authorUsername}</span>
                </div>
              </div>
              <div className={styles.storyBranding}>
                <img src="/logo.svg" alt="Good Songs" className={styles.storyLogo} />
                <span>goodsongs.app</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Instagram Post Renderer */}
      {renderFormat === 'post' && (
        <div className={styles.hiddenRenderer}>
          <div ref={postRef} className={styles.postContainer}>
            <div className={styles.postContent}>
              {review.artwork_url ? (
                <img
                  src={getProxiedImageUrl(review.artwork_url)}
                  alt={`${review.song_name} artwork`}
                  className={styles.postArtwork}
                />
              ) : (
                <div className={styles.postArtworkPlaceholder}>
                  <IconMusic size={60} color="#9c36b5" />
                </div>
              )}
              <div className={styles.postSongInfo}>
                <h1 className={styles.postSongName}>{review.song_name}</h1>
                <p className={styles.postArtistName}>{review.band_name}</p>
              </div>
              <div className={styles.postReviewText}>
                <p>"{truncateText(review.review_text, 180)}"</p>
                <div className={styles.postAuthor}>
                  <ProfilePhoto
                    src={authorProfileImage}
                    alt={authorUsername}
                    size={28}
                    fallback={authorUsername}
                  />
                  <span>@{authorUsername}</span>
                </div>
              </div>
              <div className={styles.postBranding}>
                <img src="/logo.svg" alt="Good Songs" className={styles.postLogo} />
                <span>goodsongs.app</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
