import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IconAlertCircle } from '@tabler/icons-react';
import { Alert, Container, Flex, Title } from '@mantine/core';
import { Header } from '@/components/Header/Header';
import { UserProfileSidebar } from '@/components/UserProfileSidebar/UserProfileSidebar';
import { UserReviewsList } from '@/components/UserReviewsList/UserReviewsList';
import { UserProfile } from '@/lib/api';
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
    const reviewsCount = profile.reviews?.length ?? profile.reviews_count ?? 0;
    return {
      title: `@${profile.username} - Goodsongs`,
      description: `View @${profile.username}'s music recommendations on Goodsongs. ${reviewsCount} recommendation${reviewsCount !== 1 ? 's' : ''} shared.`,
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
        <Header showBackButton />
        <Flex className={styles.content}>
          {/* User Sidebar */}
          <UserProfileSidebar profile={profile} />

          {/* Recommendations Section */}
          <Flex direction="column" px="md" pb="lg" w="100%" maw={700}>
            <Title order={2} my="sm" c="blue.8" fw={500}>
              Recommendations
            </Title>

            <UserReviewsList profile={profile} initialReviews={profile.reviews || []} />
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
