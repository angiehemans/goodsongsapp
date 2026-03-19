'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconMusic, IconUsers } from '@tabler/icons-react';
import { Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { FeedEventCard } from '@/components/FeedEventCard/FeedEventCard';
import { FeedPostCard } from '@/components/FeedPostCard/FeedPostCard';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, FollowingFeedEntry, Review } from '@/lib/api';
import styles from './FollowingFeed.module.css';

interface FollowingFeedProps {
  /** Title to display above the feed */
  title?: string;
  /** Initial feed entries from dashboard endpoint */
  initialFeedEntries?: FollowingFeedEntry[];
}

// Convert FollowingFeedItem to Review format for ReviewCard
function feedItemToReview(item: FollowingFeedEntry & { type: 'review' }): Review {
  const data = item.data;
  return {
    id: data.id,
    song_name: data.song_name,
    band_name: data.band_name,
    artwork_url: data.artwork_url || '',
    song_link: data.song_link || '',
    review_text: data.review_text,
    formatted_review_text: data.formatted_review_text,
    mentions: data.mentions,
    liked_aspects: data.liked_aspects || [],
    created_at: data.created_at,
    updated_at: data.created_at,
    author: data.author,
    band: data.band,
    likes_count: data.likes_count,
    liked_by_current_user: data.liked_by_current_user,
    comments_count: data.comments_count,
    track: data.track,
  } as Review;
}

export function FollowingFeed({ title = 'Following Feed', initialFeedEntries }: FollowingFeedProps) {
  const [feedEntries, setFeedEntries] = useState<FollowingFeedEntry[]>(initialFeedEntries || []);
  const [isLoading, setIsLoading] = useState(!initialFeedEntries);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialFeedEntries ? initialFeedEntries.length >= 5 : false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (page: number, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await apiClient.getFollowingFeed(page);
      const entries = response?.feed_items || [];
      if (append) {
        setFeedEntries((prev) => {
          const keys = new Set(prev.map((e) => `${e.type}-${e.data.id}`));
          return [...prev, ...entries.filter((e) => !keys.has(`${e.type}-${e.data.id}`))];
        });
      } else {
        setFeedEntries(entries);
      }
      const pagination = response?.pagination;
      setCurrentPage(pagination?.current_page || 1);
      setHasNextPage(pagination?.has_next_page ?? false);
    } catch (error) {
      console.error('Failed to fetch following feed:', error);
      setFeedEntries([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Only fetch on mount if no initial entries provided
  useEffect(() => {
    if (!initialFeedEntries) {
      fetchFeed(1);
    }
  }, [fetchFeed, initialFeedEntries]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoadingMore) {
      fetchFeed(currentPage + 1, true);
    }
  }, [hasNextPage, isLoadingMore, currentPage, fetchFeed]);

  // Infinite scroll via IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            handleLoadMore();
          }
        },
        { rootMargin: '200px' }
      );
      observerRef.current.observe(node);
    },
    [handleLoadMore]
  );

  const renderFeedEntry = (entry: FollowingFeedEntry, index: number) => {
    switch (entry.type) {
      case 'review':
        return <ReviewCard key={`review-${entry.data.id}`} review={feedItemToReview(entry)} />;
      case 'event':
        return <FeedEventCard key={`event-${entry.data.id}`} event={entry.data} />;
      case 'post':
        return <FeedPostCard key={`post-${entry.data.id}`} post={entry.data} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Title order={2} mb="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
          {title}
        </Title>
        <Center py="xl">
          <Loader size="md" />
        </Center>
      </div>
    );
  }

  if (feedEntries.length === 0) {
    return (
      <div className={styles.container}>
        <Title order={2} mb="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
          {title}
        </Title>
        <Paper p="lg" radius="md">
          <Center py="xl">
            <Stack align="center">
              <IconUsers size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center" maw={400}>
                Your feed is empty. Follow other users to see their recommendations here!
              </Text>
              <Button component={Link} href="/discover" variant="light">
                Discover Users
              </Button>
            </Stack>
          </Center>
        </Paper>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Title order={2} mb="sm" style={{ color: 'var(--gs-text-heading)' }} fw={500}>
        {title}
      </Title>
      <Stack gap={0}>
        {feedEntries.map((entry, index) => renderFeedEntry(entry, index))}

        {hasNextPage && (
          <div ref={sentinelRef}>
            <Center py="md">
              <Loader size="sm" />
            </Center>
          </div>
        )}
      </Stack>
    </div>
  );
}
