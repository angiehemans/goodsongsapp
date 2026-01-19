'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconArrowLeft,
  IconBrandInstagram,
  IconCheck,
  IconExternalLink,
  IconLink,
  IconMusic,
  IconPhoto,
  IconShare,
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { apiClient, Review } from '@/lib/api';
import styles from './page.module.css';

export default function SingleReviewPage() {
  const params = useParams();
  const username = params.username as string;
  const reviewId = params.reviewId as string;

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const storyRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInstagramShare = async (format: 'story' | 'post') => {
    const targetRef = format === 'story' ? storyRef : postRef;
    if (!targetRef.current || !review) return;

    setGeneratingImage(true);

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const link = document.createElement('a');
      const authorName = review.author?.username || review.user?.username || username;
      link.download = `${review.song_name}-review-by-${authorName}-${format}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setGeneratingImage(false);
    }
  };

  useEffect(() => {
    async function fetchReview() {
      try {
        setLoading(true);
        const fetchedReview = await apiClient.getReview(parseInt(reviewId, 10));
        setReview(fetchedReview);
      } catch (err) {
        console.error('Failed to fetch review:', err);
        setError('Review not found');
      } finally {
        setLoading(false);
      }
    }

    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  if (loading) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !review) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Container size="sm" py="xl">
          <Center>
            <Stack align="center" gap="md">
              <IconMusic size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed">Review not found</Text>
              <Button component={Link} href={`/users/${username}`} variant="light">
                Back to profile
              </Button>
            </Stack>
          </Center>
        </Container>
      </Container>
    );
  }

  const authorUsername = review.author?.username || review.user?.username || username;
  const authorProfileImage = review.author?.profile_image_url;

  // Truncate text for Instagram formats
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + '...';
  };

  return (
    <Container p={0} fluid className={styles.container}>
      <Header showBackButton />

      <Container size="sm" py="md">
        <Stack gap="md">
          {/* Navigation and actions */}
          <Group justify="space-between">
            <Button
              component={Link}
              href={`/users/${authorUsername}`}
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              size="sm"
            >
              Back to @{authorUsername}'s profile
            </Button>
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="light"
                  color="grape"
                  leftSection={
                    copied ? (
                      <IconCheck size={16} />
                    ) : generatingImage ? (
                      <Loader size={16} />
                    ) : (
                      <IconShare size={16} />
                    )
                  }
                  size="sm"
                  loading={generatingImage}
                >
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Share this review</Menu.Label>
                <Menu.Item leftSection={<IconLink size={16} />} onClick={handleCopyLink}>
                  Copy link
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Download for Instagram</Menu.Label>
                <Menu.Item
                  leftSection={<IconBrandInstagram size={16} />}
                  onClick={() => handleInstagramShare('story')}
                >
                  Story (9:16)
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => handleInstagramShare('post')}
                >
                  Post (1:1)
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* Review Card - Expanded version */}
          <Card p="lg" radius="md" bg="grape.0">
            <Stack gap="md">
              {/* Author Info */}
              <Group gap="sm" pb="md" className={styles.userInfo}>
                <ProfilePhoto
                  src={authorProfileImage}
                  alt={authorUsername}
                  size={48}
                  fallback={authorUsername}
                  href={`/users/${authorUsername}`}
                />
                <Stack gap={2}>
                  <Text
                    size="md"
                    fw={600}
                    c="grape.6"
                    component={Link}
                    href={`/users/${authorUsername}`}
                    style={{ textDecoration: 'none' }}
                    className={styles.authorName}
                  >
                    @{authorUsername}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Stack>
              </Group>

              {/* Song Info */}
              <Flex gap="md" align="flex-start" justify="space-between">
                <Group gap="md">
                  {review.artwork_url ? (
                    <img
                      src={review.artwork_url}
                      alt={`${review.song_name} artwork`}
                      className={styles.artwork}
                    />
                  ) : (
                    <Box className={styles.artworkPlaceholder}>
                      <IconMusic size={32} color="var(--mantine-color-grape-4)" />
                    </Box>
                  )}
                  <Stack gap={4}>
                    <Title order={2} size="h3" c="gray.9">
                      {review.song_name}
                    </Title>
                    {review.band?.slug ? (
                      <Text
                        size="md"
                        c="grape.6"
                        component={Link}
                        href={`/bands/${review.band.slug}`}
                        style={{ textDecoration: 'none' }}
                      >
                        {review.band_name}
                      </Text>
                    ) : (
                      <Text size="md" c="dimmed">
                        {review.band_name}
                      </Text>
                    )}
                  </Stack>
                </Group>
                {review.song_link && (
                  <a href={review.song_link} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="filled"
                      color="grape"
                      leftSection={<IconExternalLink size={20} />}
                      size="sm"
                    >
                      Listen Now
                    </Button>
                  </a>
                )}
              </Flex>

              {/* Review Text */}
              <Box py="md">
                <Text size="md" style={{ whiteSpace: 'pre-wrap' }} lh={1.6}>
                  {review.review_text}
                </Text>
              </Box>

              {/* Tags */}
              {review.liked_aspects && review.liked_aspects.length > 0 && (
                <Group gap="xs">
                  {review.liked_aspects.map((aspect, index) => (
                    <Badge key={index} size="md" variant="light" color="grape">
                      {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>

      {/* Hidden Instagram Story Renderer (9:16 - 1080x1920) */}
      <div className={styles.hiddenRenderer}>
        <div ref={storyRef} className={styles.storyContainer}>
          <div className={styles.storyContent}>
            {/* Album Art */}
            {review.artwork_url ? (
              <img
                src={review.artwork_url}
                alt={`${review.song_name} artwork`}
                className={styles.storyArtwork}
                crossOrigin="anonymous"
              />
            ) : (
              <div className={styles.storyArtworkPlaceholder}>
                <IconMusic size={80} color="#9c36b5" />
              </div>
            )}

            {/* Song Info */}
            <div className={styles.storySongInfo}>
              <h1 className={styles.storySongName}>{review.song_name}</h1>
              <p className={styles.storyArtistName}>{review.band_name}</p>
            </div>

            {/* Review Text */}
            <div className={styles.storyReviewText}>
              <p>"{truncateText(review.review_text, 280)}"</p>
              {/* Author Info */}
              <div className={styles.storyAuthor}>
                <ProfilePhoto
                  src={authorProfileImage}
                  alt={authorUsername}
                  size={40}
                  fallback={authorUsername}
                />
                <span>@{authorUsername}</span>
              </div>
            </div>

            {/* Branding */}
            <div className={styles.storyBranding}>
              <img src="/logo.svg" alt="Good Songs" className={styles.storyLogo} />
              <span>goodsongs.app</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Instagram Post Renderer (1:1 - 1080x1080) */}
      <div className={styles.hiddenRenderer}>
        <div ref={postRef} className={styles.postContainer}>
          <div className={styles.postContent}>
            {/* Album Art */}
            {review.artwork_url ? (
              <img
                src={review.artwork_url}
                alt={`${review.song_name} artwork`}
                className={styles.postArtwork}
                crossOrigin="anonymous"
              />
            ) : (
              <div className={styles.postArtworkPlaceholder}>
                <IconMusic size={60} color="#9c36b5" />
              </div>
            )}

            {/* Song Info */}
            <div className={styles.postSongInfo}>
              <h1 className={styles.postSongName}>{review.song_name}</h1>
              <p className={styles.postArtistName}>{review.band_name}</p>
            </div>

            {/* Review Text */}
            <div className={styles.postReviewText}>
              <p>"{truncateText(review.review_text, 180)}"</p>
              {/* Author Info */}
              <div className={styles.postAuthor}>
                <ProfilePhoto
                  src={authorProfileImage}
                  alt={authorUsername}
                  size={28}
                  fallback={authorUsername}
                />
                <span>@{authorUsername}</span>
              </div>
            </div>

            {/* Branding */}
            <div className={styles.postBranding}>
              <img src="/logo.svg" alt="Good Songs" className={styles.postLogo} />
              <span>goodsongs.app</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
