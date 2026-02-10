import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import { Header, ProfilePhoto, Button } from '@/components';
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { Event } from '@goodsongs/api-client';

export function EventDetailsScreen({ route, navigation }: any) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    try {
      const eventData = await apiClient.getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleOpenLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleOpenMaps = () => {
    if (event?.venue) {
      const query = encodeURIComponent(
        `${event.venue.name}, ${event.venue.address || ''} ${event.venue.city || ''} ${event.venue.region || ''}`
      );
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title=""
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title=""
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title=""
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Event Image */}
        {event.image_url && (
          <Image
            source={{ uri: fixImageUrl(event.image_url) }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        )}

        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.name}</Text>

        {/* Band Info */}
        {event.band && (
          <TouchableOpacity
            style={styles.bandRow}
            onPress={() => navigation.navigate('BandProfile', { slug: event.band.slug })}
          >
            <ProfilePhoto
              src={fixImageUrl(event.band.profile_picture_url) || fixImageUrl(event.band.spotify_image_url)}
              alt={event.band.name}
              size={40}
              fallback={event.band.name || 'B'}
            />
            <Text style={styles.bandName}>{event.band.name}</Text>
            <Icon name="chevron-right" size={20} color={colors.grape[5]} />
          </TouchableOpacity>
        )}

        {/* Date & Time */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Icon name="calendar" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(event.event_date)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Icon name="clock" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formatTime(event.event_date)}</Text>
            </View>
          </View>
        </View>

        {/* Venue */}
        {event.venue && (
          <TouchableOpacity style={styles.venueSection} onPress={handleOpenMaps}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Icon name="map-pin" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Venue</Text>
                <Text style={styles.infoValue}>{event.venue.name}</Text>
                {(event.venue.address || event.venue.city) && (
                  <Text style={styles.venueAddress}>
                    {[event.venue.address, event.venue.city, event.venue.region]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                )}
              </View>
              <Icon name="external-link" size={16} color={colors.grape[5]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Price & Age */}
        {(event.price || event.age_restriction) && (
          <View style={styles.detailsRow}>
            {event.price && (
              <View style={styles.detailBadge}>
                <Icon name="dollar-sign" size={14} color={colors.grape[6]} />
                <Text style={styles.detailText}>{event.price}</Text>
              </View>
            )}
            {event.age_restriction && (
              <View style={styles.detailBadge}>
                <Icon name="user" size={14} color={colors.grape[6]} />
                <Text style={styles.detailText}>{event.age_restriction}</Text>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {/* Ticket Button */}
        {event.ticket_link && (
          <Button
            title="Get Tickets"
            onPress={() => handleOpenLink(event.ticket_link)}
            fullWidth
            icon="external-link"
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grape[0],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fontSizes.base,
    color: colors.grape[5],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: colors.grape[2],
  },
  eventTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 32,
  },
  bandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  bandName: {
    flex: 1,
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  infoSection: {
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.md,
    backgroundColor: colors.grape[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSizes.xs,
    color: colors.grape[5],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSizes.base,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  venueSection: {
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  venueAddress: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  detailText: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fontSizes.base,
    color: colors.grey[7],
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 40,
  },
});
