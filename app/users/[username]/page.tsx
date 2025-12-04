import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconAlertCircle, IconMusic } from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Center,
  Container,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { Review, UserProfile } from '@/lib/api';
import styles from './page.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await getUserProfile(username);
    if (!profile) {
      return {
        title: 'User Not Found - Goodsongs',
        description: 'The requested user profile could not be found.',
      };
    }
    return {
      title: `@${profile.username} - Goodsongs`,
      description: `View @${profile.username}'s music recommendations on Goodsongs. ${profile.reviews.length} recommendation${profile.reviews.length !== 1 ? 's' : ''} shared.`,
    };
  } catch {
    return {
      title: 'User Not Found - Goodsongs',
      description: 'The requested user profile could not be found.',
    };
  }
}

async function getUserProfile(username: string): Promise<UserProfile | null> {
  // For server components, we need to use the full URL to the Next.js API route
  const baseUrl =
    process.env.NODE_ENV === 'production'
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
      return null;
    }
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let profile: UserProfile | null;

  try {
    profile = await getUserProfile(username);
  } catch (error) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="xl">
          Failed to load profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    notFound();
  }

  return (
    <>
      {/* Main Content */}
      <Container p={0} fluid className={styles.container}>
        <Container fluid p="md" className={styles.header}>
          <Container size="md" p={0}>
            <Link href="/user/dashboard" className={styles.headerLink}>
              <Title order={2} c="blue.9">
                goodsongs
              </Title>
            </Link>
          </Container>
        </Container>
        <Flex className={styles.content}>
          {/* User Header */}
          <Flex p="md" miw={300} direction="column" gap="sm" className={styles.userBackground}>
            <Group align="center">
              <ProfilePhoto
                src={profile.profile_image_url}
                alt={profile.username}
                size={72}
                fallback={profile.username}
              />
              <Stack gap="xs" flex={1}>
                <Title order={2} c="blue.8" fw={500} lh={1}>
                  @{profile.username}
                </Title>
                {(profile.city || profile.region || profile.location) && (
                  <Text c="blue.7" size="sm" lh={1}>
                    {profile.city || profile.region
                      ? [profile.city, profile.region].filter(Boolean).join(', ')
                      : profile.location}
                  </Text>
                )}
              </Stack>
            </Group>
            {profile.about_me && (
              <Text c="gray.7" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {profile.about_me}
              </Text>
            )}
            <Group gap="xs">
              <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
                {profile.reviews.length} recommendation{profile.reviews.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
          </Flex>

          {/* Recommendations Section */}
          <Flex direction="column" px="md" pb="lg">
            <Title order={2} my="sm" c="blue.8" fw={500}>
              Recommendations
            </Title>

            {profile.reviews.length === 0 ? (
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
            ) : (
              <Stack>
                {profile.reviews.map((review: Review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </Stack>
            )}
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
