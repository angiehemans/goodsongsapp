import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCalendar,
  IconEdit,
  IconExternalLink,
  IconMusic,
  IconPlayerPlay,
  IconShare,
  IconTag,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Center,
  Container,
  Group,
  Image,
  Menu,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { PublicBlogPost } from '@/lib/api';
import { STREAMING_PLATFORMS, StreamingLinks, StreamingPlatform } from '@/lib/streaming';
import { fixImageUrl } from '@/lib/utils';
import { PostCommentsSection } from '@/components/PostComments';
import { Logo } from '@/components/Logo';
import { PostLikeButton } from '@/components/Posts/PostLikeButton';

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

async function getBlogPost(username: string, slug: string): Promise<PublicBlogPost | null> {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_API_URL || 'https://api.goodsongs.app'
      : 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/blogs/${username}/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch blog post');
  }

  return response.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;

  try {
    const post = await getBlogPost(username, slug);
    if (!post) {
      return {
        title: 'Post Not Found - Goodsongs',
        description: 'The requested blog post could not be found.',
      };
    }

    return {
      title: `${post.title} - ${post.author.display_name} - Goodsongs`,
      description: post.excerpt || `Read ${post.title} by ${post.author.display_name} on Goodsongs.`,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.featured_image_url ? [post.featured_image_url] : undefined,
      },
    };
  } catch {
    return {
      title: 'Post Not Found - Goodsongs',
      description: 'The requested blog post could not be found.',
    };
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Get available streaming links from the post
function getAvailableStreamingLinks(
  streamingLinks?: StreamingLinks
): Array<{ platform: StreamingPlatform; url: string }> {
  if (!streamingLinks) return [];
  return (Object.entries(streamingLinks) as [StreamingPlatform, string | undefined][])
    .filter(([_, url]) => url)
    .map(([platform, url]) => ({ platform, url: url! }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { username, slug } = await params;

  let post: PublicBlogPost | null;

  try {
    post = await getBlogPost(username, slug);
  } catch {
    notFound();
  }

  if (!post) {
    notFound();
  }

  return (
    <>
      <Container size="md" py="xl" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Stack gap="xl">
          {/* Back link */}
          <Group>
            <ActionIcon
              component={Link}
              href={`/blog/${username}`}
              variant="subtle"
              color="gray"
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              Back to {post.author.display_name}&apos;s blog
            </Text>
          </Group>

          {/* Featured image */}
          {post.featured_image_url && (
            <Box>
              <Image
                src={fixImageUrl(post.featured_image_url)}
                alt={post.title}
                radius="md"
                mah={400}
                fit="cover"
              />
            </Box>
          )}

          {/* Title and meta */}
          <Stack gap="md">
            <Title order={1} style={{ color: 'var(--gs-text-heading)' }}>
              {post.title}
            </Title>

            {/* Author and date */}
            <Group gap="md">
              <Group gap="xs">
                <Avatar
                  src={fixImageUrl(post.author.profile_image_url)}
                  alt={post.author.display_name}
                  size="sm"
                  radius="xl"
                />
                <Link
                  href={`/blog/${post.author.username}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Text size="sm" fw={500}>
                    {post.author.display_name}
                  </Text>
                </Link>
              </Group>

              <Group gap="xs">
                <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  {formatDate(post.publish_date)}
                </Text>
              </Group>

              {post.can_edit && (
                <ActionIcon
                  component={Link}
                  href={`/user/blogger/posts/editor?id=${post.id}`}
                  variant="subtle"
                  color="grape"
                  size="sm"
                >
                  <IconEdit size={16} />
                </ActionIcon>
              )}

              {/* Like Button */}
              <PostLikeButton
                postId={post.id}
                initialLiked={post.liked_by_current_user}
                initialLikesCount={post.likes_count}
                size="sm"
              />
            </Group>

            {/* Tags */}
            {post.tags.length > 0 && (
              <Group gap="xs">
                <IconTag size={14} color="var(--mantine-color-dimmed)" />
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="light" color="grape" size="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>

          {/* Attached Song */}
          {post.song && (
            <Paper p="md" radius="md" withBorder>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                  {post.song.artwork_url ? (
                    <Image
                      src={fixImageUrl(post.song.artwork_url)}
                      w={64}
                      h={64}
                      radius="sm"
                      fit="cover"
                      alt={`${post.song.song_name} artwork`}
                    />
                  ) : (
                    <Center
                      w={64}
                      h={64}
                      style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        backgroundColor: 'var(--gs-bg-accent)',
                      }}
                    >
                      <IconMusic size={32} color="var(--gs-text-muted)" />
                    </Center>
                  )}
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} lineClamp={1}>
                      {post.song.song_name}
                    </Text>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {post.song.band_name}
                    </Text>
                    {post.song.album_name && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {post.song.album_name}
                      </Text>
                    )}
                  </Stack>
                </Group>

                {/* Streaming Links */}
                {(() => {
                  const availableLinks = getAvailableStreamingLinks(post.song.streaming_links);
                  const songLinkUrl = post.song.songlink_url || post.song.song_link;
                  const preferredUrl = post.song.preferred_link;

                  // Show menu if we have multiple streaming platforms
                  if (availableLinks.length > 1) {
                    return (
                      <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="grape" size="lg">
                            <IconPlayerPlay size={24} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Listen on</Menu.Label>
                          {availableLinks.map(({ platform, url }) => (
                            <Menu.Item
                              key={platform}
                              component="a"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              leftSection={
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: STREAMING_PLATFORMS[platform]?.color || '#666',
                                  }}
                                />
                              }
                            >
                              {STREAMING_PLATFORMS[platform]?.name || platform}
                            </Menu.Item>
                          ))}
                          {songLinkUrl && (
                            <>
                              <Menu.Divider />
                              <Menu.Item
                                component="a"
                                href={songLinkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                leftSection={<IconExternalLink size={14} />}
                              >
                                View all platforms
                              </Menu.Item>
                            </>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    );
                  }

                  // Single streaming link or fallback to songlink
                  const singleUrl = preferredUrl || availableLinks[0]?.url || songLinkUrl;
                  if (singleUrl) {
                    return (
                      <ActionIcon
                        component="a"
                        href={singleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="subtle"
                        color="grape"
                        size="lg"
                      >
                        <IconPlayerPlay size={24} />
                      </ActionIcon>
                    );
                  }

                  return null;
                })()}
              </Group>
            </Paper>
          )}

          {/* Post body */}
          {post.body && (
            <Box
              className="prose"
              style={{
                color: 'var(--gs-text-primary)',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          )}

          {/* Authors section if multiple */}
          {post.authors.length > 1 && (
            <Box pt="xl" style={{ borderTop: '1px solid var(--gs-border-default)' }}>
              <Text size="sm" fw={500} mb="xs">
                Authors
              </Text>
              <Group gap="xs">
                {post.authors.map((author, index) => (
                  <Badge key={index} variant="outline" color="gray">
                    {author.url ? (
                      <a
                        href={author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {author.name}
                      </a>
                    ) : (
                      author.name
                    )}
                  </Badge>
                ))}
              </Group>
            </Box>
          )}

          {/* Comments Section */}
          <PostCommentsSection
            postId={post.id}
            initialCommentsCount={post.comments_count}
            allowAnonymous={post.author.allow_anonymous_comments}
          />
        </Stack>
      </Container>

      {/* Footer */}
      <Box py="xl" style={{ borderTop: '1px solid var(--gs-border-default)' }}>
        <Container size="md">
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
