import {
  Container,
  Title,
  Text,
  Stack,
  Avatar,
  Paper,
  Group,
  Card,
  Rating,
  Badge,
  Divider,
  Alert,
  Center,
} from '@mantine/core';
import { IconAlertCircle, IconCalendar, IconMusic } from '@tabler/icons-react';
import { UserProfile, Review } from '@/lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { fixImageUrl } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  
  try {
    const profile = await getUserProfile(username);
    return {
      title: `@${profile.username} - Goodsongs`,
      description: `View @${profile.username}'s music reviews on Goodsongs. ${profile.reviews.length} review${profile.reviews.length !== 1 ? 's' : ''} shared.`,
    };
  } catch {
    return {
      title: 'User Not Found - Goodsongs',
      description: 'The requested user profile could not be found.',
    };
  }
}

async function getUserProfile(username: string): Promise<UserProfile> {
  try {
    // For server components, we need to use the full URL to the Next.js API route
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://www.goodsongs.app'
      : 'http://localhost:3001';
      
    const response = await fetch(`${baseUrl}/api/users/${username}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  
  let profile: UserProfile;
  
  try {
    profile = await getUserProfile(username);
  } catch (error) {
    return (
      <Container>
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Error" 
          color="red" 
          mt="xl"
        >
          Failed to load profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container size="md" py="xl">
      <Stack>
        {/* User Header */}
        <Paper p="lg" radius="md">
          <Group align="flex-start">
            <Avatar 
              size="xl" 
              src={fixImageUrl(profile.profile_image_url)}
              color="grape.6"
            >
              {!profile.profile_image_url && profile.username.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap="xs" flex={1}>
              <Title order={1}>@{profile.username}</Title>
              <Group gap="xs">
                <IconMusic size={16} />
                <Text c="dimmed">
                  {profile.reviews.length} review{profile.reviews.length !== 1 ? 's' : ''}
                </Text>
              </Group>
              {profile.about_me && (
                <Text mt="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {profile.about_me}
                </Text>
              )}
            </Stack>
          </Group>
        </Paper>

        {/* Reviews Section */}
        <div>
          <Title order={2} mb="md">Reviews</Title>
          
          {profile.reviews.length === 0 ? (
            <Paper p="lg" radius="md">
              <Center py="xl">
                <Stack align="center">
                  <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                  <Text c="dimmed" ta="center">
                    @{profile.username} hasn't written any reviews yet.
                  </Text>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Stack>
              {profile.reviews.map((review: Review) => (
                <Card key={review.id} p="lg" radius="md">
                  <Stack>
                    {/* Song Info */}
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs">
                        <Group>
                          {review.artwork_url && (
                            <img 
                              src={review.artwork_url} 
                              alt={`${review.song_name} artwork`}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                            />
                          )}
                          <div>
                            <Title order={4}>{review.song_name}</Title>
                            <Text size="sm" c="dimmed">{review.band_name}</Text>
                          </div>
                        </Group>
                      </Stack>
                      <Group align="center" gap="xs">
                        <Rating value={review.overall_rating} readOnly size="sm" />
                        <Text size="sm" c="dimmed">
                          {review.overall_rating}/5
                        </Text>
                      </Group>
                    </Group>

                    <Divider />

                    {/* Review Text */}
                    <Text>{review.review_text}</Text>

                    {/* Liked Aspects */}
                    {review.liked_aspects.length > 0 && (
                      <Group>
                        <Text size="sm" fw={500}>Liked:</Text>
                        <Group gap="xs">
                          {review.liked_aspects.map((aspect, index) => (
                            <Badge key={index} variant="light" color="grape">
                              {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                            </Badge>
                          ))}
                        </Group>
                      </Group>
                    )}

                    {/* Date */}
                    <Group justify="flex-end">
                      <Group gap="xs">
                        <IconCalendar size={14} />
                        <Text size="xs" c="dimmed">
                          {formatDate(review.created_at)}
                        </Text>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </div>
      </Stack>
    </Container>
  );
}