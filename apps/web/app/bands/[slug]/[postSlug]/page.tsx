import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCalendar,
  IconMusic,
  IconPlayerPlay,
  IconExternalLink,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Avatar,
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
import { getThemedBandPost } from '@/lib/site-builder/api';
import { ThemedPostPage } from '@/components/SiteBuilder/ThemedPostPage';
import { FontPreload } from '@/components/SiteBuilder/FontPreload';
import { PostCommentsSection } from '@/components/PostComments';
import { PostLikeButton } from '@/components/Posts/PostLikeButton';
import { Logo } from '@/components/Logo';
import { fixImageUrl } from '@/lib/utils';
import { STREAMING_PLATFORMS } from '@/lib/streaming';
import type { StreamingPlatform } from '@/lib/streaming';

interface PageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, postSlug } = await params;

  try {
    const response = await getThemedBandPost(slug, postSlug);
    if (!response) {
      return {
        title: 'Post Not Found - Goodsongs',
        description: 'The requested post could not be found.',
      };
    }

    const { post, user } = response.data;
    return {
      title: `${post.title} - ${user.display_name || user.username} - Goodsongs`,
      description: post.excerpt || `Read ${post.title} on Goodsongs.`,
      openGraph: {
        title: post.title,
        description: post.excerpt || undefined,
        images: post.featured_image_url ? [post.featured_image_url] : undefined,
      },
    };
  } catch {
    return {
      title: 'Post Not Found - Goodsongs',
      description: 'The requested post could not be found.',
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

function getAvailableStreamingLinks(
  streamingLinks?: Record<string, string>
): Array<{ platform: StreamingPlatform; url: string }> {
  if (!streamingLinks) return [];
  return (Object.entries(streamingLinks) as [StreamingPlatform, string | undefined][])
    .filter(([_, url]) => url)
    .map(([platform, url]) => ({ platform, url: url! }));
}

export default async function BandPostPage({ params }: PageProps) {
  const { slug, postSlug } = await params;

  const response = await getThemedBandPost(slug, postSlug);
  if (!response) {
    notFound();
  }

  const { post, theme, related_posts, navigation, user } = response.data;
  const postBasePath = `/bands/${slug}`;
  const bandImageUrl = user.primary_band?.profile_picture_url;

  // Themed rendering
  if (theme) {
    const layout = theme.single_post_layout || {
      show_featured_image: true,
      show_author: true,
      show_song_embed: true,
      show_comments: true,
      show_related_posts: true,
      show_navigation: true,
      content_layout: 'default' as const,
      background_color: null,
      font_color: null,
      max_width: null,
    };
    return (
      <div data-mantine-color-scheme="dark">
        <FontPreload fonts={[theme.header_font, theme.body_font]} />
        <ThemedPostPage
          theme={theme}
          layout={layout}
          post={post}
          relatedPosts={related_posts}
          navigation={navigation}
          postBasePath={postBasePath}
          authorImageOverride={bandImageUrl}
        />
      </div>
    );
  }

  // Unthemed fallback
  return (
    <>
      <Container size="md" py="xl" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Stack gap="xl">
          {/* Back link */}
          <Group>
            <ActionIcon
              component={Link}
              href={`/bands/${slug}`}
              variant="subtle"
              color="gray"
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              Back to band profile
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

            <Group gap="md">
              <Group gap="xs">
                <Avatar
                  src={fixImageUrl(bandImageUrl || post.author.profile_image_url)}
                  alt={user.primary_band?.name || post.author.display_name || post.author.username || 'Author'}
                  size="sm"
                  radius="xl"
                />
                <Text size="sm" fw={500}>
                  {post.author.display_name || post.author.username}
                </Text>
              </Group>

              <Group gap="xs">
                <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  {formatDate(post.publish_date)}
                </Text>
              </Group>

              <PostLikeButton
                postId={post.id}
                initialLiked={post.liked_by_current_user}
                initialLikesCount={post.likes_count}
                size="sm"
              />
            </Group>
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
                  </Stack>
                </Group>

                {(() => {
                  const availableLinks = getAvailableStreamingLinks(post.song?.streaming_links);
                  const songLinkUrl = post.song?.songlink_url || post.song?.song_link;
                  const preferredUrl = post.song?.preferred_link;

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
              style={{ color: 'var(--gs-text-primary)', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          )}

          {/* Comments */}
          <PostCommentsSection postId={post.id} initialCommentsCount={post.comments_count} />
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
