'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconMusic,
} from '@tabler/icons-react';
import {
  Avatar,
  Badge,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { useAuth } from '@/hooks/useAuth';
import { AdminUserDetail, apiClient, Review } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

export default function AdminUserDetailPage() {
  const { user, isLoading, isOnboardingComplete, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userProfile, setUserProfile] = useState<AdminUserDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && !isAdmin) {
      router.push('/user/dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isAdmin, router]);

  const fetchUserData = useCallback(async () => {
    if (!user || !isAdmin || !userId) return;

    setDataLoading(true);
    setError(null);

    try {
      // Fetch user details and reviews via admin endpoint
      const data = await apiClient.getAdminUserDetail(parseInt(userId, 10));
      setUserProfile(data.user);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load user data. The admin endpoint may not be available.');
    } finally {
      setDataLoading(false);
    }
  }, [user, isAdmin, userId]);

  useEffect(() => {
    if (user && isAdmin && isOnboardingComplete && userId) {
      fetchUserData();
    }
  }, [user, isAdmin, isOnboardingComplete, userId, fetchUserData]);

  if (isLoading) {
    return (
      <Container>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Back Button */}
        <Button
          component={Link}
          href="/admin"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          w="fit-content"
        >
          Back to Admin Dashboard
        </Button>

        {dataLoading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : error ? (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <Text c="red" ta="center">
                  {error}
                </Text>
                <Button onClick={fetchUserData}>Retry</Button>
              </Stack>
            </Center>
          </Paper>
        ) : userProfile ? (
          <>
            {/* User Header */}
            <Paper p="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Group>
                  <Avatar
                    size="xl"
                    src={fixImageUrl(userProfile.profile_image_url)}
                    color="grape"
                  >
                    {userProfile.username?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Stack gap="xs">
                    <Title order={2}>
                      {userProfile.username || 'No username'}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {userProfile.email}
                    </Text>
                    {userProfile.about_me && (
                      <Text size="sm" lineClamp={2}>
                        {userProfile.about_me}
                      </Text>
                    )}
                  </Stack>
                </Group>
                <Stack align="flex-end" gap="xs">
                  <Badge color="grape" size="lg">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </Badge>
                  {userProfile.username && (
                    <Button
                      component={Link}
                      href={`/users/${userProfile.username}`}
                      variant="light"
                      size="xs"
                    >
                      View Public Profile
                    </Button>
                  )}
                </Stack>
              </Group>
            </Paper>

            {/* Reviews Section */}
            <Paper p="lg" radius="md">
              <Title order={3} mb="md">
                User Reviews ({reviews.length})
              </Title>

              {reviews.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <IconMusic size={48} color="var(--mantine-color-gray-5)" />
                    <Text c="dimmed" ta="center">
                      This user hasn't written any reviews yet.
                    </Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="md">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </Stack>
              )}
            </Paper>
          </>
        ) : (
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Text c="dimmed">User not found.</Text>
            </Center>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
