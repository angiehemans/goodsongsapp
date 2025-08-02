'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Button,
  Paper,
  Group,
  Stack,
  Avatar,
  Card,
  Grid,
  Badge,
  Center,
  Loader,
  Rating,
  Divider,
} from '@mantine/core';
import { IconMusic, IconPlaylist, IconUsers, IconLogout, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { apiClient, Band, Review } from '@/lib/api';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [bands, setBands] = useState<Band[]>([]);
  const [bandsLoading, setBandsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchBands = async () => {
      if (!user) return;
      
      try {
        setBandsLoading(true);
        const userBands = await apiClient.getUserBands();
        setBands(userBands);
      } catch (error) {
        console.error('Failed to fetch bands:', error);
        notifications.show({
          title: 'Error loading bands',
          message: 'Could not load your bands. Please try again.',
          color: 'red',
        });
      } finally {
        setBandsLoading(false);
      }
    };

    if (user) {
      fetchBands();
    }
  }, [user]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      
      try {
        setReviewsLoading(true);
        const userReviews = await apiClient.getUserReviews();
        setReviews(userReviews);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        // Silently fail for now since this endpoint might not exist yet
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (user) {
      fetchReviews();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

  if (isLoading) {
    return (
      <Container>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container size="lg" py="xl">
      <Stack>
        {/* Header */}
        <Paper p="lg" radius="md">
          <Group justify="space-between">
            <Group>
              <Avatar 
                size="lg" 
                color="grape.6"
                component={Link}
                href={`/users/${user.username}`}
                style={{ cursor: 'pointer' }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Title order={2}>Welcome back, {user.username}!</Title>
                <Text size="sm" c="dimmed">{user.email}</Text>
                <Text 
                  size="xs" 
                  c="grape.6" 
                  component={Link} 
                  href={`/users/${user.username}`}
                  style={{ textDecoration: 'none' }}
                >
                  View your profile →
                </Text>
              </div>
            </Group>
            <Button
              leftSection={<IconLogout size={16} />}
              variant="outline"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Paper>

        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="lg" radius="md">
              <Group>
                <IconMusic size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>{reviews.length}</Text>
                  <Text size="sm" c="dimmed">Reviews Written</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="lg" radius="md">
              <Group>
                <IconPlaylist size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>{bands.length}</Text>
                  <Text size="sm" c="dimmed">Bands Created</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="lg" radius="md">
              <Group>
                <IconUsers size={32} color="var(--mantine-color-grape-6)" />
                <div>
                  <Text size="xl" fw={700}>0</Text>
                  <Text size="sm" c="dimmed">Following</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Quick Actions */}
        <Paper p="lg" radius="md">
          <Title order={3} mb="md">Quick Actions</Title>
          <Group>
            <Button component={Link} href="/user/create-review" variant="filled">
              Create Review
            </Button>
            <Button 
              component={Link} 
              href="/user/create-band" 
              variant="filled" 
              color="grape.7"
              leftSection={<IconPlus size={16} />}
            >
              Create Band
            </Button>
            <Button variant="outline">Connect Spotify</Button>
            <Button variant="outline">Discover Music</Button>
          </Group>
        </Paper>

        {/* My Bands */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>My Bands</Title>
            <Button 
              component={Link} 
              href="/user/create-band" 
              size="sm" 
              variant="outline"
              leftSection={<IconPlus size={14} />}
            >
              Add Band
            </Button>
          </Group>
          
          {bandsLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : bands.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No bands yet. Create your first band to showcase your music!
                </Text>
                <Button 
                  component={Link} 
                  href="/user/create-band"
                  leftSection={<IconPlus size={16} />}
                >
                  Create Your First Band
                </Button>
              </Stack>
            </Center>
          ) : (
            <Grid>
              {bands.map((band) => (
                <Grid.Col key={band.id} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card component={Link} href={`/bands/${band.slug}`} p="md" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Group>
                      {band.profile_picture_url ? (
                        <img
                          src={band.profile_picture_url}
                          alt={band.name}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                        />
                      ) : (
                        <Avatar size={48} color="grape.6">
                          {band.name.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      <Stack gap="xs" flex={1}>
                        <Title order={5}>{band.name}</Title>
                        <Group gap="xs">
                          <Badge size="sm" variant="light" color="grape">
                            {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''}
                          </Badge>
                          {band.location && (
                            <Text size="xs" c="dimmed">{band.location}</Text>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Paper>

        {/* Recent Reviews */}
        <Paper p="lg" radius="md">
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>Recent Reviews</Title>
            <Button 
              component={Link} 
              href="/user/create-review" 
              size="sm" 
              variant="outline"
              leftSection={<IconPlus size={14} />}
            >
              Write Review
            </Button>
          </Group>
          
          {reviewsLoading ? (
            <Center py="md">
              <Loader size="sm" />
            </Center>
          ) : reviews.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No reviews yet. Share your thoughts about your favorite songs!
                </Text>
                <Button 
                  component={Link} 
                  href="/user/create-review"
                  leftSection={<IconPlus size={16} />}
                >
                  Write Your First Review
                </Button>
              </Stack>
            </Center>
          ) : (
            <Stack>
              {reviews.slice(0, 5).map((review) => (
                <Card key={review.id} p="md">
                  <Group justify="space-between" align="flex-start">
                    <Group>
                      {review.artwork_url && (
                        <img
                          src={review.artwork_url}
                          alt={`${review.song_name} artwork`}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                        />
                      )}
                      <Stack gap="xs">
                        <div>
                          <Title order={5}>{review.song_name}</Title>
                          <Text size="sm" c="dimmed">{review.band_name}</Text>
                        </div>
                        <Text size="sm" lineClamp={2}>
                          {review.review_text}
                        </Text>
                        {review.liked_aspects.length > 0 && (
                          <Group gap="xs">
                            {review.liked_aspects.slice(0, 3).map((aspect, index) => (
                              <Badge key={index} size="sm" variant="light" color="grape">
                                {aspect}
                              </Badge>
                            ))}
                            {review.liked_aspects.length > 3 && (
                              <Text size="xs" c="dimmed">+{review.liked_aspects.length - 3} more</Text>
                            )}
                          </Group>
                        )}
                      </Stack>
                    </Group>
                    <Group align="center" gap="xs">
                      <Rating value={review.overall_rating} readOnly size="sm" />
                      <Text size="sm" c="dimmed">
                        {review.overall_rating}/5
                      </Text>
                    </Group>
                  </Group>
                </Card>
              ))}
              
              {reviews.length > 5 && (
                <>
                  <Divider />
                  <Group justify="center">
                    <Text size="sm" c="dimmed">
                      Showing 5 of {reviews.length} reviews
                    </Text>
                    <Button 
                      component={Link} 
                      href={`/users/${user?.username}`}
                      variant="subtle" 
                      size="sm"
                    >
                      View All Reviews
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
