import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/feather';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header, ProfilePhoto, Badge, ReviewCard, EmptyState, MusicPlayer } from '@/components';
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { useAuthStore } from '@/context/authStore';
import { Band, Review, Event } from '@goodsongs/api-client';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function BandDashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [band, setBand] = useState<Band | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBandData = useCallback(async () => {
    try {
      // Get user's bands
      const bands = await apiClient.getUserBands();
      if (bands.length > 0) {
        const userBand = bands[0];
        // Get full band details including reviews
        const [bandDetails, bandEvents] = await Promise.all([
          apiClient.getBand(userBand.slug),
          apiClient.getBandEvents(userBand.slug),
        ]);
        setBand(bandDetails);
        setEvents(bandEvents || []);
      }
    } catch (error) {
      console.error('Failed to fetch band data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBandData();
  }, [fetchBandData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBandData();
  };

  const handleOpenLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleEditBand = () => {
    if (band) {
      navigation.navigate('EditBand', { slug: band.slug });
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const upcomingEvents = events.filter(
    (event) => new Date(event.event_date) >= new Date()
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Band Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={fixImageUrl(band?.profile_picture_url) || fixImageUrl(band?.spotify_image_url)}
          alt={band?.name}
          size={72}
          fallback={band?.name || 'B'}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.bandName}>{band?.name || 'Your Band'}</Text>
          {(band?.location || band?.city) && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={colors.grape[5]} />
              <Text style={styles.location}>
                {band?.city && band?.region
                  ? `${band.city}, ${band.region}`
                  : band?.location || band?.city}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditBand}>
          <Icon name="edit-2" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Streaming Links */}
      <View style={styles.linksRow}>
        {band?.spotify_link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(band.spotify_link)}
          >
            <Text style={styles.linkButtonText}>Spotify</Text>
          </TouchableOpacity>
        )}
        {band?.bandcamp_link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(band.bandcamp_link)}
          >
            <Text style={styles.linkButtonText}>Bandcamp</Text>
          </TouchableOpacity>
        )}
        {band?.apple_music_link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(band.apple_music_link)}
          >
            <Text style={styles.linkButtonText}>Apple Music</Text>
          </TouchableOpacity>
        )}
        {band?.youtube_music_link && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(band.youtube_music_link)}
          >
            <Text style={styles.linkButtonText}>YouTube</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* About */}
      {band?.about && <Text style={styles.about}>{band.about}</Text>}

      {/* Music Player Embed */}
      {(band?.bandcamp_embed || band?.spotify_link || band?.youtube_music_link || band?.apple_music_link) && (
        <View style={styles.playerSection}>
          <MusicPlayer
            bandcampEmbed={band?.bandcamp_embed}
            spotifyLink={band?.spotify_link}
            youtubeMusicLink={band?.youtube_music_link}
            appleMusicLink={band?.apple_music_link}
          />
        </View>
      )}

      {/* Stats Badges */}
      <View style={styles.badgesRow}>
        <Badge
          text={`${band?.reviews_count || 0} recommendation${(band?.reviews_count || 0) !== 1 ? 's' : ''}`}
        />
      </View>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>{formatEventDate(event.event_date)}</Text>
                {event.venue && (
                  <Text style={styles.eventVenue}>
                    {event.venue.name}, {event.venue.city}
                  </Text>
                )}
              </View>
              {event.ticket_link && (
                <TouchableOpacity
                  style={styles.ticketButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenLink(event.ticket_link);
                  }}
                >
                  <Text style={styles.ticketButtonText}>Tickets</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Recommendations Title */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Dashboard"
          rightIcon="settings"
          onRightPress={handleSettings}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!band) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Dashboard"
          rightIcon="settings"
          onRightPress={handleSettings}
        />
        <EmptyState
          icon="music"
          title="No band found"
          message="You don't have a band profile yet."
        />
      </SafeAreaView>
    );
  }

  const reviews: Review[] = band?.reviews || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Dashboard"
        rightIcon="settings"
        onRightPress={handleSettings}
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewWrapper}>
            <ReviewCard
              review={item}
              onPressAuthor={(username: string) =>
                navigation.navigate('UserProfile', { username })
              }
              showBandInfo={false}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message="When fans recommend your music, it will appear here."
          />
        }
      />
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
  listContent: {
    padding: theme.spacing.md,
  },
  headerSection: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  bandName: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    lineHeight: 30,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  location: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[5],
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  linkButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: colors.grape[2],
    borderWidth: 1,
    borderColor: colors.grape[3],
  },
  linkButtonText: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  about: {
    fontSize: theme.fontSizes.sm,
    color: colors.grey[7],
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  playerSection: {
    marginBottom: theme.spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.thecoaBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    lineHeight: 32,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grape[1],
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: colors.grape[3],
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: theme.fontSizes.sm,
    color: colors.grape[6],
  },
  eventVenue: {
    fontSize: theme.fontSizes.xs,
    color: colors.grey[5],
    marginTop: 2,
  },
  ticketButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  ticketButtonText: {
    fontSize: theme.fontSizes.sm,
    color: 'white',
    fontWeight: '600',
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
});
