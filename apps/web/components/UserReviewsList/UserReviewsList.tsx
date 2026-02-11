'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { IconMusic } from '@tabler/icons-react';
import useSWR from 'swr';
import { Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, Review, UserProfile } from '@/lib/api';

interface UserReviewsListProps {
  profile: UserProfile;
  initialReviews: Review[];
  initialPagination?: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export function UserReviewsList({
  profile,
  initialReviews,
  initialPagination,
}: UserReviewsListProps) {
  const [page, setPage] = useState(1);
  const [accumulatedReviews, setAccumulatedReviews] = useState<Review[]>(initialReviews);
  const [hasNextPage, setHasNextPage] = useState(initialPagination?.has_next_page ?? false);

  // Fetch paginated reviews
  const { data, isLoading } = useSWR(
    // Only fetch page 2+ via SWR (page 1 comes from initial server data)
    page > 1 ? ['user-reviews', profile.username, page] : null,
    () => apiClient.getUserProfilePaginated(profile.username, page),
    { revalidateOnFocus: false }
  );

  // On mount, if user is authenticated and we have initial reviews, re-fetch page 1
  // to get accurate like status
  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token && initialReviews.length > 0) {
      apiClient
        .getUserProfilePaginated(profile.username, 1)
        .then((freshProfile) => {
          if (freshProfile.reviews) {
            setAccumulatedReviews(freshProfile.reviews);
          }
          if (freshProfile.reviews_pagination) {
            setHasNextPage(freshProfile.reviews_pagination.has_next_page);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh reviews with auth:', error);
        });
    }
  }, [profile.username, initialReviews.length]);

  // Accumulate paginated reviews for pages > 1
  useEffect(() => {
    if (!data?.reviews || !data.reviews_pagination) return;

    const newReviews = data.reviews;
    const pagination = data.reviews_pagination;

    // Only append if this is a page beyond 1
    if (pagination.current_page > 1) {
      setAccumulatedReviews((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...newReviews.filter((r) => !ids.has(r.id))];
      });
    }

    setHasNextPage(pagination.has_next_page);
  }, [data]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      setPage((p) => p + 1);
    }
  }, [hasNextPage, isLoading]);

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

  if (accumulatedReviews.length === 0) {
    return (
      <Paper p="lg" radius="md">
        <Center py="xl">
          <Stack align="center">
            <IconMusic size={48} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" ta="center">
              @{profile.username} hasn't shared any recommendations yet.
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap={0}>
      {accumulatedReviews.map((review: Review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {hasNextPage && (
        <div ref={sentinelRef}>
          <Center py="md">
            <Loader size="sm" />
          </Center>
        </div>
      )}
    </Stack>
  );
}
