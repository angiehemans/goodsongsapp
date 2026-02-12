'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconCurrencyDollar,
  IconExternalLink,
  IconMapPin,
  IconTicket,
  IconUser,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Header } from '@/components/Header/Header';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { apiClient, Event } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './page.module.css';

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await apiClient.getEvent(Number(eventId));
        setEvent(eventData);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Event not found');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleOpenMaps = () => {
    if (event?.venue) {
      const query = encodeURIComponent(
        `${event.venue.name}, ${event.venue.address || ''} ${event.venue.city || ''} ${event.venue.region || ''}`
      );
      window.open(`https://maps.google.com/?q=${query}`, '_blank');
    }
  };

  if (loading) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Center py="xl" style={{ minHeight: '50vh' }}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container p={0} fluid className={styles.container}>
        <Header showBackButton />
        <Center py="xl" style={{ minHeight: '50vh' }}>
          <Text c="dimmed">{error || 'Event not found'}</Text>
        </Center>
      </Container>
    );
  }

  const venueAddress = [event.venue?.address, event.venue?.city, event.venue?.region]
    .filter(Boolean)
    .join(', ');

  return (
    <Container p={0} fluid className={styles.container}>
      <Header showBackButton />

      <Box className={styles.content} px="md" pb="xl">
        <Box maw={700}>
          {/* Event Image */}
          {event.image_url && (
            <Box className={styles.imageWrapper} mb="lg">
              <img
                src={fixImageUrl(event.image_url)}
                alt={event.name}
                className={styles.eventImage}
              />
            </Box>
          )}

          {/* Event Title */}
          <Title order={2} c="grape.9" mb="md" className={styles.eventTitle}>
            {event.name}
          </Title>

          {/* Band Info */}
          {event.band && (
            <Flex
              component={Link}
              href={`/bands/${event.band.slug}`}
              className={styles.bandRow}
              align="center"
              gap="md"
              p="md"
              mb="lg"
            >
              <ProfilePhoto
                src={event.band.profile_picture_url || event.band.spotify_image_url}
                alt={event.band.name}
                size={40}
                fallback={event.band.name || 'B'}
              />
              <Text fw={600} c="grape.9" style={{ flex: 1 }}>
                {event.band.name}
              </Text>
              <IconChevronRight size={20} color="var(--mantine-color-grape-5)" />
            </Flex>
          )}

          {/* Date & Time Section */}
          <Box className={styles.infoSection} mb="md">
            <Group gap="md" mb="md">
              <Box className={styles.iconContainer}>
                <IconCalendar size={20} color="var(--mantine-color-grape-6)" />
              </Box>
              <Stack gap={2} style={{ flex: 1 }}>
                <Text size="xs" c="dimmed">Date</Text>
                <Text fw={500} c="grape.9">{formatDate(event.event_date)}</Text>
              </Stack>
            </Group>

            <Group gap="md">
              <Box className={styles.iconContainer}>
                <IconClock size={20} color="var(--mantine-color-grape-6)" />
              </Box>
              <Stack gap={2} style={{ flex: 1 }}>
                <Text size="xs" c="dimmed">Time</Text>
                <Text fw={500} c="grape.9">{formatTime(event.event_date)}</Text>
              </Stack>
            </Group>
          </Box>

          {/* Venue Section */}
          {event.venue && (
            <Box
              className={styles.venueSection}
              mb="md"
              onClick={handleOpenMaps}
              style={{ cursor: 'pointer' }}
            >
              <Group gap="md" align="flex-start">
                <Box className={styles.iconContainer}>
                  <IconMapPin size={20} color="var(--mantine-color-grape-6)" />
                </Box>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed">Venue</Text>
                  <Text fw={500} c="grape.9">{event.venue.name}</Text>
                  {venueAddress && (
                    <Text size="sm" c="dimmed">{venueAddress}</Text>
                  )}
                </Stack>
                <IconExternalLink size={16} color="var(--mantine-color-grape-5)" />
              </Group>
            </Box>
          )}

          {/* Price & Age Badges */}
          {(event.price || event.age_restriction) && (
            <Group gap="sm" mb="lg">
              {event.price && (
                <Badge
                  size="lg"
                  variant="light"
                  color="grape"
                  leftSection={<IconCurrencyDollar size={14} />}
                >
                  {event.price}
                </Badge>
              )}
              {event.age_restriction && (
                <Badge
                  size="lg"
                  variant="light"
                  color="grape"
                  leftSection={<IconUser size={14} />}
                >
                  {event.age_restriction}
                </Badge>
              )}
            </Group>
          )}

          {/* Description */}
          {event.description && (
            <Box mb="lg">
              <Title order={4} c="grape.9" mb="sm">About</Title>
              <Text c="gray.7" style={{ lineHeight: 1.6 }}>
                {event.description}
              </Text>
            </Box>
          )}

          {/* Get Tickets Button */}
          {event.ticket_link && (
            <Button
              component="a"
              href={event.ticket_link}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              fullWidth
              color="grape"
              leftSection={<IconTicket size={20} />}
              rightSection={<IconExternalLink size={16} />}
            >
              Get Tickets
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
