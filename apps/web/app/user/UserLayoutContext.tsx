'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  apiClient,
  Review,
  FanDashboardResponse,
  FanDashboardRecentlyPlayed,
  FanDashboardFeedItem,
  RecentlyPlayedTrack,
  FollowingFeedItem,
} from '@/lib/api';

interface UserLayoutContextType {
  reviews: Review[];
  reviewsCount: number;
  followersCount: number;
  followingCount: number;
  isDataLoading: boolean;
  refreshReviews: () => Promise<void>;
  refreshFollowCounts: () => Promise<void>;
  // Dashboard data for child components
  dashboardData: FanDashboardResponse | null;
  recentlyPlayedTracks: RecentlyPlayedTrack[];
  followingFeedItems: FollowingFeedItem[];
  unreadNotificationsCount: number;
  refreshDashboard: () => Promise<void>;
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

// Convert dashboard recently played to RecentlyPlayedTrack format
function convertRecentlyPlayed(tracks: FanDashboardRecentlyPlayed[]): RecentlyPlayedTrack[] {
  return tracks.map((track) => ({
    name: track.name,
    artist: track.artist,
    album: track.album || '',
    played_at: track.played_at,
    now_playing: track.now_playing,
    source: track.source,
    album_art_url: track.album_art_url || null,
    loved: false,
    scrobble_id: track.scrobble_id,
    metadata_status: track.metadata_status,
    has_preferred_artwork: track.has_preferred_artwork,
    can_refresh_artwork: track.can_refresh_artwork,
  }));
}

// Convert dashboard feed preview to FollowingFeedItem format
function convertFeedItems(items: FanDashboardFeedItem[]): FollowingFeedItem[] {
  return items.map((item) => ({
    id: item.id,
    song_name: item.song_name,
    band_name: item.band_name,
    artwork_url: item.artwork_url,
    review_text: item.review_text,
    created_at: item.created_at,
    likes_count: item.likes_count,
    liked_by_current_user: item.liked_by_current_user,
    comments_count: item.comments_count,
    author: item.author,
  }));
}

export function UserLayoutProvider({ children }: UserLayoutProviderProps) {
  const { user, isLoading, isOnboardingComplete, isBand, isBlogger } = useAuth();
  const { setInitialCount: setNotificationInitialCount } = useNotifications();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<FanDashboardResponse | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<RecentlyPlayedTrack[]>([]);
  const [followingFeedItems, setFollowingFeedItems] = useState<FollowingFeedItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
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

    // Band users should be redirected to band dashboard
    // Bloggers stay on fan-style dashboard (blogger-dashboard)
    if (!isLoading && user && isBand && !isBlogger) {
      router.push('/user/band-dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isBand, isBlogger, router]);

  // Fetch dashboard data (single optimized endpoint)
  const refreshDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiClient.getFanDashboard();
      setDashboardData(data);
      setFollowersCount(data.profile.followers_count);
      setFollowingCount(data.profile.following_count);
      setUnreadNotificationsCount(data.unread_notifications_count);
      // Set notification count in the notification context
      setNotificationInitialCount(data.unread_notifications_count);
      setRecentlyPlayedTracks(convertRecentlyPlayed(data.recently_played));
      setFollowingFeedItems(convertFeedItems(data.following_feed_preview));
      // Convert recent_reviews to Review format for sidebar
      setReviews(data.recent_reviews.map((r) => ({
        id: r.id,
        song_name: r.song_name,
        band_name: r.band_name,
        artwork_url: r.artwork_url || '',
        created_at: r.created_at,
        likes_count: r.likes_count,
        comments_count: r.comments_count,
      } as Review)));
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  }, [user, setNotificationInitialCount]);

  // Keep these for backwards compatibility (they now just refresh the dashboard)
  const refreshReviews = useCallback(async () => {
    await refreshDashboard();
  }, [refreshDashboard]);

  const refreshFollowCounts = useCallback(async () => {
    await refreshDashboard();
  }, [refreshDashboard]);

  // Initial data fetch using optimized dashboard endpoint
  // Bloggers use the same dashboard data as fans
  useEffect(() => {
    const fetchData = async () => {
      if (!user || isLoading || (isBand && !isBlogger)) return;
      setIsDataLoading(true);
      await refreshDashboard();
      setIsDataLoading(false);
    };
    fetchData();
  }, [user, isLoading, isBand, isBlogger, refreshDashboard]);

  return (
    <UserLayoutContext.Provider
      value={{
        reviews,
        reviewsCount: dashboardData?.profile.reviews_count ?? reviews.length,
        followersCount,
        followingCount,
        isDataLoading,
        refreshReviews,
        refreshFollowCounts,
        dashboardData,
        recentlyPlayedTracks,
        followingFeedItems,
        unreadNotificationsCount,
        refreshDashboard,
      }}
    >
      {children}
    </UserLayoutContext.Provider>
  );
}
