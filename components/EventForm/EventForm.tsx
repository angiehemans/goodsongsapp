'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconCalendarEvent,
  IconCamera,
  IconCurrencyDollar,
  IconLink,
  IconMapPin,
  IconX,
} from '@tabler/icons-react';
import useSWR from 'swr';
import {
  ActionIcon,
  Box,
  Button,
  Combobox,
  Drawer,
  FileButton,
  Flex,
  Group,
  Image,
  InputBase,
  Loader,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  useCombobox,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { apiClient, Event, EventData, Venue } from '@/lib/api';

// SWR fetcher for venues
const fetchVenues = async (search?: string) => apiClient.searchVenues(search);

const AGE_RESTRICTION_OPTIONS = [
  { value: '', label: 'No restriction' },
  { value: 'All Ages', label: 'All Ages' },
  { value: '18+', label: '18+' },
  { value: '21+', label: '21+' },
];

interface EventFormProps {
  /** Band slug for creating events */
  bandSlug: string;
  /** Event to edit (null for create mode) */
  event?: Event | null;
  /** Whether the modal is open */
  opened: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when event is saved successfully */
  onSaved?: (event: Event) => void;
}

export function EventForm({ bandSlug, event, opened, onClose, onSaved }: EventFormProps) {
  const isEditing = !!event;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [ticketLink, setTicketLink] = useState('');
  const [price, setPrice] = useState('');
  const [ageRestriction, setAgeRestriction] = useState('');
  const [eventImage, setEventImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Venue state
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueSearch, setVenueSearch] = useState('');
  const [debouncedVenueSearch] = useDebouncedValue(venueSearch, 300);
  const [showNewVenueForm, setShowNewVenueForm] = useState(false);

  // SWR for venues - cached and only fetches when search changes
  const { data: venues = [], isLoading: venuesLoading } = useSWR(
    opened && !selectedVenue ? ['venues', debouncedVenueSearch] : null,
    () => fetchVenues(debouncedVenueSearch || undefined),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // New venue form
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('');
  const [newVenueRegion, setNewVenueRegion] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const resetRef = useRef<() => void>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Initialize form when editing or reset for create mode
  useEffect(() => {
    if (opened) {
      if (event) {
        setName(event.name);
        setDescription(event.description || '');
        setEventDate(new Date(event.event_date));
        setTicketLink(event.ticket_link || '');
        setPrice(event.price || '');
        setAgeRestriction(event.age_restriction || '');
        setSelectedVenue(event.venue);
        setVenueSearch(event.venue?.name || '');
        setPreviewUrl(event.image_url || null);
      } else {
        // Reset form for create mode
        setName('');
        setDescription('');
        setEventDate(null);
        setTicketLink('');
        setPrice('');
        setAgeRestriction('');
        setSelectedVenue(null);
        setVenueSearch('');
        setEventImage(null);
        setPreviewUrl(null);
        setShowNewVenueForm(false);
        resetNewVenueForm();
      }
    }
  }, [opened, event]);

  const resetNewVenueForm = () => {
    setNewVenueName('');
    setNewVenueAddress('');
    setNewVenueCity('');
    setNewVenueRegion('');
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifications.show({
          title: 'Invalid file type',
          message: 'Please select an image file',
          color: 'red',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        notifications.show({
          title: 'File too large',
          message: 'Please select an image smaller than 5MB',
          color: 'red',
        });
        return;
      }
      setEventImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setEventImage(null);
    setPreviewUrl(null);
    resetRef.current?.();
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setVenueSearch(venue.name);
    setShowNewVenueForm(false);
    combobox.closeDropdown();
  };

  const handleCreateNewVenue = () => {
    setShowNewVenueForm(true);
    setSelectedVenue(null);
    setVenueSearch('');
    combobox.closeDropdown();
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      notifications.show({
        title: 'Name required',
        message: 'Please enter an event name.',
        color: 'red',
      });
      return;
    }

    if (!eventDate) {
      notifications.show({
        title: 'Date required',
        message: 'Please select an event date and time.',
        color: 'red',
      });
      return;
    }

    if (!selectedVenue && !showNewVenueForm) {
      notifications.show({
        title: 'Venue required',
        message: 'Please select a venue or create a new one.',
        color: 'red',
      });
      return;
    }

    if (showNewVenueForm && (!newVenueName.trim() || !newVenueCity.trim())) {
      notifications.show({
        title: 'Venue info required',
        message: 'Please enter the venue name and city.',
        color: 'red',
      });
      return;
    }

    setIsSaving(true);
    try {
      let eventData: EventData;

      // For editing, always include fields so they can be cleared
      // For creating, use undefined for empty optional fields
      const descriptionValue = isEditing ? description.trim() : description.trim() || undefined;
      const ticketLinkValue = isEditing ? ticketLink.trim() : ticketLink.trim() || undefined;
      const priceValue = isEditing ? price.trim() : price.trim() || undefined;
      const ageRestrictionValue = isEditing ? ageRestriction : ageRestriction || undefined;

      if (showNewVenueForm) {
        // Create event with new venue
        eventData = {
          name: name.trim(),
          description: descriptionValue,
          event_date: eventDate.toISOString(),
          ticket_link: ticketLinkValue,
          price: priceValue,
          age_restriction: ageRestrictionValue,
          venue_attributes: {
            name: newVenueName.trim(),
            address: newVenueAddress.trim(),
            city: newVenueCity.trim(),
            region: newVenueRegion.trim(),
          },
        };
      } else {
        // Create event with existing venue
        eventData = {
          name: name.trim(),
          description: descriptionValue,
          event_date: eventDate.toISOString(),
          ticket_link: ticketLinkValue,
          price: priceValue,
          age_restriction: ageRestrictionValue,
          venue_id: selectedVenue!.id,
        };
      }

      let savedEvent: Event;

      if (eventImage) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('event[name]', eventData.name);
        formData.append('event[event_date]', eventData.event_date);

        // For editing, always include fields so they can be cleared
        if (isEditing) {
          formData.append('event[description]', eventData.description || '');
          formData.append('event[ticket_link]', eventData.ticket_link || '');
          formData.append('event[price]', eventData.price || '');
          formData.append('event[age_restriction]', eventData.age_restriction || '');
        } else {
          if (eventData.description) formData.append('event[description]', eventData.description);
          if (eventData.ticket_link) formData.append('event[ticket_link]', eventData.ticket_link);
          if (eventData.price) formData.append('event[price]', eventData.price);
          if (eventData.age_restriction)
            formData.append('event[age_restriction]', eventData.age_restriction);
        }

        if (eventData.venue_id) {
          formData.append('event[venue_id]', eventData.venue_id.toString());
        } else if (eventData.venue_attributes) {
          formData.append('event[venue_attributes][name]', eventData.venue_attributes.name);
          formData.append('event[venue_attributes][address]', eventData.venue_attributes.address);
          formData.append('event[venue_attributes][city]', eventData.venue_attributes.city);
          formData.append('event[venue_attributes][region]', eventData.venue_attributes.region);
        }

        formData.append('event[image]', eventImage);

        if (isEditing) {
          savedEvent = await apiClient.updateEvent(event!.id, formData);
        } else {
          savedEvent = await apiClient.createEvent(bandSlug, formData);
        }
      } else {
        if (isEditing) {
          savedEvent = await apiClient.updateEvent(event!.id, eventData);
        } else {
          savedEvent = await apiClient.createEvent(bandSlug, eventData);
        }
      }

      notifications.show({
        title: isEditing ? 'Event Updated' : 'Event Created',
        message: `"${savedEvent.name}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
        color: 'green',
      });

      onSaved?.(savedEvent);
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      notifications.show({
        title: 'Error',
        message: `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.`,
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const venueOptions = venues.map((venue) => (
    <Combobox.Option key={venue.id} value={venue.id.toString()}>
      <Stack gap={0}>
        <Text size="sm" fw={500}>
          {venue.name}
        </Text>
        <Text size="xs" c="dimmed">
          {[venue.city, venue.region].filter(Boolean).join(', ')}
        </Text>
      </Stack>
    </Combobox.Option>
  ));

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={600} c="blue.8">
          {isEditing ? 'Edit Event' : 'Create Event'}
        </Text>
      }
      position="right"
      size="lg"
      styles={{
        body: { paddingTop: 0 },
      }}
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
    >
      <Stack gap="md">
        {/* Event Image */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Event Image
          </Text>
          {previewUrl ? (
            <Box pos="relative" w={200}>
              <Image src={previewUrl} alt="Event preview" radius="md" h={120} fit="cover" />
              <ActionIcon
                variant="filled"
                color="red"
                size="sm"
                radius="xl"
                pos="absolute"
                top={4}
                right={4}
                onClick={handleRemoveImage}
              >
                <IconX size={14} />
              </ActionIcon>
            </Box>
          ) : (
            <FileButton
              resetRef={resetRef}
              onChange={handleImageSelect}
              accept="image/png,image/jpeg,image/jpg,image/webp"
            >
              {(props) => (
                <Button {...props} variant="light" leftSection={<IconCamera size={16} />}>
                  Upload Image
                </Button>
              )}
            </FileButton>
          )}
        </Box>

        {/* Event Name */}
        <TextInput
          label="Event Name"
          placeholder="Summer Concert, Album Release Party, etc."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          leftSection={<IconCalendarEvent size={16} />}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Tell fans about this event..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minRows={3}
          autosize
        />

        {/* Date & Time */}
        <DateTimePicker
          label="Date & Time"
          placeholder="Select date and time"
          value={eventDate}
          onChange={(value) => setEventDate(value ? new Date(value) : null)}
          required
          minDate={new Date()}
          valueFormat="MM/DD/YYYY hh:mm A"
          timePickerProps={{
            format: '12h',
          }}
        />

        {/* Venue Selection */}
        <Box>
          <Text size="sm" fw={500} mb="xs">
            Venue <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
          </Text>

          {showNewVenueForm ? (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Create New Venue
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setShowNewVenueForm(false);
                    resetNewVenueForm();
                  }}
                >
                  Select Existing
                </Button>
              </Group>
              <TextInput
                placeholder="Venue Name"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                required
              />
              <TextInput
                placeholder="Address"
                value={newVenueAddress}
                onChange={(e) => setNewVenueAddress(e.target.value)}
              />
              <Group grow>
                <TextInput
                  placeholder="City"
                  value={newVenueCity}
                  onChange={(e) => setNewVenueCity(e.target.value)}
                  required
                />
                <TextInput
                  placeholder="State / Region"
                  value={newVenueRegion}
                  onChange={(e) => setNewVenueRegion(e.target.value)}
                />
              </Group>
            </Stack>
          ) : (
            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                const venue = venues.find((v) => v.id.toString() === val);
                if (venue) handleVenueSelect(venue);
              }}
            >
              <Combobox.Target>
                <InputBase
                  placeholder="Search for a venue..."
                  value={venueSearch}
                  onChange={(e) => {
                    setVenueSearch(e.target.value);
                    setSelectedVenue(null);
                    combobox.openDropdown();
                    combobox.updateSelectedOptionIndex();
                  }}
                  onClick={() => combobox.openDropdown()}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  rightSection={venuesLoading ? <Loader size={16} /> : null}
                  leftSection={<IconMapPin size={16} />}
                />
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {venueOptions.length > 0 ? (
                    venueOptions
                  ) : (
                    <Combobox.Empty>No venues found</Combobox.Empty>
                  )}
                </Combobox.Options>
                <Combobox.Footer>
                  <Button
                    variant="subtle"
                    size="xs"
                    fullWidth
                    onClick={handleCreateNewVenue}
                    leftSection={<IconMapPin size={14} />}
                  >
                    Create New Venue
                  </Button>
                </Combobox.Footer>
              </Combobox.Dropdown>
            </Combobox>
          )}
        </Box>

        {/* Ticket Link */}
        <TextInput
          label="Ticket Link"
          placeholder="https://tickets.example.com/..."
          value={ticketLink}
          onChange={(e) => setTicketLink(e.target.value)}
          leftSection={<IconLink size={16} />}
        />

        <Flex gap="sm" w="100%">
          {/* Price */}
          <TextInput
            label="Price"
            placeholder="$15, Free, $10-$20, etc."
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            leftSection={<IconCurrencyDollar size={16} />}
            w="100%"
          />

          {/* Age Restriction */}
          <Select
            label="Age Restriction"
            placeholder="Select age restriction"
            data={AGE_RESTRICTION_OPTIONS}
            value={ageRestriction}
            onChange={(value) => setAgeRestriction(value || '')}
            clearable
            w="100%"
          />
        </Flex>
        {/* Actions */}
        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
