import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { IconX, IconCheck, IconRefresh, IconPhoto } from '@tabler/icons-react-native';
import { theme } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { SemanticColors } from '@/theme/semanticColors';
import { apiClient, ArtworkOption } from '@/utils/api';
import { fixImageUrl } from '@/utils/imageUrl';

interface ArtworkPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (artworkUrl: string) => Promise<void>;
  trackName: string;
  artistName: string;
  albumName?: string;
  currentArtworkUrl?: string | null;
  hasPreferredArtwork?: boolean;
  onClearPreferred?: () => Promise<void>;
}

export function ArtworkPickerModal({
  visible,
  onClose,
  onSelect,
  trackName,
  artistName,
  albumName,
  currentArtworkUrl,
  hasPreferredArtwork,
  onClearPreferred,
}: ArtworkPickerModalProps) {
  const { colors: themeColors } = useTheme();
  const themedStyles = React.useMemo(
    () => createThemedStyles(themeColors),
    [themeColors],
  );
  const [loading, setLoading] = useState(false);
  const [exactMatches, setExactMatches] = useState<ArtworkOption[]>([]);
  const [artistCatalog, setArtistCatalog] = useState<ArtworkOption[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      fetchArtworkOptions();
    } else {
      // Reset state when modal closes
      setExactMatches([]);
      setArtistCatalog([]);
      setSelectedUrl(null);
      setError(null);
      setFailedImages(new Set());
    }
  }, [visible, trackName, artistName]);

  const fetchArtworkOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.searchArtwork(trackName, artistName, albumName);
      // Use the new sectioned response structure
      setExactMatches(response.exact_matches || []);
      setArtistCatalog(response.artist_catalog || []);
    } catch (err) {
      console.error('Failed to fetch artwork options:', err);
      setError('Failed to load artwork options');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selectedUrl) return;

    setSaving(true);
    try {
      await onSelect(selectedUrl);
      onClose();
    } catch (err) {
      console.error('Failed to set artwork:', err);
      setError('Failed to save artwork');
    } finally {
      setSaving(false);
    }
  };

  const handleClearPreferred = async () => {
    if (!onClearPreferred) return;

    setSaving(true);
    try {
      await onClearPreferred();
      onClose();
    } catch (err) {
      console.error('Failed to clear preferred artwork:', err);
      setError('Failed to reset artwork');
    } finally {
      setSaving(false);
    }
  };

  const handleImageError = useCallback((url: string) => {
    setFailedImages(prev => new Set(prev).add(url));
  }, []);

  const renderArtworkItem = (item: ArtworkOption, index: number) => {
    const isSelected = selectedUrl === item.url;
    const isCurrent = currentArtworkUrl && fixImageUrl(currentArtworkUrl) === fixImageUrl(item.url);
    const hasFailed = failedImages.has(item.url);
    const imageUrl = fixImageUrl(item.url);

    return (
      <TouchableOpacity
        key={`${item.url}-${index}`}
        style={[styles.artworkItem, themedStyles.artworkItem, isSelected && styles.artworkItemSelected]}
        onPress={() => setSelectedUrl(item.url)}
        activeOpacity={0.7}
      >
        <View style={styles.artworkImageContainer}>
          {hasFailed || !imageUrl ? (
            <View style={[styles.artworkImage, styles.artworkImagePlaceholder, themedStyles.artworkImagePlaceholder]}>
              <IconPhoto size={32} color={themeColors.iconMuted} />
              <Text style={[styles.failedText, themedStyles.failedText]}>Failed to load</Text>
            </View>
          ) : (
            <FastImage
              source={{ uri: imageUrl }}
              style={styles.artworkImage}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => handleImageError(item.url)}
            />
          )}
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <IconCheck size={24} color={themeColors.btnPrimaryText} />
            </View>
          )}
          {isCurrent && !isSelected && (
            <View style={[styles.currentBadge, themedStyles.currentBadge]}>
              <Text style={[styles.currentBadgeText, themedStyles.currentBadgeText]}>Current</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sourceText, themedStyles.sourceText]}>{item.source_display}</Text>
        {item.album_name && (
          <Text style={[styles.albumText, themedStyles.albumText]} numberOfLines={1}>
            {item.album_name}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderArtworkGrid = (items: ArtworkOption[]) => {
    const rows: ArtworkOption[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.artworkRow}>
            {row.map((item, index) => renderArtworkItem(item, rowIndex * 2 + index))}
            {row.length === 1 && <View style={styles.artworkItemPlaceholderSpace} />}
          </View>
        ))}
      </View>
    );
  };

  const hasResults = exactMatches.length > 0 || artistCatalog.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, themedStyles.container]}>
        {/* Header */}
        <View style={[styles.header, themedStyles.header]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.title, themedStyles.title]}>Choose Artwork</Text>
            <Text style={[styles.subtitle, themedStyles.subtitle]} numberOfLines={1}>
              {trackName} - {artistName}
            </Text>
            {albumName && (
              <Text style={[styles.albumSubtitle, themedStyles.albumSubtitle]} numberOfLines={1}>
                {albumName}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={fetchArtworkOptions}
            style={styles.refreshButton}
            disabled={loading}
          >
            <IconRefresh size={20} color={themeColors.iconMuted} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.btnPrimaryBg} />
            <Text style={[styles.loadingText, themedStyles.loadingText]}>Searching for artwork...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, themedStyles.errorText]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, themedStyles.retryButton]} onPress={fetchArtworkOptions}>
              <Text style={[styles.retryButtonText, themedStyles.retryButtonText]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : !hasResults ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, themedStyles.emptyText]}>No artwork found for this track</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {exactMatches.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Exact Matches</Text>
                <Text style={[styles.sectionSubtitle, themedStyles.sectionSubtitle]}>
                  Artwork from albums containing this track
                </Text>
                {renderArtworkGrid(exactMatches)}
              </View>
            )}
            {artistCatalog.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, themedStyles.sectionTitle]}>Artist Catalog</Text>
                <Text style={[styles.sectionSubtitle, themedStyles.sectionSubtitle]}>
                  Other albums by {artistName}
                </Text>
                {renderArtworkGrid(artistCatalog)}
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={[styles.footer, themedStyles.footer]}>
          {hasPreferredArtwork && onClearPreferred && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearPreferred}
              disabled={saving}
            >
              <Text style={[styles.clearButtonText, themedStyles.clearButtonText]}>Reset to Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.selectButton,
              themedStyles.selectButton,
              (!selectedUrl || saving) && styles.selectButtonDisabled,
              (!selectedUrl || saving) && themedStyles.selectButtonDisabled,
            ]}
            onPress={handleSelect}
            disabled={!selectedUrl || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={themeColors.btnPrimaryText} />
            ) : (
              <Text style={[styles.selectButtonText, themedStyles.selectButtonText]}>Use Selected Artwork</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Calculate item width: screen width - padding (md * 2) - gap (md) / 2 columns
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_GAP = theme.spacing.md;
const CONTAINER_PADDING = theme.spacing.md;
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - ITEM_GAP) / 2;

