'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconMusic, IconUsers } from '@tabler/icons-react';
import { Button, Center, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, FollowingFeedItem, Review } from '@/lib/api';
import styles from './FollowingFeed.module.css';

interface FollowingFeedProps {
  /** Title to display above the feed */
  title?: string;
  /** Maximum number of items to show initially */
  initialLimit?: number;
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
  };
}

export function FollowingFeed({ title = 'Following Feed', initialLimit = 10 }: FollowingFeedProps) {
  const [feedItems, setFeedItems] = useState<FollowingFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
        setFeedItems((prev) => [...prev, ...reviews]);
      } else {
        setFeedItems(reviews);
      }
      setCurrentPage(response?.meta?.current_page || 1);
      setTotalPages(response?.meta?.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch following feed:', error);
      // Don't show error notification for empty feed - just set empty state
      setFeedItems([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchFeed(currentPage + 1, true);
    }
  };

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
      <Stack>
        {feedItems.slice(0, initialLimit).map((item) => (
          <ReviewCard key={item.id} review={feedItemToReview(item)} />
        ))}

        {feedItems.length > initialLimit && (
          <Stack>
            {feedItems.slice(initialLimit).map((item) => (
              <ReviewCard key={item.id} review={feedItemToReview(item)} />
            ))}
          </Stack>
        )}

        {currentPage < totalPages && (
          <Center>
            <Button onClick={handleLoadMore} loading={isLoadingMore} variant="light">
              Load More
            </Button>
          </Center>
        )}
      </Stack>
    </div>
  );
}
