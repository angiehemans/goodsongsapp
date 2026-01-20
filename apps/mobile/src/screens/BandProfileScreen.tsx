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
import { Header, ProfilePhoto, Badge, ReviewCard, EmptyState } from '@/components';
import { theme, colors } from '@/theme';
import { apiClient } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';
import { Band, Review } from '@goodsongs/api-client';

export function BandProfileScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBand = useCallback(async () => {
    try {
      const bandData = await apiClient.getBand(slug);
      setBand(bandData);
    } catch (error) {
      console.error('Failed to fetch band:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug]);

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
          <Text style={styles.bandName}>{band?.name || slug}</Text>
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
      {band?.about && (
        <Text style={styles.about}>{band.about}</Text>
      )}

      {/* Stats Badges */}
      <View style={styles.badgesRow}>
        <Badge text={`${band?.reviews_count || 0} recommendation${(band?.reviews_count || 0) !== 1 ? 's' : ''}`} />
        {band?.genres && band.genres.length > 0 && (
          band.genres.slice(0, 2).map((genre, index) => (
            <Badge key={index} text={genre} />
          ))
        )}
      </View>

      {/* Recommendations Title */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
    </View>
  );

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

  const reviews: Review[] = band?.reviews || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title=""
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewWrapper}>
            <ReviewCard
              review={item}
              onPressAuthor={(username) => navigation.navigate('UserProfile', { username })}
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
        ListHeaderComponent={renderBandHeader}
        ListEmptyComponent={
          <EmptyState
            icon="music"
            title="No recommendations yet"
            message={`No one has recommended ${band?.name || 'this band'} yet. Be the first!`}
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
    fontFamily: theme.fonts.cooperBold,
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes['2xl'],
    fontFamily: theme.fonts.cooperBold,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 32,
  },
  reviewWrapper: {
    marginBottom: theme.spacing.md,
  },
});
