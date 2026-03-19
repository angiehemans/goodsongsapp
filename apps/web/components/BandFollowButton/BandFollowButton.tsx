'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { FollowButton } from '@/components/FollowButton/FollowButton';

interface BandFollowButtonProps {
  ownerUserId: number;
}

export function BandFollowButton({ ownerUserId }: BandFollowButtonProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const isOwnProfile = user?.id === ownerUserId;

  useEffect(() => {
    if (isAuthLoading || !user || isOwnProfile) {
      setHasChecked(true);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const following = await apiClient.getFollowing();
        const followingArray = Array.isArray(following) ? following : [];
        setIsFollowing(followingArray.some((f) => f.id === ownerUserId));
      } catch {
        setIsFollowing(false);
      } finally {
        setHasChecked(true);
      }
    };

    checkFollowStatus();
  }, [user, isAuthLoading, ownerUserId, isOwnProfile]);

  if (!user || isOwnProfile || !hasChecked || isFollowing === null) {
    return null;
  }

  return (
    <FollowButton
      userId={ownerUserId}
      initialIsFollowing={isFollowing}
      onFollowChange={setIsFollowing}
    />
  );
}
