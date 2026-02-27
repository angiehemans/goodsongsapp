'use client';

import { useState } from 'react';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { ActionIcon, Group, Text } from '@mantine/core';
import { apiClient } from '@/lib/api';

interface PostLikeButtonProps {
  postId: number;
  initialLiked?: boolean;
  initialLikesCount?: number;
  size?: 'sm' | 'md' | 'lg';
  onLikeChange?: (liked: boolean, likesCount: number) => void;
}

export function PostLikeButton({
  postId,
  initialLiked = false,
  initialLikesCount = 0,
  size = 'md',
  onLikeChange,
}: PostLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);

  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20;

  const handleLikeClick = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikePost(postId);
        setIsLiked(false);
        setLikesCount(response.likes_count);
        onLikeChange?.(false, response.likes_count);
      } else {
        const response = await apiClient.likePost(postId);
        setIsLiked(true);
        setLikesCount(response.likes_count);
        onLikeChange?.(true, response.likes_count);
      }
    } catch (error) {
      // Silently fail - user might not be logged in
      console.error('Failed to like/unlike post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Group gap={4}>
      <ActionIcon
        variant="subtle"
        color={isLiked ? 'red' : 'grape'}
        onClick={handleLikeClick}
        loading={isLiking}
        aria-label={isLiked ? 'Unlike post' : 'Like post'}
        size={size}
      >
        {isLiked ? <IconHeartFilled size={iconSize} /> : <IconHeart size={iconSize} />}
      </ActionIcon>
      {likesCount > 0 && (
        <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
          {likesCount}
        </Text>
      )}
    </Group>
  );
}
