'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconMusic, IconUsers } from '@tabler/icons-react';
import { Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, FollowingFeedItem, Review } from '@/lib/api';
import styles from './FollowingFeed.module.css';

interface FollowingFeedProps {
  /** Title to display above the feed */
  title?: string;
  /** Initial feed items from dashboard endpoint */
  initialFeedItems?: FollowingFeedItem[];
}

// Convert FollowingFeedItem to Review format for ReviewCard
function feedItemToReview(item: FollowingFeedItem): Review {
  return {
    id: item.id,
    song_name: item.song_name,
    band_name: item.band_name,
    artwork_url: item.artwork_url || '',
    song_link: item.song_link || '',
    review_text: item.review_text,
    liked_aspects: item.liked_aspects || [],
    created_at: item.created_at,
    updated_at: item.created_at,
    author: item.author,
    band: item.band,
    likes_count: item.likes_count,
    liked_by_current_user: item.liked_by_current_user,
    comments_count: item.comments_count,
  };
}

export function FollowingFeed({ title = 'Following Feed', initialFeedItems }: FollowingFeedProps) {
  const [feedItems, setFeedItems] = useState<FollowingFeedItem[]>(initialFeedItems || []);
  const [isLoading, setIsLoading] = useState(!initialFeedItems);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialFeedItems ? initialFeedItems.length >= 5 : false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (page: number, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await apiClient.getFollowingFeed(page);
      const reviews = response?.reviews || [];
      if (append) {
        setFeedItems((prev) => {
          const ids = new Set(prev.map((r) => r.id));
          return [...prev, ...reviews.filter((r) => !ids.has(r.id))];
        });
      } else {
        setFeedItems(reviews);
      }
      // Handle both 'meta' and 'pagination' response structures
      const pagination = (response as any)?.meta || (response as any)?.pagination;
      const currentPageNum = pagination?.current_page || 1;
      const totalPagesNum = pagination?.total_pages || 1;
      const hasNext = pagination?.has_next_page ?? currentPageNum < totalPagesNum;
      setCurrentPage(currentPageNum);
      setHasNextPage(hasNext);
    } catch (error) {
      console.error('Failed to fetch following feed:', error);
      setFeedItems([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Only fetch on mount if no initial items provided
  useEffect(() => {
    if (!initialFeedItems) {
      fetchFeed(1);
    }
  }, [fetchFeed, initialFeedItems]);

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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Title order={2} mb="sm" c="blue.8" fw={500}>
          {title}
        </Title>
        <Center py="xl">
          <Loader size="md" />
        </Center>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className={styles.container}>
        <Title order={2} mb="sm" c="blue.8" fw={500}>
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
      <Title order={2} mb="sm" c="blue.8" fw={500}>
        {title}
      </Title>
      <Stack gap={0}>
        {feedItems.map((item) => (
          <ReviewCard key={item.id} review={feedItemToReview(item)} />
        ))}

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
