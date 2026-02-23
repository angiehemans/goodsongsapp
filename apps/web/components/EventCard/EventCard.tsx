'use client';

import Link from 'next/link';
import { IconTicket } from '@tabler/icons-react';
import { Badge, Box, Button, Group, Stack, Text } from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { Event } from '@/lib/api';
import styles from './EventCard.module.css';

interface EventCardProps {
  event: Event;
  /** Show band info (used on discover page where events are from multiple bands) */
  showBand?: boolean;
  /** Show edit/delete actions (for band dashboard) */
  showActions?: boolean;
  /** Callback when edit is clicked */
  onEdit?: (event: Event) => void;
  /** Callback when delete is clicked */
  onDelete?: (event: Event) => void;
}

export function EventCard({
  event,
  showBand = false,
  showActions = false,
  onEdit,
  onDelete,
}: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

  const venueLocation = event.venue?.city || '';

  const cardContent = (
    <Group gap="md" align="flex-start" wrap="nowrap">
      {/* Date Badge */}
      <Box className={styles.dateBadge}>
        <Text className={styles.dateDay}>
          {eventDate.getDate()}
        </Text>
        <Text className={styles.dateMonth}>
          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </Box>

      {/* Event Details */}
      <Stack gap={2} flex={1} style={{ minWidth: 0 }}>
        <Text fw={600} lineClamp={1} style={{ color: 'var(--gs-text-primary)' }}>
          {event.name}
        </Text>
        <Text size="sm" c="dimmed" lineClamp={1}>
          {event.venue?.name}
          {venueLocation && ` · ${venueLocation}`}
        </Text>
        {showBand && event.band && (
          <Text size="sm" fw={500} style={{ color: 'var(--gs-text-accent)' }}>
            {event.band.name}
          </Text>
        )}
      </Stack>

      {/* Past Event Badge */}
      {isPastEvent && (
        <Badge size="xs" color="gray" variant="light">
          Past
        </Badge>
      )}
    </Group>
  );

  // If showing actions (band dashboard), don't make it clickable
  if (showActions) {
    return (
      <Box className={styles.card} p="sm">
        {cardContent}
        <Group gap="xs" mt="sm" justify="flex-end">
          <Button size="xs" variant="light" onClick={() => onEdit?.(event)}>
            Edit
          </Button>
          <Button
            size="xs"
            variant="light"
            color="red"
            onClick={() => onDelete?.(event)}
          >
            Delete
          </Button>
        </Group>
      </Box>
    );
  }

  return (
    <Box
      component={Link}
      href={`/events/${event.id}`}
      className={styles.card}
      p="sm"
    >
      {cardContent}
    </Box>
  );
}
