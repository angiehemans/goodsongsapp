'use client';

import Link from 'next/link';
import {
  IconCalendarEvent,
  IconClock,
  IconCurrencyDollar,
  IconMapPin,
  IconTicket,
  IconUser,
} from '@tabler/icons-react';
import { Badge, Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { Event } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const venueLocation = [event.venue.city, event.venue.region].filter(Boolean).join(', ');

  return (
    <Card
      p="md"
      radius="md"
      className={styles.card}
      style={{ opacity: isPastEvent ? 0.7 : 1 }}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {/* Date Badge */}
        <Box className={styles.dateBadge}>
          <Text size="xs" fw={600} tt="uppercase" c="grape.6">
            {eventDate.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
          <Text size="xl" fw={700} c="grape.9" lh={1}>
            {eventDate.getDate()}
          </Text>
        </Box>

        {/* Event Details */}
        <Stack gap="xs" flex={1} style={{ minWidth: 0 }}>
          <div>
            <Group gap="xs" mb={4}>
              {isPastEvent && (
                <Badge size="xs" color="gray" variant="light">
                  Past Event
                </Badge>
              )}
              {event.age_restriction && (
                <Badge size="xs" color="orange" variant="light">
                  {event.age_restriction}
                </Badge>
              )}
            </Group>
            <Title order={4} className={styles.eventName} lineClamp={1}>
              {event.name}
            </Title>
          </div>

          {/* Band Info (optional) */}
          {showBand && (
            <Group gap="xs">
              <ProfilePhoto
                src={event.band.profile_picture_url}
                alt={event.band.name}
                size={24}
                fallback={event.band.name}
              />
              <Text
                size="sm"
                c="grape.6"
                component={Link}
                href={`/bands/${event.band.slug}`}
                className={styles.bandLink}
              >
                {event.band.name}
              </Text>
            </Group>
          )}

          {/* Venue */}
          <Group gap={4} wrap="nowrap">
            <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
            <Text size="sm" c="dimmed" lineClamp={1}>
              {event.venue.name}
              {venueLocation && ` · ${venueLocation}`}
            </Text>
          </Group>

          {/* Time & Price */}
          <Group gap="md">
            <Group gap={4}>
              <IconClock size={14} color="var(--mantine-color-dimmed)" />
              <Text size="sm" c="dimmed">
                {formatTime(eventDate)}
              </Text>
            </Group>
            {event.price && (
              <Group gap={4}>
                <IconCurrencyDollar size={14} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  {event.price}
                </Text>
              </Group>
            )}
          </Group>

          {/* Description */}
          {event.description && (
            <Text size="sm" c="gray.7" lineClamp={2}>
              {event.description}
            </Text>
          )}

          {/* Actions */}
          <Group gap="xs" mt="xs">
            {event.ticket_link && !isPastEvent && (
              <Button
                component="a"
                href={event.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                variant="filled"
                color="grape"
                leftSection={<IconTicket size={14} />}
              >
                Get Tickets
              </Button>
            )}
            {showActions && (
              <>
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
              </>
            )}
          </Group>
        </Stack>

        {/* Event Image (if available) */}
        {event.image_url && (
          <Box className={styles.imageWrapper}>
            <img
              src={fixImageUrl(event.image_url)}
              alt={event.name}
              className={styles.eventImage}
            />
          </Box>
        )}
      </Group>
    </Card>
  );
}
