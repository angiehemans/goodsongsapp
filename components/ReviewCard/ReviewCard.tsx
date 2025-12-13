import Image from 'next/image';
import Link from 'next/link';
import { IconBrandSpotify } from '@tabler/icons-react';
import { Badge, Card, Group, Spoiler, Stack, Text } from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { Review } from '@/lib/api';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const authorUsername = review.author?.username || review.user?.username;
  const authorProfileImage = review.author?.profile_image_url;
  const reviewUrl = authorUsername ? `/users/${authorUsername}/reviews/${review.id}` : '#';

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
              {review.artwork_url ? (
                <Image
                  src={review.artwork_url}
                  alt={`${review.song_name} artwork`}
                  width={48}
                  height={48}
                  className={styles.artwork}
                  unoptimized={review.artwork_url.includes('spotify') || review.artwork_url.includes('scdn')}
                />
              ) : (
                <div className={styles.artworkPlaceholder} />
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
              <IconBrandSpotify size={24} color="var(--mantine-color-green-6)" />
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

        {/* Tags */}
        {review.liked_aspects && review.liked_aspects.length > 0 && (
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
        )}
      </Stack>
    </Card>
  );
}
