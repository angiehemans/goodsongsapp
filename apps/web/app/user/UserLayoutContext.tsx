'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Review } from '@/lib/api';

interface UserLayoutContextType {
  reviews: Review[];
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  isDataLoading: boolean;
  refreshReviews: () => Promise<void>;
  refreshFollowCounts: () => Promise<void>;
}

const UserLayoutContext = createContext<UserLayoutContextType | null>(null);

export function useUserLayout() {
  const context = useContext(UserLayoutContext);
  if (!context) {
    throw new Error('useUserLayout must be used within UserLayoutProvider');
  }
  return context;
}

interface UserLayoutProviderProps {
  children: ReactNode;
}

export function UserLayoutProvider({ children }: UserLayoutProviderProps) {
  const { user, isLoading, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Auth redirects
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && isBand) {
      router.push('/user/band-dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isBand, router]);

  const refreshReviews = useCallback(async () => {
    if (!user) return;
    try {
      const userReviews = await apiClient.getUserReviews();
      setReviews(userReviews);
    } catch {
      setReviews([]);
    }
  }, [user]);

  const refreshFollowCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [followers, following] = await Promise.all([
        apiClient.getFollowers(),
        apiClient.getFollowing(),
      ]);
      setFollowersCount(followers.length);
      setFollowingCount(following.length);
    } catch {
      // Silently fail
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!user || isLoading) return;
      setIsDataLoading(true);
      await Promise.all([refreshReviews(), refreshFollowCounts()]);
      setIsDataLoading(false);
    };
    fetchData();
  }, [user, isLoading, refreshReviews, refreshFollowCounts]);

  return (
    <UserLayoutContext.Provider
      value={{
        reviews,
        reviewsCount: reviews.length,
        followersCount,
        followingCount,
        isDataLoading,
        refreshReviews,
        refreshFollowCounts,
      }}
    >
      {children}
    </UserLayoutContext.Provider>
  );
}
