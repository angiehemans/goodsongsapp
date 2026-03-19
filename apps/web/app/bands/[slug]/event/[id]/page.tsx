import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCalendarEvent,
  IconMapPin,
  IconTicket,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Container,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getBandPublicProfile, getEventById } from '@/lib/site-builder/api';
import { ThemedEventPage } from '@/components/SiteBuilder/ThemedEventPage';
import { FontPreload } from '@/components/SiteBuilder/FontPreload';
import { Logo } from '@/components/Logo';
import { fixImageUrl } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const eventId = parseInt(id, 10);

  try {
    const event = await getEventById(eventId);
    if (!event) {
      return {
        title: 'Event Not Found - Goodsongs',
        description: 'The requested event could not be found.',
      };
    }

    return {
      title: `${event.name} - ${event.band?.name || slug} - Goodsongs`,
      description: event.description || `${event.name} on Goodsongs.`,
    };
  } catch {
    return {
      title: 'Event Not Found - Goodsongs',
      description: 'The requested event could not be found.',
    };
  }
}

function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function BandEventPage({ params }: PageProps) {
  const { slug, id } = await params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const [event, publicProfile] = await Promise.all([
    getEventById(eventId),
    getBandPublicProfile(slug),
  ]);

  if (!event) {
    notFound();
  }

  const profileBasePath = `/bands/${slug}`;
  const profileName = event.band?.name || slug;
  const bandImageUrl = publicProfile?.data?.user?.primary_band?.profile_picture_url
    || publicProfile?.data?.user?.profile_image_url
    || event.band?.profile_picture_url;

  // Themed rendering
  if (publicProfile?.data?.theme) {
    const { theme } = publicProfile.data;
    return (
      <div data-mantine-color-scheme="dark">
        <FontPreload fonts={[theme.header_font, theme.body_font]} />
        <ThemedEventPage
          theme={theme}
          event={event}
          profileBasePath={profileBasePath}
          profileName={profileName}
          profileImageUrl={bandImageUrl}
        />
      </div>
    );
  }

  // Unthemed fallback
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();

  return (
    <>
      <Container size="md" py="xl" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Stack gap="xl">
          {/* Back link */}
          <Group>
            <ActionIcon
              component={Link}
              href={profileBasePath}
              variant="subtle"
              color="gray"
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              Back to {profileName}
            </Text>
          </Group>

          {/* Event Image */}
          {event.image_url && (
            <Box>
              <Image
                src={fixImageUrl(event.image_url)}
                alt={event.name}
                radius="md"
                mah={400}
                fit="cover"
              />
            </Box>
          )}

          {/* Title */}
          <Stack gap="md">
            <Group gap="md" align="center">
              <Title order={1} style={{ color: 'var(--gs-text-heading)' }}>
                {event.name}
              </Title>
              {isPastEvent && (
                <Badge color="gray" variant="light">Past Event</Badge>
              )}
            </Group>

            {/* Author */}
            <Group gap="md">
              <Group gap="xs">
                <Avatar
                  src={fixImageUrl(bandImageUrl)}
                  alt={profileName}
                  size="sm"
                  radius="xl"
                />
                <Link href={profileBasePath} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Text size="sm" fw={500}>
                    {profileName}
                  </Text>
                </Link>
              </Group>
            </Group>
          </Stack>

          {/* Event Details */}
          <Paper p="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="sm">
                <IconCalendarEvent size={18} style={{ color: 'var(--gs-text-tertiary)' }} />
                <div>
                  <Text fw={500}>{formatEventDate(event.event_date)}</Text>
                  <Text size="sm" c="dimmed">{formatEventTime(event.event_date)}</Text>
                </div>
              </Group>

              {event.venue && (
                <Group gap="sm">
                  <IconMapPin size={18} style={{ color: 'var(--gs-text-tertiary)' }} />
                  <div>
                    <Text fw={500}>{event.venue.name}</Text>
                    {(event.venue.city || event.venue.region) && (
                      <Text size="sm" c="dimmed">
                        {[event.venue.address, event.venue.city, event.venue.region].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </div>
                </Group>
              )}

              {event.price && (
                <Group gap="sm">
                  <Text size="sm" fw={500}>Price:</Text>
                  <Text size="sm">{event.price}</Text>
                </Group>
              )}

              {event.age_restriction && (
                <Group gap="sm">
                  <Text size="sm" fw={500}>Ages:</Text>
                  <Text size="sm">{event.age_restriction}</Text>
                </Group>
              )}

              {event.ticket_link && !isPastEvent && (
                <a href={event.ticket_link} target="_blank" rel="noopener noreferrer">
                  <Badge
                    size="lg"
                    color="grape"
                    variant="light"
                    leftSection={<IconTicket size={14} />}
                    style={{ cursor: 'pointer' }}
                  >
                    Get Tickets
                  </Badge>
                </a>
              )}
            </Stack>
          </Paper>

          {/* Description */}
          {event.description && (
            <Text style={{ whiteSpace: 'pre-wrap', color: 'var(--gs-text-primary)', lineHeight: 1.7 }}>
              {event.description}
            </Text>
          )}
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