// Themed styles that change based on light/dark mode
const createThemedStyles = (colors: SemanticColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.bgApp,
    },
    header: {
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      color: colors.textHeading,
    },
    subtitle: {
      color: colors.textMuted,
    },
    albumSubtitle: {
      color: colors.textPlaceholder,
    },
    loadingText: {
      color: colors.textMuted,
    },
    errorText: {
      color: colors.textMuted,
    },
    retryButton: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    retryButtonText: {
      color: colors.textSecondary,
    },
    emptyText: {
      color: colors.textMuted,
    },
    sectionTitle: {
      color: colors.textHeading,
    },
    sectionSubtitle: {
      color: colors.textMuted,
    },
    artworkItem: {
      backgroundColor: colors.bgSurface,
    },
    artworkImagePlaceholder: {
      backgroundColor: colors.bgSurfaceAlt,
    },
    failedText: {
      color: colors.textMuted,
    },
    currentBadge: {
      backgroundColor: colors.btnPrimaryBg,
    },
    currentBadgeText: {
      color: colors.btnPrimaryText,
    },
    sourceText: {
      color: colors.textSecondary,
    },
    albumText: {
      color: colors.textMuted,
    },
    footer: {
      borderTopColor: colors.borderSubtle,
    },
    clearButtonText: {
      color: colors.textMuted,
    },
    selectButton: {
      backgroundColor: colors.btnPrimaryBg,
    },
    selectButtonDisabled: {
      backgroundColor: colors.iconSubtle,
    },
    selectButtonText: {
      color: colors.btnPrimaryText,
    },
  });

// Static styles that don't change with theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fonts.thecoaBold,
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    marginTop: 2,
  },
  albumSubtitle: {
    fontSize: theme.fontSizes.xs,
    marginTop: 1,
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSizes.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.md,
  },
  retryButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.base,
    textAlign: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.base,
    fontFamily: theme.fonts.thecoaBold,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.xs,
    marginBottom: theme.spacing.sm,
  },
  artworkRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  artworkItemPlaceholderSpace: {
    width: ITEM_WIDTH,
  },
  artworkItem: {
    width: ITEM_WIDTH,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  artworkItemSelected: {
    borderWidth: 3,
    borderColor: '#6366f1',
  },
  artworkImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  failedText: {
    fontSize: 10,
    textAlign: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radii.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sourceText: {
    fontSize: theme.fontSizes.xs,
    padding: theme.spacing.xs,
    paddingBottom: 0,
  },
  albumText: {
    fontSize: theme.fontSizes.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  clearButtonText: {
    fontSize: theme.fontSizes.sm,
  },
  selectButton: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  selectButtonDisabled: {},
  selectButtonText: {
    fontSize: theme.fontSizes.base,
    fontWeight: '600',
  },
});
