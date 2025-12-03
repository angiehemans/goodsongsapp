import Link from 'next/link';
import { IconBrandSpotify } from '@tabler/icons-react';
import { Avatar, Badge, Card, Divider, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { Review } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: Review;
  variant?: 'default' | 'band-page';
  bandName?: string; // Used when variant is 'band-page' to show band name without link
}

export function ReviewCard({ review, variant = 'default', bandName }: ReviewCardProps) {
  const authorUsername = review.author?.username || review.user?.username;
  const authorProfileImage = review.author?.profile_image_url;

  if (variant === 'band-page') {
    return (
      <Card p="sm" radius={4} className={styles.bandPageCard}>
        <Stack gap="sm">
          {/* Song Info Header */}
          <Flex justify="space-between" align="flex-start">
            <Group gap="sm">
              {review.artwork_url && (
                <img
                  src={review.artwork_url}
                  alt={`${review.song_name} artwork`}
                  style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover' }}
                />
              )}
              <Stack gap={2}>
                <Text size="16px" fw={500} c="gray.9">
                  {review.song_name}
                </Text>
                <Text size="14px" c="gray.5">
                  {bandName || review.band_name}
                </Text>
              </Stack>
            </Group>
            {review.song_link && (
              <a href={review.song_link} target="_blank" rel="noopener noreferrer">
                <IconBrandSpotify size={24} color="var(--mantine-color-blue-8)" />
              </a>
            )}
          </Flex>

          {/* Review Text */}
          <Text size="16px" lh="26px" c="gray.9">
            {review.review_text}
          </Text>

          {/* Tags */}
          {review.liked_aspects && review.liked_aspects.length > 0 && (
            <Group gap="xs">
              {review.liked_aspects.slice(0, 2).map((aspect, index) => (
                <Badge
                  key={index}
                  variant="filled"
                  color="blue.2"
                  c="blue.8"
                  radius={12}
                  px={10}
                  py={7}
                  styles={{ root: { textTransform: 'none' } }}
                >
                  {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                </Badge>
              ))}
            </Group>
          )}

          {/* Overall Rating */}
          <Text size="16px" c="gray.6">
            Overall Rating: Loved it!
          </Text>

          <Divider color="blue.2" size={2} />

          {/* User Info */}
          <Flex justify="space-between" align="center">
            {authorUsername ? (
              <Link href={`/users/${authorUsername}`} style={{ textDecoration: 'none' }}>
                <Group gap="sm">
                  <Avatar
                    size={36}
                    color="grape"
                    radius="xl"
                    src={authorProfileImage ? fixImageUrl(authorProfileImage) : undefined}
                  >
                    {authorUsername.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="16px" c="grape.6">
                    @{authorUsername}
                  </Text>
                </Group>
              </Link>
            ) : (
              <Group gap="sm">
                <Avatar size={36} color="grape" radius="xl">
                  ?
                </Avatar>
                <Text size="16px" c="gray.9">
                  @unknown
                </Text>
              </Group>
            )}
          </Flex>
        </Stack>
      </Card>
    );
  }

  // Default variant
  return (
    <Card key={review.id} p="md" bd="0" bg="grape.0">
      <Flex direction="column" gap="sm">
        <Flex gap="sm">
          {review.artwork_url ? (
            <img
              src={review.artwork_url}
              alt={`${review.song_name} artwork`}
              style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: 'var(--mantine-color-grape-3)',
              }}
            />
          )}
          <div>
            <Title order={5}>{review.song_name}</Title>
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
          </div>
        </Flex>
        <Stack gap="xs">
          <Text size="sm" lineClamp={2}>
            {review.review_text}
          </Text>
          <Group gap="xs" justify="space-between">
            {review.liked_aspects.length > 0 && (
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
            {authorUsername && (
              <Text
                size="xs"
                c="dimmed"
                component={Link}
                href={`/users/${authorUsername}`}
                style={{ textDecoration: 'none' }}
              >
                by {authorUsername}
              </Text>
            )}
          </Group>
        </Stack>
      </Flex>
    </Card>
  );
}
