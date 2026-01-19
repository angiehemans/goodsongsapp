'use client';

import { useState } from 'react';
import { IconUserMinus, IconUserPlus } from '@tabler/icons-react';
import { Button, ButtonProps } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiClient } from '@/lib/api';

interface FollowButtonProps extends Omit<ButtonProps, 'onClick'> {
  userId: number;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
  ...buttonProps
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await apiClient.unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
        notifications.show({
          title: 'Unfollowed',
          message: 'You are no longer following this user.',
          color: 'gray',
        });
      } else {
        await apiClient.followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
        notifications.show({
          title: 'Following',
          message: 'You are now following this user!',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      notifications.show({
        title: 'Error',
        message: 'Could not complete the action. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      loading={isLoading}
      variant={isFollowing ? 'light' : 'filled'}
      color={isFollowing ? 'gray' : 'grape'}
      leftSection={isFollowing ? <IconUserMinus size={16} /> : <IconUserPlus size={16} />}
      {...buttonProps}
    >
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
