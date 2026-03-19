'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconArrowRight, IconHeart, IconHeartFilled, IconMessage } from '@tabler/icons-react';
import { ActionIcon, Button, Card, Group, Stack, Text } from '@mantine/core';
import { CommentsDrawer } from '@/components/CommentsDrawer/CommentsDrawer';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, FeedPostItem } from '@/lib/api';
import styles from './FeedPostCard.module.css';

interface FeedPostCardProps {
  post: FeedPostItem;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  const { user } = useAuth();
  const authorName =
    post.author?.display_name || post.author?.username || post.authors?.[0]?.name || 'Unknown';
  const authorUsername = post.author?.username;
  const authorRole = post.author?.role;
  const authorProfileImage = post.author?.profile_image_url;
  const bandSlug = post.author?.band_slug || post.band?.slug;

  const postUrl = authorRole === 'band' && bandSlug
    ? `/bands/${bandSlug}/${post.slug}`
    : authorUsername
      ? `/blog/${authorUsername}/${post.slug}`
      : `/blog/${post.slug}`;

  const [isLiked, setIsLiked] = useState(post.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likePost(post.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card py="sm" px={0} bg="none" maw={700} className={styles.cardBorder}>
      <Stack gap="sm">
        {/* Author Info */}
        <Group gap="sm">
          <ProfilePhoto
            src={authorProfileImage}
            alt={authorName}
            size={36}
            fallback={authorName}
            href={authorRole === 'band' && bandSlug ? `/bands/${bandSlug}` : authorUsername ? `/users/${authorUsername}` : undefined}
          />
          <Stack gap={2}>
            {authorRole === 'band' && bandSlug ? (
              <Text
                size="sm"
                fw={500}
                component={Link}
                href={`/bands/${bandSlug}`}
                style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
                className={styles.authorName}
              >
                {post.band?.name || authorName}
              </Text>
            ) : authorUsername ? (
              <Text
                size="sm"
                fw={500}
                component={Link}
                href={`/users/${authorUsername}`}
                style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
                className={styles.authorName}
              >
                @{authorUsername}
              </Text>
            ) : (
              <Text
                size="sm"
                fw={500}
                className={styles.authorName}
                style={{ color: 'var(--gs-text-accent)' }}
              >
                {authorName}
              </Text>
            )}
            <Text size="xs" style={{ color: 'var(--gs-text-tertiary)' }}>
              {new Date(post.publish_date || post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Stack>
        </Group>

        {/* Post Content */}
        <div className={styles.postRow}>
          <Stack gap="sm">
            {post.featured_image_url && (
              <Link href={postUrl}>
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className={styles.featuredImage}
                />
              </Link>
            )}
            <Text
              fw={500}
              lineClamp={2}
              className={styles.postTitle}
              style={{ color: 'var(--gs-text-primary)' }}
            >
              {post.title}
            </Text>
            {post.excerpt && (
              <Text size="sm" c="dimmed" lineClamp={3} style={{ whiteSpace: 'pre-wrap' }}>
                {post.excerpt}
              </Text>
            )}
          </Stack>
        </div>

        {/* Actions Row */}
        <Group gap="sm" justify="space-between" className={styles.actionItems}>
          <Button
            component={Link}
            href={postUrl}
            variant="subtle"
            size="xs"
            rightSection={<IconArrowRight size={14} />}
          >
            Read Post
          </Button>

          <Group gap="sm">
            {/* Comments */}
            <Group gap={4}>
              <ActionIcon variant="subtle" color="grape" aria-label="View comments" onClick={() => setCommentsDrawerOpen(true)}>
                <IconMessage size={20} />
              </ActionIcon>
              {commentsCount > 0 && (
                <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
                  {commentsCount}
                </Text>
              )}
            </Group>

            {/* Likes */}
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                color={isLiked ? 'red' : 'grape'}
                onClick={handleLikeClick}
                loading={isLiking}
                aria-label={isLiked ? 'Unlike post' : 'Like post'}
              >
                {isLiked ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
              </ActionIcon>
              {likesCount > 0 && (
                <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
                  {likesCount}
                </Text>
              )}
            </Group>
          </Group>
        </Group>
      </Stack>

      <CommentsDrawer
        resourceType="post"
        resourceId={post.id}
        opened={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        onCommentCountChange={setCommentsCount}
      />
    </Card>
  );
}
