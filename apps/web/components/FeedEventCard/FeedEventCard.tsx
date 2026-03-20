'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IconBrandThreads,
  IconCalendarEvent,
  IconHeart,
  IconHeartFilled,
  IconMapPin,
  IconMessage,
  IconShare,
  IconTicket,
} from '@tabler/icons-react';
import { ActionIcon, Badge, Card, Group, Menu, Stack, Text } from '@mantine/core';
import { CommentsDrawer } from '@/components/CommentsDrawer/CommentsDrawer';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, FeedEventItem } from '@/lib/api';
import styles from './FeedEventCard.module.css';

interface FeedEventCardProps {
  event: FeedEventItem;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
  const { user } = useAuth();
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

  const authorName = event.author?.display_name || event.author?.username || event.band?.name || 'Unknown';
  const authorUsername = event.author?.username;
  const authorRole = event.author?.role;
  const authorProfileImage = event.author?.profile_image_url;
  const bandSlug = event.author?.band_slug || event.band?.slug;

  const eventUrl = authorRole === 'band' && bandSlug
    ? `/bands/${bandSlug}/event/${event.id}`
    : authorUsername
      ? `/blog/${authorUsername}/event/${event.id}`
      : undefined;

  const [isLiked, setIsLiked] = useState(event.liked_by_current_user ?? false);
  const [likesCount, setLikesCount] = useState(event.likes_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(event.comments_count ?? 0);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);

  const handleLikeClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeEvent(event.id);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likeEvent(event.id);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error('Failed to like/unlike event:', error);
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
            alt={authorName}
            size={36}
            fallback={authorName}
            href={authorRole === 'band' && bandSlug ? `/bands/${bandSlug}` : authorUsername ? `/users/${authorUsername}` : undefined}
          />
          <Stack gap={2}>
            {authorRole === 'band' && bandSlug ? (
              <Text
                size="sm"
                fw={500}
                component={Link}
                href={`/bands/${bandSlug}`}
                style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
                className={styles.authorName}
              >
                {event.band?.name || authorName}
              </Text>
            ) : authorUsername ? (
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
              <Text size="sm" fw={500} className={styles.authorName} style={{ color: 'var(--gs-text-accent)' }}>
                {authorName}
              </Text>
            )}
            <Text size="xs" style={{ color: 'var(--gs-text-tertiary)' }}>
              {new Date(event.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Stack>
        </Group>

        {/* Event Content */}
        <div className={styles.eventRow}>
          <Group gap="sm" wrap="nowrap" align="flex-start">
            {/* Date Badge */}
            <div className={styles.dateBadge}>
              <Text className={styles.dateDay}>
                {eventDate.getDate()}
              </Text>
              <Text className={styles.dateMonth}>
                {eventDate.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </div>

            {/* Event Details */}
            <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
              {eventUrl ? (
                <Text fw={500} lineClamp={2} className={styles.eventName} component={Link} href={eventUrl} style={{ textDecoration: 'none', color: 'var(--gs-text-primary)' }}>
                  {event.name}
                </Text>
              ) : (
                <Text fw={500} lineClamp={2} className={styles.eventName} style={{ color: 'var(--gs-text-primary)' }}>
                  {event.name}
                </Text>
              )}
              {event.venue && (
                <Group gap={4}>
                  <IconMapPin size={14} style={{ color: 'var(--gs-text-tertiary)', flexShrink: 0 }} />
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {event.venue.name}
                    {event.venue.city && ` · ${event.venue.city}`}
                  </Text>
                </Group>
              )}
              {event.band && (
                <Text
                  size="sm"
                  fw={500}
                  component={Link}
                  href={`/bands/${event.band.slug}`}
                  style={{ textDecoration: 'none', color: 'var(--gs-text-accent)' }}
                >
                  {event.band.name}
                </Text>
              )}
              <Group gap={4}>
                <IconCalendarEvent size={14} style={{ color: 'var(--gs-text-tertiary)', flexShrink: 0 }} />
                <Text size="sm" c="dimmed">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' at '}
                  {eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </Group>
            </Stack>

            {/* Past Event Badge or Ticket Link */}
            {isPastEvent ? (
              <Badge size="sm" color="gray" variant="light">Past</Badge>
            ) : event.ticket_link ? (
              <a href={event.ticket_link} target="_blank" rel="noopener noreferrer">
                <Badge
                  size="sm"
                  color="grape"
                  variant="light"
                  leftSection={<IconTicket size={12} />}
                  style={{ cursor: 'pointer' }}
                >
                  Tickets
                </Badge>
              </a>
            ) : null}
          </Group>
        </div>

        {/* Description */}
        {event.description && (
          <Text size="sm" lineClamp={3} style={{ whiteSpace: 'pre-wrap', color: 'var(--gs-text-secondary)' }}>
            {event.description}
          </Text>
        )}

        {/* Actions Row */}
        <Group gap="sm" justify="flex-end" className={styles.actionItems}>
          {/* Share Menu */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="grape" aria-label="Share event">
                <IconShare size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Share this event</Menu.Label>
              <Menu.Item
                leftSection={<IconBrandThreads size={16} />}
                onClick={async () => {
                  try {
                    const payload = await apiClient.getSharePayload('event', event.id);
                    if (payload.threads_intent_url) {
                      window.open(payload.threads_intent_url, '_blank', 'noopener');
                    }
                  } catch {
                    // Fallback
                    const text = `${event.name}\n\n${window.location.origin}/events/${event.id}`;
                    window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
                  }
                }}
              >
                Share on Threads
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Comments */}
          <Group gap={4}>
            <ActionIcon variant="subtle" color="grape" aria-label="View comments" onClick={() => setCommentsDrawerOpen(true)}>
              <IconMessage size={20} />
            </ActionIcon>
            {commentsCount > 0 && (
              <Text size="sm" style={{ color: 'var(--gs-text-accent)' }}>
                {commentsCount}
              </Text>
            )}
          </Group>

          {/* Likes */}
          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              color={isLiked ? 'red' : 'grape'}
              onClick={handleLikeClick}
              loading={isLiking}
              aria-label={isLiked ? 'Unlike event' : 'Like event'}
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

      <CommentsDrawer
        resourceType="event"
        resourceId={event.id}
        opened={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        onCommentCountChange={setCommentsCount}
      />
    </Card>
  );
}
