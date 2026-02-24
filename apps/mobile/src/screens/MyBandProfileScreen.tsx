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
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { Band, Review, Event } from '@goodsongs/api-client';
import { RootStackParamList } from '@/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export function MyBandProfileScreen({ navigation }: Props) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(() => createThemedStyles(themeColors), [themeColors]);
  const [band, setBand] = useState<Band | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBand = useCallback(async () => {
    try {
      const bands = await apiClient.getUserBands();
      if (bands.length > 0) {
        const [bandDetails, bandEvents] = await Promise.all([
          apiClient.getBand(bands[0].slug),
          apiClient.getBandEvents(bands[0].slug),
        ]);
        setBand(bandDetails);
        setEvents(bandEvents || []);
      }
    } catch (error) {
      console.error('Failed to fetch band:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBand();
  }, [fetchBand]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBand();
  };

  const handleOpenLink = (url: string | undefined) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleEditBand = () => {
    if (band) {
      navigation.navigate('EditBand', { slug: band.slug });
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
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

  const renderBandHeader = () => (
    <View style={styles.profileSection}>
      {/* Band Info */}
      <View style={styles.profileHeader}>
        <ProfilePhoto
          src={fixImageUrl(band?.profile_picture_url) || fixImageUrl(band?.spotify_image_url)}
          alt={band?.name}
          size={72}
          fallback={band?.name || 'B'}
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.bandName, themedStyles.bandName]}>{band?.name || 'Your Band'}</Text>
          {(band?.location || band?.city) && (
            <View style={styles.locationRow}>
              <Icon name="map-pin" size={14} color={themeColors.iconMuted} />
              <Text style={[styles.location, themedStyles.location]}>
                {band?.city && band?.region
                  ? `${band.city}, ${band.region}`
                  : band?.location || band?.city}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Streaming Links */}
      <View style={styles.linksRow}>
        {band?.spotify_link && (
          <TouchableOpacity
            style={[styles.linkButton, themedStyles.linkButton]}
            onPress={() => handleOpenLink(band.spotify_link)}
          >
            <Text style={[styles.linkButtonText, themedStyles.linkButtonText]}>Spotify</Text>
          </TouchableOpacity>
        )}
        {band?.bandcamp_link && (
          <TouchableOpacity
            style={[styles.linkButton, themedStyles.linkButton]}
            onPress={() => handleOpenLink(band.bandcamp_link)}
          >
            <Text style={[styles.linkButtonText, themedStyles.linkButtonText]}>Bandcamp</Text>
          </TouchableOpacity>
        )}
        {band?.apple_music_link && (
          <TouchableOpacity
            style={[styles.linkButton, themedStyles.linkButton]}
            onPress={() => handleOpenLink(band.apple_music_link)}
          >
            <Text style={[styles.linkButtonText, themedStyles.linkButtonText]}>Apple Music</Text>
          </TouchableOpacity>
        )}
        {band?.youtube_music_link && (
          <TouchableOpacity
            style={[styles.linkButton, themedStyles.linkButton]}
            onPress={() => handleOpenLink(band.youtube_music_link)}
          >
            <Text style={[styles.linkButtonText, themedStyles.linkButtonText]}>YouTube</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* About */}
      {band?.about && <Text style={[styles.about, themedStyles.about]}>{band.about}</Text>}

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

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Upcoming Events</Text>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, themedStyles.eventCard]}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            >
              <View style={styles.eventInfo}>
                <Text style={[styles.eventName, themedStyles.eventName]}>{event.name}</Text>
                <Text style={[styles.eventDate, themedStyles.eventDate]}>{formatEventDate(event.event_date)}</Text>
                {event.venue && (
                  <Text style={[styles.eventVenue, themedStyles.eventVenue]}>
                    {event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ''}
                  </Text>
                )}
              </View>
              {event.ticket_link && (
                <TouchableOpacity
                  style={[styles.ticketButton, themedStyles.ticketButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleOpenLink(event.ticket_link);
                  }}
                >
                  <Text style={[styles.ticketButtonText, themedStyles.ticketButtonText]}>Tickets</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Recommendations Title */}
      <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Recommendations</Text>
    </View>
  );

  // Memoized render function - must be defined before any early returns
  const renderReviewItem = useCallback(({ item }: { item: Review }) => (
    <View style={styles.reviewWrapper}>
      <ReviewCard
        review={item}
        onPressAuthor={(username: string) =>
          navigation.navigate('UserProfile', { username })
        }
        showBandInfo={false}
      />
    </View>
  ), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header
          title="Profile"
          rightIcon="edit-2"
          onRightPress={handleEditBand}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.btnPrimaryBg} />
        </View>
      </SafeAreaView>
    );
  }

  if (!band) {
    return (
      <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
        <Header title="Profile" />
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
    <SafeAreaView style={[styles.container, themedStyles.container]} edges={['top']}>
      <Header
        title="Profile"
        rightIcon="edit-2"
        onRightPress={handleEditBand}
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[themeColors.btnPrimaryBg]}
            tintColor={themeColors.btnPrimaryBg}
          />
        }
        ListHeaderComponent={renderBandHeader}
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message="When fans recommend your music, it will appear here."
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    bandName: {
      color: colors.textHeading,
    },
    location: {
      color: colors.textMuted,
    },
    linkButton: {
      backgroundColor: colors.bgSurfaceAlt,
      borderColor: colors.borderDefault,
    },
    linkButtonText: {
      color: colors.btnPrimaryBg,
    },
    about: {
      color: colors.textSecondary,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    eventCard: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderDefault,
    },
    eventName: {
      color: colors.textHeading,
    },
    eventDate: {
      color: colors.textSecondary,
    },
    eventVenue: {
      color: colors.textMuted,
    },
    ticketButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    ticketButtonText: {
      color: colors.btnPrimaryText,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  profileSection: {
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
    borderWidth: 1,
  },
  linkButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  about: {
    fontSize: theme.fontSizes.sm,
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
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    lineHeight: 32,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: theme.fontSizes.sm,
  },
  eventVenue: {
    fontSize: theme.fontSizes.xs,
    marginTop: 2,
  },
  ticketButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  ticketButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
});
