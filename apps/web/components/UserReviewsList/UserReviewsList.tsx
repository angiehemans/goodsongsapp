'use client';

import { useEffect, useState } from 'react';
import { IconMusic } from '@tabler/icons-react';
import { Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { apiClient, Review, UserProfile } from '@/lib/api';

interface UserReviewsListProps {
  profile: UserProfile;
  initialReviews: Review[];
}

export function UserReviewsList({ profile, initialReviews }: UserReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // On mount, if user is authenticated, re-fetch the profile to get accurate like status
  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token && initialReviews.length > 0) {
      setIsRefreshing(true);
      apiClient
        .getUserProfile(profile.username)
        .then((freshProfile) => {
          if (freshProfile.reviews) {
            setReviews(freshProfile.reviews);
          }
        })
        .catch((error) => {
          console.error('Failed to refresh reviews with auth:', error);
          // Keep the initial reviews if refresh fails
        })
        .finally(() => {
          setIsRefreshing(false);
        });
    }
  }, [profile.username, initialReviews.length]);

  if (reviews.length === 0) {
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
    <Stack>
      {isRefreshing && (
        <Center>
          <Loader size="sm" />
        </Center>
      )}
      {reviews.map((review: Review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </Stack>
  );
}
