'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import {
  Button,
  Center,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { EventCard } from '@/components/EventCard/EventCard';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Event } from '@/lib/api';

const EventForm = dynamic(
  () => import('@/components/EventForm/EventForm').then((mod) => ({ default: mod.EventForm })),
  { loading: () => null, ssr: false }
);

export default function BloggerEventsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [eventFormOpened, setEventFormOpened] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const userEvents = await apiClient.getUserEvents(user.id);
      setEvents(userEvents || []);
    } catch (error) {
      notifications.show({
        title: 'Error loading events',
        message: 'Could not load your events. Please try again.',
        color: 'red',
      });
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setEventFormOpened(true);
  }, []);

  const handleCloseEventForm = useCallback(() => {
    setEventFormOpened(false);
    setEditingEvent(null);
  }, []);

  const handleEditEvent = useCallback((event: Event) => {
    setEditingEvent(event);
    setEventFormOpened(true);
  }, []);

  const handleDeleteEvent = useCallback((event: Event) => {
    modals.openConfirmModal({
      title: 'Delete Event',
      children: (
        <Text size="sm">
          Are you sure you want to delete &quot;{event.name}&quot;? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await apiClient.deleteEvent(event.id);
          setEvents((prev) => prev.filter((e) => e.id !== event.id));
          notifications.show({
            title: 'Event Deleted',
            message: `"${event.name}" has been deleted.`,
            color: 'green',
          });
        } catch (error) {
          console.error('Failed to delete event:', error);
          notifications.show({
            title: 'Error',
            message: 'Failed to delete event. Please try again.',
            color: 'red',
          });
        }
      },
    });
  }, []);

  const handleEventSaved = useCallback(
    (savedEvent: Event) => {
      if (editingEvent) {
        setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? savedEvent : e)));
      } else {
        setEvents((prev) => [savedEvent, ...prev]);
      }
      setEventFormOpened(false);
      setEditingEvent(null);
    },
    [editingEvent]
  );

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return {
      upcomingEvents: events.filter((e) => new Date(e.event_date) >= now),
      pastEvents: events.filter((e) => new Date(e.event_date) < now),
    };
  }, [events]);

  if (isLoading) {
    return (
      <Center h="100%">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container size="md" py="xl" px="md">
      <Group justify="space-between" align="center" mb="lg">
        <Title order={2} style={{ color: 'var(--gs-text-heading)' }} fw={500}>
          <Group gap="xs">
            <IconCalendarEvent size={24} />
            Events
          </Group>
        </Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateEvent} size="sm">
          Create Event
        </Button>
      </Group>

      {dataLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : events.length === 0 ? (
        <Paper p="lg" radius="md">
          <Center py="xl">
            <Stack align="center">
              <IconCalendarEvent size={48} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" ta="center">
                No events yet. Create your first event to let people know what you have planned!
              </Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleCreateEvent}
                variant="light"
              >
                Create Event
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="sm">
          {upcomingEvents.length > 0 && (
            <>
              <Text size="sm" fw={500} c="dimmed">
                Upcoming Events ({upcomingEvents.length})
              </Text>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showActions
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              ))}
            </>
          )}

          {pastEvents.length > 0 && (
            <>
              {upcomingEvents.length > 0 && <Divider my="sm" />}
              <Text size="sm" fw={500} c="dimmed">
                Past Events ({pastEvents.length})
              </Text>
              {pastEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showActions
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              ))}
              {pastEvents.length > 3 && (
                <Text size="sm" c="dimmed" ta="center">
                  + {pastEvents.length - 3} more past events
                </Text>
              )}
            </>
          )}
        </Stack>
      )}

      <EventForm
        event={editingEvent}
        opened={eventFormOpened}
        onClose={handleCloseEventForm}
        onSaved={handleEventSaved}
      />
    </Container>
  );
}
