'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconBrandInstagram,
  IconCheck,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconLink,
  IconMusic,
  IconPhoto,
  IconShare,
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import { ActionIcon, Badge, Card, Center, Group, Loader, Menu, Spoiler, Stack, Text } from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { apiClient, Review } from '@/lib/api';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
  onLikeChange?: (reviewId: number, liked: boolean, likesCount: number) => void;
}

export function ReviewCard({ review, onLikeChange }: ReviewCardProps) {
  const [artworkError, setArtworkError] = useState(false);
  const [isLiked, setIsLiked] = useState(review.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(review.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  // Only render hidden Instagram renderers when user clicks to generate
  const [renderFormat, setRenderFormat] = useState<'story' | 'post' | null>(null);

  const storyRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);

  // Proxy external images to avoid CORS issues with html2canvas
  const getProxiedImageUrl = (url: string | undefined) => {
    if (!url) return undefined;
    // Only proxy external URLs, not our own domain
    if (url.startsWith('/') || url.includes('goodsongs.app')) {
      return url;
    }
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  // Sync state when review prop changes (e.g., after re-fetch with auth)
  useEffect(() => {
    setIsLiked(review.liked_by_current_user ?? false);
    setLikesCount(review.likes_count ?? 0);
  }, [review.liked_by_current_user, review.likes_count]);

  const authorUsername = review.author?.username || review.user?.username;
  const authorProfileImage = review.author?.profile_image_url;
  const reviewUrl = authorUsername ? `/users/${authorUsername}/reviews/${review.id}` : '#';

  // Truncate text for Instagram formats
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + '...';
  };

  const handleCopyLink = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}${reviewUrl}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInstagramShare = async (format: 'story' | 'post') => {
    setGeneratingImage(true);
    setRenderFormat(format);
  };

  // Effect to capture image once the renderer is mounted
  useEffect(() => {
    if (!renderFormat || !generatingImage) return;

    const targetRef = renderFormat === 'story' ? storyRef : postRef;

    // Wait for the renderer to mount and images to load
    const captureImage = async () => {
      // Small delay to ensure DOM is rendered and images start loading
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!targetRef.current) {
        setGeneratingImage(false);
        setRenderFormat(null);
        return;
      }

      // Wait for images to load
      const images = targetRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
        });
      });

      // Wait for all images with a timeout
      await Promise.race([
        Promise.all(imagePromises),
        new Promise((resolve) => setTimeout(resolve, 3000)), // 3 second timeout
      ]);

      try {
        const canvas = await html2canvas(targetRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        const link = document.createElement('a');
        link.download = `${review.song_name}-review-by-${authorUsername}-${renderFormat}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Failed to generate image:', err);
      } finally {
        setGeneratingImage(false);
        setRenderFormat(null);
      }
    };

    captureImage();
  }, [renderFormat, generatingImage, review.song_name, authorUsername]);

  const handleLikeClick = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeReview(review.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
        onLikeChange?.(review.id, false, response.likes_count);
      } else {
        const response = await apiClient.likeReview(review.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
        onLikeChange?.(review.id, true, response.likes_count);
      }
    } catch (error) {
      // Silently fail - user might not be logged in
      console.error('Failed to like/unlike review:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card p="md" bd="0" bg="grape.0" maw={700}>
      <Stack gap="sm">
        {/* Author Info */}
        <Group gap="sm" pb="sm" className={styles.userInfo}>
          <ProfilePhoto
            src={authorProfileImage}
            alt={authorUsername || 'Unknown user'}
            size={36}
            fallback={authorUsername || '?'}
            href={authorUsername ? `/users/${authorUsername}` : undefined}
          />
          {authorUsername ? (
            <Text
              size="sm"
              fw={500}
              c="grape.6"
              component={Link}
              href={`/users/${authorUsername}`}
              style={{ textDecoration: 'none' }}
              className={styles.authorName}
            >
              @{authorUsername}
            </Text>
          ) : (
            <Text size="sm" fw={500} c="dimmed">
              @unknown
            </Text>
          )}
        </Group>

        {/* Song Info */}
        <Group gap="sm" justify="space-between" align="flex-start">
          <Group gap="sm">
            <Link href={reviewUrl} className={styles.artworkLink}>
              {review.artwork_url && !artworkError ? (
                <img
                  src={review.artwork_url}
                  alt={`${review.song_name} artwork`}
                  width={48}
                  height={48}
                  className={styles.artwork}
                  onError={() => setArtworkError(true)}
                />
              ) : (
                <Center
                  w={48}
                  h={48}
                  bg="grape.2"
                  style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                >
                  <IconMusic size={24} color="var(--mantine-color-grape-6)" />
                </Center>
              )}
            </Link>
            <Stack gap={2}>
              <Text
                size="md"
                fw={500}
                c="gray.9"
                component={Link}
                href={reviewUrl}
                style={{ textDecoration: 'none' }}
                className={styles.songName}
              >
                {review.song_name}
              </Text>
              {review.band?.slug ? (
                <Text
                  size="sm"
                  c="grape.6"
                  component={Link}
                  href={`/bands/${review.band.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  {review.band_name}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  {review.band_name}
                </Text>
              )}
            </Stack>
          </Group>
          {review.song_link && (
            <a href={review.song_link} target="_blank" rel="noopener noreferrer">
              <IconExternalLink size={24} color="var(--mantine-color-grape-6)" />
            </a>
          )}
        </Group>

        {/* Review Text */}
        <Spoiler
          maxHeight={60}
          showLabel="Read more"
          hideLabel="Show less"
          styles={{
            control: {
              fontSize: 'var(--mantine-font-size-sm)',
              color: 'var(--mantine-color-grape-4)',
            },
          }}
        >
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {review.review_text}
          </Text>
        </Spoiler>

        {/* Tags and Like Button */}
        <Group justify="space-between" align="center">
          {review.liked_aspects && review.liked_aspects.length > 0 ? (
            <Group gap="xs">
              {review.liked_aspects.slice(0, 3).map((aspect, index) => (
                <Badge key={index} size="sm" variant="light" color="grape">
                  {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                </Badge>
              ))}
              {review.liked_aspects.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{review.liked_aspects.length - 3} more
                </Text>
              )}
            </Group>
          ) : (
            <div />
          )}

          {/* Like and Share Buttons */}
          <Group gap="xs">
            {/* Like Button */}
            <Group gap={4}>
              <ActionIcon
                variant="subtle"
                color={isLiked ? 'red' : 'gray'}
                onClick={handleLikeClick}
                loading={isLiking}
                aria-label={isLiked ? 'Unlike review' : 'Like review'}
              >
                {isLiked ? (
                  <IconHeartFilled size={20} />
                ) : (
                  <IconHeart size={20} />
                )}
              </ActionIcon>
              {likesCount > 0 && (
                <Text size="sm" c="dimmed">
                  {likesCount}
                </Text>
              )}
            </Group>

            {/* Share Menu */}
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Share review"
                  loading={generatingImage}
                >
                  {copied ? <IconCheck size={20} /> : <IconShare size={20} />}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Share this review</Menu.Label>
                <Menu.Item
                  leftSection={<IconLink size={16} />}
                  onClick={handleCopyLink}
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Label>Download for Instagram</Menu.Label>
                <Menu.Item
                  leftSection={<IconBrandInstagram size={16} />}
                  onClick={() => handleInstagramShare('story')}
                  disabled={generatingImage}
                >
                  Story (9:16)
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPhoto size={16} />}
                  onClick={() => handleInstagramShare('post')}
                  disabled={generatingImage}
                >
                  Post (1:1)
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Stack>

      {/* Hidden Instagram Story Renderer (9:16 - 1080x1920) - Only render when generating */}
      {renderFormat === 'story' && (
        <div className={styles.hiddenRenderer}>
          <div ref={storyRef} className={styles.storyContainer}>
            <div className={styles.storyContent}>
              {/* Album Art */}
              {review.artwork_url ? (
                <img
                  src={getProxiedImageUrl(review.artwork_url)}
                  alt={`${review.song_name} artwork`}
                  className={styles.storyArtwork}
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
                    alt={authorUsername || 'User'}
                    size={40}
                    fallback={authorUsername || '?'}
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
      )}

      {/* Hidden Instagram Post Renderer (1:1 - 1080x1080) - Only render when generating */}
      {renderFormat === 'post' && (
        <div className={styles.hiddenRenderer}>
          <div ref={postRef} className={styles.postContainer}>
            <div className={styles.postContent}>
              {/* Album Art */}
              {review.artwork_url ? (
                <img
                  src={getProxiedImageUrl(review.artwork_url)}
                  alt={`${review.song_name} artwork`}
                  className={styles.postArtwork}
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
                    alt={authorUsername || 'User'}
                    size={28}
                    fallback={authorUsername || '?'}
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
      )}
    </Card>
  );
}
