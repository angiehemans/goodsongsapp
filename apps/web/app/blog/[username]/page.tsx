import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { IconCalendar, IconHeart, IconMessage, IconStar } from '@tabler/icons-react';
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Card,
  CardSection,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Logo } from '@/components/Logo';
import { PublicBlogPost, UserProfile } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getBlogProfile(username: string): Promise<UserProfile | null> {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.goodsongs.app'
      : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/blogs/${username}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch blog profile');
  }

  return response.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    const profile = await getBlogProfile(username);
    if (!profile) {
      return {
        title: 'Blog Not Found - Goodsongs',
        description: 'The requested blog could not be found.',
      };
    }

    const displayName = profile.display_name || profile.username;
    const postsCount = profile.posts?.length || 0;

    return {
      title: `${displayName}'s Blog - Goodsongs`,
      description: `Read blog posts by ${displayName} on Goodsongs. ${postsCount} post${postsCount !== 1 ? 's' : ''} published.`,
    };
  } catch {
    return {
      title: 'Blog Not Found - Goodsongs',
      description: 'The requested blog could not be found.',
    };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BlogPage({ params }: PageProps) {
  const { username } = await params;

  let profile: UserProfile | null;

  try {
    profile = await getBlogProfile(username);
  } catch {
    notFound();
  }

  if (!profile) {
    notFound();
  }

  const posts = profile.posts || [];
  const displayName = profile.display_name || profile.username;

  return (
    <>
      <Container size="lg" py="xl" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Stack gap="xl">
          {/* Blog header */}
          <Group gap="md">
            <Avatar
              src={fixImageUrl(profile.profile_image_url)}
              alt={displayName}
              size="lg"
              radius="xl"
            />
            <div>
              <Title order={2} style={{ color: 'var(--gs-text-heading)' }}>
                {displayName}&apos;s Blog
              </Title>
              <Text size="sm" c="dimmed">
                @{profile.username}
              </Text>
            </div>
          </Group>

          {/* About section */}
          {profile.about_me && (
            <Text size="sm" c="dimmed">
              {profile.about_me}
            </Text>
          )}

          {/* Posts grid */}
          {posts.length === 0 ? (
            <Box py="xl">
              <Text c="dimmed" ta="center">
                No posts published yet.
              </Text>
            </Box>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
              {posts.map((post: PublicBlogPost) => (
                <Card
                  key={post.id}
                  component={Link}
                  href={`/blog/${username}/${post.slug}`}
                  padding="lg"
                  radius="md"
                  withBorder
                  style={{ textDecoration: 'none' }}
                >
                  {post.featured_image_url && (
                    <CardSection>
                      <Image
                        src={fixImageUrl(post.featured_image_url)}
                        alt={post.title}
                        height={160}
                        fit="cover"
                      />
                    </CardSection>
                  )}

                  <Stack gap="sm" mt={post.featured_image_url ? 'md' : 0}>
                    <Group gap="xs">
                      {post.featured && (
                        <IconStar size={14} color="var(--mantine-color-yellow-6)" />
                      )}
                      <Title order={4} lineClamp={2} style={{ color: 'var(--gs-text-heading)' }}>
                        {post.title}
                      </Title>
                    </Group>

                    {post.excerpt && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {post.excerpt}
                      </Text>
                    )}

                    <Group gap="md">
                      <Group gap="xs">
                        <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                        <Text size="xs" c="dimmed">
                          {formatDate(post.publish_date)}
                        </Text>
                      </Group>
                      {(post.comments_count ?? 0) > 0 && (
                        <Group gap={4}>
                          <IconMessage size={14} color="var(--mantine-color-dimmed)" />
                          <Text size="xs" c="dimmed">
                            {post.comments_count}
                          </Text>
                        </Group>
                      )}
                      {(post.likes_count ?? 0) > 0 && (
                        <Group gap={4}>
                          <IconHeart size={14} color="var(--mantine-color-dimmed)" />
                          <Text size="xs" c="dimmed">
                            {post.likes_count}
                          </Text>
                        </Group>
                      )}
                    </Group>

                    {post.tags.length > 0 && (
                      <Group gap="xs">
                        {post.tags.slice(0, 3).map((t) => (
                          <Badge key={t} variant="light" color="grape" size="xs">
                            {t}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Text size="xs" c="dimmed">
                            +{post.tags.length - 3}
                          </Text>
                        )}
                      </Group>
                    )}
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Container>

      {/* Footer */}
      <Box py="xl" style={{ borderTop: '1px solid var(--gs-border-default)' }}>
        <Container size="lg">
          <Group justify="center" gap="xs">
            <Anchor
              href="https://goodsongs.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'white', textDecoration: 'none' }}
            >
              <Group gap="xs">
                <Text size="sm">built with</Text>
                <Logo size={18} />
                <Text size="sm" fw={500}>
                  goodsongs
                </Text>
              </Group>
            </Anchor>
          </Group>
        </Container>
      </Box>
    </>
  );
}
