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
  IconMessage,
  IconPhoto,
  IconPlayerPlay,
  IconShare,
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import { ActionIcon, Card, Center, Group, Menu, Spoiler, Stack, Text } from '@mantine/core';
import { CommentsDrawer } from '@/components/CommentsDrawer/CommentsDrawer';
import { MentionText } from '@/components/MentionText/MentionText';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Review } from '@/lib/api';
import { STREAMING_PLATFORMS, StreamingLinks, StreamingPlatform } from '@/lib/streaming';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
  onLikeChange?: (reviewId: number, liked: boolean, likesCount: number) => void;
}

export function ReviewCard({ review, onLikeChange }: ReviewCardProps) {
  const { user } = useAuth();
  const [artworkError, setArtworkError] = useState(false);
  const [isLiked, setIsLiked] = useState(review.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(review.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  // Only render hidden Instagram renderers when user clicks to generate
  const [renderFormat, setRenderFormat] = useState<'story' | 'post' | null>(null);
  // Comments state
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(review.comments_count ?? 0);

  const storyRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);

  // Get streaming data from track object or review directly
  const track = (review as any).track;
  const band = review.band as any;
  const streamingLinks: StreamingLinks | undefined =
    track?.streaming_links || review.streaming_links;
  const preferredTrackLink: string | undefined = track?.preferred_track_link;
  const songlinkUrl: string | undefined = track?.songlink_url || review.songlink_url;
  const songlinkSearchUrl: string | undefined =
    track?.songlink_search_url || (review as any).songlink_search_url;
  const preferredBandLink: string | undefined = band?.preferred_band_link;

  // Get available streaming links from track
  const getAvailableStreamingLinks = (): Array<{ platform: StreamingPlatform; url: string }> => {
    if (!streamingLinks) return [];
    return (Object.entries(streamingLinks) as [StreamingPlatform, string | undefined][])
      .filter(([_, url]) => url)
      .map(([platform, url]) => ({ platform, url: url! }));
  };

  // Get available band links
  const getAvailableBandLinks = (): Array<{ platform: string; url: string }> => {
    if (!band) return [];
    const bandLinks: Array<{ platform: string; url: string }> = [];
    if (band.spotify_link) bandLinks.push({ platform: 'spotify', url: band.spotify_link });
    if (band.apple_music_link)
      bandLinks.push({ platform: 'appleMusic', url: band.apple_music_link });
    if (band.youtube_music_link)
      bandLinks.push({ platform: 'youtubeMusic', url: band.youtube_music_link });
    if (band.bandcamp_link) bandLinks.push({ platform: 'bandcamp', url: band.bandcamp_link });
    if (band.soundcloud_link) bandLinks.push({ platform: 'soundcloud', url: band.soundcloud_link });
    return bandLinks;
  };

  const availableLinks = getAvailableStreamingLinks();
  const availableBandLinks = getAvailableBandLinks();
  const preferredPlatform = user?.preferred_streaming_platform;
  const preferredLink = preferredPlatform && streamingLinks?.[preferredPlatform];

  // Get the best URL following the fallback chain:
  // preferred_track_link > streaming_links > songlink_url > preferred_band_link > band_links > songlink_search_url
  const getBestUrl = (): string | undefined => {
    if (preferredTrackLink) return preferredTrackLink;
    if (availableLinks.length > 0) return availableLinks[0].url;
    if (songlinkUrl) return songlinkUrl;
    if (preferredBandLink) return preferredBandLink;
    if (availableBandLinks.length > 0) return availableBandLinks[0].url;
    if (songlinkSearchUrl) return songlinkSearchUrl;
    return review.song_link;
  };

  // Determine what happens when play button is clicked
  const handlePlayClick = () => {
    // Priority 1: preferred_track_link
    if (preferredTrackLink) {
      window.open(preferredTrackLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 2: User's preferred platform from streaming_links
    if (preferredLink) {
      window.open(preferredLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 3: If only one streaming link, direct open
    if (availableLinks.length === 1) {
      window.open(availableLinks[0].url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 4: Multiple streaming links - Menu will handle
    if (availableLinks.length > 1) {
      return; // Menu handles this
    }

    // Priority 5: songlink_url
    if (songlinkUrl) {
      window.open(songlinkUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 6: preferred_band_link
    if (preferredBandLink) {
      window.open(preferredBandLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 7: If only one band link, direct open
    if (availableBandLinks.length === 1) {
      window.open(availableBandLinks[0].url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Priority 8: Multiple band links - Menu will handle
    if (availableBandLinks.length > 1) {
      return; // Menu handles this
    }

    // Priority 9: songlink_search_url
    if (songlinkSearchUrl) {
      window.open(songlinkSearchUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Final fallback: song_link
    if (review.song_link) {
      window.open(review.song_link, '_blank', 'noopener,noreferrer');
    }
  };

  // Should show menu when we have multiple options at the current priority level
  // (multiple streaming links OR multiple band links when no streaming links)
  const shouldShowStreamingMenu =
    availableLinks.length > 1 && !preferredTrackLink && !preferredLink;
  const shouldShowBandMenu =
    availableLinks.length === 0 &&
    !songlinkUrl &&
    !preferredBandLink &&
    availableBandLinks.length > 1 &&
    !preferredTrackLink;
  const shouldShowMenu = shouldShowStreamingMenu || shouldShowBandMenu;

  // Links to show in the menu
  const menuLinks = shouldShowStreamingMenu ? availableLinks : availableBandLinks;

  // Check if we have any playable link
  const hasPlayableLink = !!getBestUrl();

  // Determine if the best link is a direct song link (play icon) or not (link icon)
  // Song links: preferred_track_link, streaming_links, songlink_url
  // Non-song links: preferred_band_link, band_links, songlink_search_url, song_link
  const isSongLink = !!(preferredTrackLink || availableLinks.length > 0 || songlinkUrl);

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
    setCommentsCount(review.comments_count ?? 0);
  }, [review.liked_by_current_user, review.likes_count, review.comments_count]);

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
    <Card py="sm" px={0} bg="none" maw={700} className={styles.cardBorder}>
      <Stack gap="sm">
        {/* Author Info */}
        <Group gap="sm">
          <ProfilePhoto
            src={authorProfileImage}
            alt={authorUsername || 'Unknown user'}
            size={36}
            fallback={authorUsername || '?'}
            href={authorUsername ? `/users/${authorUsername}` : undefined}
          />
          <Stack gap={2}>
            {authorUsername ? (
              <Text
                size="sm"
                fw={500}
                component={Link}
                href={`/users/${authorUsername}`}
                style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
                className={styles.authorName}
              >
                @{authorUsername}
              </Text>
            ) : (
              <Text size="sm" fw={500} c="dimmed">
                @unknown
              </Text>
            )}
            <Text size="xs" style={{ color: 'var(--gs-text-tertiary)' }}>
              {new Date(review.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Stack>
        </Group>

        {/* Song Row - with background */}
        <div className={styles.songRow}>
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
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    backgroundColor: 'var(--gs-bg-accent)',
                  }}
                >
                  <img
                    src="/logo-grape.svg"
                    alt="Good Songs"
                    width={32}
                    height={32}
                    style={{ opacity: 0.8 }}
                  />
                </Center>
              )}
            </Link>
            <Stack gap={2}>
              <Text
                size="md"
                fw={500}
                component={Link}
                href={reviewUrl}
                style={{ textDecoration: 'none', color: 'var(--gs-text-primary)' }}
                className={styles.songName}
              >
                {review.song_name}
              </Text>
              {review.band?.slug ? (
                <Text
                  size="sm"
                  component={Link}
                  href={`/bands/${review.band.slug}`}
                  style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
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
          {/* Streaming Links Button */}
          {hasPlayableLink &&
            (shouldShowMenu ? (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    color="grape"
                    aria-label={isSongLink ? 'Play on streaming platform' : 'Open link'}
                  >
                    {isSongLink ? <IconPlayerPlay size={24} /> : <IconLink size={24} />}
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{shouldShowBandMenu ? 'Artist on' : 'Listen on'}</Menu.Label>
                  {menuLinks.map(({ platform, url }) => (
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
                            backgroundColor:
                              STREAMING_PLATFORMS[platform as StreamingPlatform]?.color || '#666',
                          }}
                        />
                      }
                    >
                      {STREAMING_PLATFORMS[platform as StreamingPlatform]?.name || platform}
                    </Menu.Item>
                  ))}
                  {(songlinkUrl || songlinkSearchUrl) && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        component="a"
                        href={songlinkUrl || songlinkSearchUrl}
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
            ) : (
              <ActionIcon
                variant="subtle"
                color="grape"
                aria-label={isSongLink ? 'Play' : 'Open link'}
                onClick={handlePlayClick}
              >
                {isSongLink ? <IconPlayerPlay size={24} /> : <IconLink size={24} />}
              </ActionIcon>
            ))}
        </div>

        {/* Review Text */}
        <Spoiler
          maxHeight={60}
          showLabel="Read more"
          hideLabel="Show less"
          styles={{
            control: {
              fontSize: 'var(--mantine-font-size-sm)',
              color: 'var(--gs-text-muted)',
            },
          }}
        >
          <MentionText
            text={review.formatted_review_text || review.review_text}
            size="sm"
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </Spoiler>

        {/* Tags */}
        {review.liked_aspects && review.liked_aspects.length > 0 && (
          <Group gap="xs">
            {review.liked_aspects.slice(0, 3).map((aspect, index) => (
              <Text key={index} size="sm" className={styles.tag}>
                #{typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
              </Text>
            ))}
            {review.liked_aspects.length > 3 && (
              <Text size="xs" c="dimmed">
                +{review.liked_aspects.length - 3} more
              </Text>
            )}
          </Group>
        )}

        {/* Like, Comments, and Share Buttons */}
        <Group gap="sm" justify="flex-end" pt="sm" className={styles.actionItems}>
          {/* Share Menu */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="grape"
                aria-label="Share review"
                loading={generatingImage}
              >
                {copied ? <IconCheck size={20} /> : <IconShare size={20} />}
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Share this review</Menu.Label>
              <Menu.Item leftSection={<IconLink size={16} />} onClick={handleCopyLink}>
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

          {/* Comments Button */}
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color="grape"
              onClick={() => setCommentsDrawerOpen(true)}
              aria-label="View comments"
            >
              <IconMessage size={20} />
            </ActionIcon>
            {commentsCount > 0 && (
              <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
                {commentsCount}
              </Text>
            )}
          </Group>

          {/* Like Button */}
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color={isLiked ? 'red' : 'grape'}
              onClick={handleLikeClick}
              loading={isLiking}
              aria-label={isLiked ? 'Unlike review' : 'Like review'}
            >
              {isLiked ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
            </ActionIcon>
            {likesCount > 0 && (
              <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
                {likesCount}
              </Text>
            )}
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
                  <img src="/logo-grape.svg" alt="Good Songs" width={80} height={80} />
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
                  <img src="/logo-grape.svg" alt="Good Songs" width={60} height={60} />
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

      {/* Comments Drawer */}
      <CommentsDrawer
        reviewId={review.id}
        opened={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        onCommentCountChange={setCommentsCount}
      />
    </Card>
  );
}
